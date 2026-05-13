import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createToken, requireAuth, requireRole } from './auth.js';
import { saveNotificationLog, upsertDeviceToken } from './db.js';
import { buildNotificationPayload, driverNotificationFlows, passengerNotificationFlows } from './notification-flows.js';
import { sendPush } from './push.js';
import { addRealtimeClient, publishRealtime } from './realtime.js';
import { addNotification, nextId, paginate, persistStore, publicUser, store } from './store.js';
import { sendEmailNotification } from './email-notifier.js';
import { sendWhatsAppNotification } from './whatsapp-notifier.js';
import { normalizePhone, sendWhatsAppOtp, verifyWhatsAppOtp } from './whatsapp-otp.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '0.0.0.0';
const corsOrigin = !process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*'
  ? true
  : process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

function requireFields(body, fields) {
  return fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
}

function badRequest(res, missing) {
  return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
}

function asNumber(value) {
  return Number.parseInt(value, 10);
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function haversineKm(firstLat, firstLng, secondLat, secondLng) {
  if ([firstLat, firstLng, secondLat, secondLng].some((value) => Number.isNaN(Number(value)))) return null;
  const earthRadiusKm = 6371;
  const toRadians = (value) => (Number(value) * Math.PI) / 180;
  const latDelta = toRadians(secondLat - firstLat);
  const lngDelta = toRadians(secondLng - firstLng);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(firstLat)) * Math.cos(toRadians(secondLat)) * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function rideMatchesRoute(ride, origin, destination) {
  const originText = normalizeText(origin);
  const destinationText = normalizeText(destination);
  const rideOrigin = `${ride.origin} ${ride.pickup_point}`.toLowerCase();
  const rideDestination = `${ride.destination} ${ride.drop_point}`.toLowerCase();
  return (!originText || rideOrigin.includes(originText) || originText.includes(normalizeText(ride.origin))) &&
    (!destinationText || rideDestination.includes(destinationText) || destinationText.includes(normalizeText(ride.destination)));
}

function publicMessage(message) {
  const sender = store.users.find((user) => user.user_id === message.sender_id);
  const receiver = store.users.find((user) => user.user_id === message.receiver_id);
  return {
    ...message,
    sender: sender ? publicUser(sender) : null,
    receiver: receiver ? publicUser(receiver) : null,
  };
}

function notifyUserMobile(userId, title, message, variables) {
  const user = store.users.find((item) => item.user_id === Number(userId));
  sendWhatsAppNotification({ phone: user?.phone, title, message, variables }).catch((error) => {
    console.error(`WhatsApp notification failed for user ${userId}: ${error.message}`);
  });
  sendEmailNotification({ to: user?.email, subject: title, message }).catch((error) => {
    console.error(`Email notification failed for user ${userId}: ${error.message}`);
  });
}

function sendOtpEmail({ phone, email, otp }) {
  if (!otp) return;
  const normalizedPhone = normalizePhone(phone);
  const existingUser = store.users.find((candidate) => normalizePhone(candidate.phone) === normalizedPhone);
  const recipient = email || existingUser?.email;
  sendEmailNotification({
    to: recipient,
    subject: 'Your shareMILES OTP',
    message: `Your shareMILES OTP is ${otp}. It expires in ${Math.round(Number(process.env.OTP_TTL_SECONDS || 600) / 60)} minutes.`,
  }).catch((error) => {
    console.error(`OTP email notification failed for ${normalizedPhone}: ${error.message}`);
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'fastforward-api', realtime: 'sse', persistence: 'mysql-ready-memory-fallback' });
});

app.post('/api/auth/send-otp', async (req, res, next) => {
  const missing = requireFields(req.body, ['phone']);
  if (missing.length) return badRequest(res, missing);
  if (!normalizePhone(req.body.phone)) {
    return res.status(422).json({ error: 'Enter a valid 10 digit numeric mobile number' });
  }

  try {
    const result = await sendWhatsAppOtp(req.body.phone);
    sendOtpEmail({ phone: req.body.phone, email: req.body.email, otp: result.otp });
    const { otp, exposeOtp, ...publicResult } = result;
    res.json({ ok: true, ...publicResult, ...(exposeOtp ? { testOtp: otp } : {}) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  const missing = requireFields(req.body, ['phone', 'otp']);
  if (missing.length) return badRequest(res, missing);

  try {
    const normalizedPhone = normalizePhone(req.body.phone);
    const verification = await verifyWhatsAppOtp(normalizedPhone, req.body.otp);
    if (!verification.ok) {
      return res.status(422).json({ error: verification.message || 'Invalid OTP', verification });
    }

    let user = store.users.find((candidate) => normalizePhone(candidate.phone) === normalizedPhone);
    const isNewUser = !user;
    if (!user) {
      user = {
        user_id: nextId(store.users, 'user_id'),
        full_name: req.body.fullName || 'New Rider',
        email: req.body.email || `user${Date.now()}@example.com`,
        phone: normalizedPhone,
        age: null,
        bio: '',
        rating: 0,
        role: req.body.role || 'passenger',
        verification_status: 'phone_verified',
        passenger_verification_status: 'pending',
        gov_id_number: '',
        gov_id_front_url: '',
        gov_id_back_url: '',
        wallet_balance: 0,
        warning_count: 0,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.users.push(user);
    } else {
      user.phone = normalizedPhone;
      if (req.body.email && !user.email) user.email = req.body.email;
      user.role = req.body.role || user.role;
      user.verification_status = user.verification_status === 'verified' ? 'verified' : 'phone_verified';
      user.updated_at = new Date().toISOString();
    }

    persistStore();
    notifyUserMobile(
      user.user_id,
      isNewUser ? 'Signup successful' : 'Login successful',
      isNewUser ? 'Your shareMILES account has been created.' : 'Your shareMILES account was logged in.',
    );
    res.json({ ok: true, token: createToken(user), user, verification });
  } catch (error) {
    next(error);
  }
});

app.get('/api/realtime', requireAuth, (req, res) => {
  addRealtimeClient(req.user.sub, res);
});

app.get('/api/users/me', requireAuth, (req, res) => {
  const user = store.users.find((item) => item.user_id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const vehicles = store.vehicles.filter((vehicle) => vehicle.owner_id === user.user_id);
  const reviews = store.reviews
    .filter((review) => review.reviewee_id === user.user_id)
    .map((review) => ({
      ...review,
      reviewer: publicUser(store.users.find((item) => item.user_id === review.reviewer_id) || {}),
    }));
  const completedRides = store.rides.filter((ride) => ride.driver_id === user.user_id && ride.status === 'completed').length;
  res.json({
    ok: true,
    user,
    vehicles,
    reviews,
    stats: {
      vehicles: vehicles.length,
      reviews: reviews.length,
      completedRides,
      savedPassengers: store.saved_passengers.filter((item) => item.driver_id === user.user_id).length,
    },
  });
});

app.patch('/api/users/me', requireAuth, (req, res) => {
  const user = store.users.find((item) => item.user_id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const allowed = [
    'full_name',
    'age',
    'bio',
    'photo_url',
    'travel_preferences',
    'gov_id_number',
    'gov_id_front_url',
    'gov_id_back_url',
    'passenger_verification_status',
  ];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });
  user.updated_at = new Date().toISOString();
  persistStore();
  res.json({ ok: true, user });
});

app.get('/api/rides', requireAuth, (req, res) => {
  const { origin, destination, verified, instant, status, originLat, originLng, destinationLat, destinationLng } = req.query;
  let rides = [...store.rides];
  if (origin || destination) rides = rides.filter((ride) => rideMatchesRoute(ride, origin, destination));
  const hasSearchCoordinates = originLat && originLng && destinationLat && destinationLng;
  if (hasSearchCoordinates) {
    rides = rides.filter((ride) => {
      if (![ride.origin_lat, ride.origin_lng, ride.destination_lat, ride.destination_lng].every((value) => value !== undefined)) {
        return rideMatchesRoute(ride, origin, destination);
      }
      const pickupDistance = haversineKm(Number(originLat), Number(originLng), ride.origin_lat, ride.origin_lng);
      const dropDistance = haversineKm(Number(destinationLat), Number(destinationLng), ride.destination_lat, ride.destination_lng);
      return pickupDistance !== null && dropDistance !== null && pickupDistance <= 10 && dropDistance <= 10;
    });
  }
  if (status) rides = rides.filter((ride) => ride.status === status);
  if (instant === 'true') rides = rides.filter((ride) => ride.instant_booking);
  if (verified === 'true') {
    rides = rides.filter((ride) => {
      const driver = store.users.find((user) => user.user_id === ride.driver_id);
      return driver?.verification_status === 'verified';
    });
  }

  res.json({ ok: true, ...paginate(rides, req) });
});

app.post('/api/rides', requireAuth, requireRole('driver', 'admin'), (req, res) => {
  const missing = requireFields(req.body, ['vehicleId', 'origin', 'destination', 'departureAt', 'pricePerSeat', 'totalSeats']);
  if (missing.length) return badRequest(res, missing);
  const driver = store.users.find((item) => item.user_id === req.user.sub);
  if (driver?.verification_status !== 'verified') {
    return res.status(409).json({ error: 'Owner profile verification must be complete before publishing' });
  }
  const vehicle = store.vehicles.find((item) => item.vehicle_id === asNumber(req.body.vehicleId) && item.owner_id === req.user.sub);
  if (!vehicle || vehicle.status !== 'verified') return res.status(409).json({ error: 'Driver needs a verified vehicle before publishing' });

  const ride = {
    ride_id: nextId(store.rides, 'ride_id'),
    driver_id: req.user.sub,
    vehicle_id: asNumber(req.body.vehicleId),
    origin: req.body.origin,
    destination: req.body.destination,
    pickup_point: req.body.pickupPoint || req.body.origin,
    drop_point: req.body.dropPoint || req.body.destination,
    origin_lat: req.body.originLat === undefined ? null : Number(req.body.originLat),
    origin_lng: req.body.originLng === undefined ? null : Number(req.body.originLng),
    destination_lat: req.body.destinationLat === undefined ? null : Number(req.body.destinationLat),
    destination_lng: req.body.destinationLng === undefined ? null : Number(req.body.destinationLng),
    departure_at: req.body.departureAt,
    price_per_seat: Number(req.body.pricePerSeat),
    seats_available: asNumber(req.body.totalSeats),
    total_seats: asNumber(req.body.totalSeats),
    instant_booking: Boolean(req.body.instantBooking),
    stops: req.body.stops || [],
    status: req.body.status || 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store.rides.unshift(ride);
  persistStore();
  res.status(201).json({ ok: true, ride });
});

app.get('/api/rides/:rideId', requireAuth, (req, res) => {
  const ride = store.rides.find((item) => item.ride_id === asNumber(req.params.rideId));
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  res.json({ ok: true, ride });
});

app.patch('/api/rides/:rideId', requireAuth, (req, res) => {
  const ride = store.rides.find((item) => item.ride_id === asNumber(req.params.rideId));
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  if (ride.driver_id !== req.user.sub && req.user.role !== 'admin') return res.status(403).json({ error: 'Not ride owner' });
  Object.assign(ride, req.body, { updated_at: new Date().toISOString() });
  res.json({ ok: true, ride });
});

app.post('/api/bookings', requireAuth, (req, res) => {
  const missing = requireFields(req.body, ['rideId', 'seats']);
  if (missing.length) return badRequest(res, missing);
  const ride = store.rides.find((item) => item.ride_id === asNumber(req.body.rideId));
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  const passenger = store.users.find((item) => item.user_id === req.user.sub);
  if (passenger?.passenger_verification_status !== 'verified') {
    return res.status(409).json({ error: 'Passenger Gov ID verification is required before booking' });
  }
  const seats = asNumber(req.body.seats);
  if (seats < 1 || ride.seats_available < seats) return res.status(409).json({ error: 'Not enough seats available' });

  ride.seats_available -= seats;
  ride.status = ride.seats_available === 0 ? 'full' : ride.status;
  const booking = {
    booking_id: nextId(store.bookings, 'booking_id'),
    ride_id: ride.ride_id,
    passenger_id: req.user.sub,
    seats_booked: seats,
    total_price: seats * Number(ride.price_per_seat),
    status: ride.instant_booking ? 'confirmed' : 'requested',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store.bookings.unshift(booking);
  persistStore();

  const passengerNotification = addNotification({
    userId: req.user.sub,
    type: 'ride_booked',
    title: 'Ride booking confirmed',
    message: `Your booking from ${ride.origin} to ${ride.destination} is ${booking.status}.`,
  });
  const driverNotification = addNotification({
    userId: ride.driver_id,
    type: 'new_passenger_booking',
    title: 'Booking received',
    message: `${passenger.full_name} requested ${seats} seat for ${ride.origin} to ${ride.destination}.`,
    metadata: {
      booking_id: booking.booking_id,
      passenger: {
        user_id: passenger.user_id,
        full_name: passenger.full_name,
        photo_url: passenger.photo_url,
        phone: passenger.phone,
        verification_status: passenger.passenger_verification_status,
        gov_id_number: passenger.gov_id_number,
      },
      ride: {
        ride_id: ride.ride_id,
        route: `${ride.origin} to ${ride.destination}`,
        from: ride.pickup_point,
        to: ride.drop_point,
        vehicle_id: ride.vehicle_id,
      },
    },
  });
  publishRealtime(req.user.sub, 'notification.created', passengerNotification);
  publishRealtime(ride.driver_id, 'notification.created', driverNotification);
  notifyUserMobile(req.user.sub, passengerNotification.title, passengerNotification.message);
  notifyUserMobile(ride.driver_id, driverNotification.title, driverNotification.message);

  res.status(201).json({ ok: true, booking, ride });
});

app.get('/api/bookings', requireAuth, (req, res) => {
  const bookings = store.bookings.filter((booking) => booking.passenger_id === req.user.sub);
  res.json({ ok: true, ...paginate(bookings, req) });
});

app.patch('/api/bookings/:bookingId', requireAuth, (req, res) => {
  const booking = store.bookings.find((item) => item.booking_id === asNumber(req.params.bookingId));
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  booking.status = req.body.status || booking.status;
  booking.updated_at = new Date().toISOString();
  const ride = store.rides.find((item) => item.ride_id === booking.ride_id);
  const passengerNotification = addNotification({
    userId: booking.passenger_id,
    type: 'ride_confirmation_updated',
    title: 'Ride request updated',
    message: `Your booking is now ${booking.status}.`,
    metadata: { booking_id: booking.booking_id, ride_id: booking.ride_id },
  });
  publishRealtime(booking.passenger_id, 'booking.updated', { booking, ride, notification: passengerNotification });
  publishRealtime(ride?.driver_id, 'booking.updated', { booking, ride });
  notifyUserMobile(booking.passenger_id, passengerNotification.title, passengerNotification.message);
  persistStore();
  res.json({ ok: true, booking });
});

app.get('/api/vehicles', requireAuth, (req, res) => {
  const vehicles = store.vehicles.filter((vehicle) => req.user.role === 'admin' || vehicle.owner_id === req.user.sub);
  res.json({ ok: true, ...paginate(vehicles, req) });
});

app.post('/api/vehicles', requireAuth, requireRole('driver', 'admin'), (req, res) => {
  const ownerVehicles = store.vehicles.filter((vehicle) => vehicle.owner_id === req.user.sub);
  if (req.user.role !== 'admin' && ownerVehicles.length >= 2) {
    return res.status(409).json({ error: 'Maximum 2 owner vehicles allowed' });
  }

  const missing = requireFields(req.body, [
    'make',
    'model',
    'plateNumber',
    'seats',
    'rcDocumentUrl',
    'frontPhotoUrl',
    'backPhotoUrl',
  ]);
  if (missing.length) return badRequest(res, missing);
  const vehicle = {
    vehicle_id: nextId(store.vehicles, 'vehicle_id'),
    owner_id: req.user.sub,
    make: req.body.make,
    model: req.body.model,
    color: req.body.color || null,
    plate_number: req.body.plateNumber,
    seats: asNumber(req.body.seats),
    rc_document_url: req.body.rcDocumentUrl || null,
    insurance_document_url: req.body.insuranceDocumentUrl || null,
    front_photo_url: req.body.frontPhotoUrl || null,
    back_photo_url: req.body.backPhotoUrl || null,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store.vehicles.unshift(vehicle);
  persistStore();
  const notification = addNotification({
    userId: req.user.sub,
    type: 'vehicle_added',
    title: 'Vehicle submitted for verification',
    message: `${vehicle.make} ${vehicle.model} is now in review.`,
  });
  publishRealtime(req.user.sub, 'vehicle.created', { vehicle, notification });
  notifyUserMobile(req.user.sub, notification.title, notification.message);
  res.status(201).json({ ok: true, vehicle, realtime: { event: 'vehicle.created' } });
});

app.patch('/api/vehicles/:vehicleId', requireAuth, (req, res) => {
  const vehicle = store.vehicles.find((item) => item.vehicle_id === asNumber(req.params.vehicleId));
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  if (vehicle.owner_id !== req.user.sub && req.user.role !== 'admin') return res.status(403).json({ error: 'Not vehicle owner' });
  if (req.body.make !== undefined) vehicle.make = req.body.make;
  if (req.body.model !== undefined) vehicle.model = req.body.model;
  if (req.body.color !== undefined) vehicle.color = req.body.color;
  if (req.body.plateNumber !== undefined) vehicle.plate_number = req.body.plateNumber;
  if (req.body.seats !== undefined) vehicle.seats = asNumber(req.body.seats);
  if (req.body.rcDocumentUrl !== undefined) vehicle.rc_document_url = req.body.rcDocumentUrl;
  if (req.body.insuranceDocumentUrl !== undefined) vehicle.insurance_document_url = req.body.insuranceDocumentUrl;
  if (req.body.frontPhotoUrl !== undefined) vehicle.front_photo_url = req.body.frontPhotoUrl;
  if (req.body.backPhotoUrl !== undefined) vehicle.back_photo_url = req.body.backPhotoUrl;
  if (!vehicle.rc_document_url || !vehicle.front_photo_url || !vehicle.back_photo_url) {
    return res.status(422).json({ error: 'RC book and vehicle front/back photos are required' });
  }
  const validStatuses = ['pending', 'reupload', 'rejected', 'verified'];
  vehicle.status = req.user.role === 'admin' && validStatuses.includes(req.body.status) ? req.body.status : 'pending';
  vehicle.updated_at = new Date().toISOString();
  persistStore();
  res.json({ ok: true, vehicle });
});

app.delete('/api/vehicles/:vehicleId', requireAuth, (req, res) => {
  const index = store.vehicles.findIndex((item) => item.vehicle_id === asNumber(req.params.vehicleId));
  if (index < 0) return res.status(404).json({ error: 'Vehicle not found' });
  if (store.vehicles[index].owner_id !== req.user.sub && req.user.role !== 'admin') return res.status(403).json({ error: 'Not vehicle owner' });
  const [vehicle] = store.vehicles.splice(index, 1);
  persistStore();
  res.json({ ok: true, vehicle });
});

app.get('/api/messages/conversations', requireAuth, (req, res) => {
  const messages = store.messages.filter((message) => message.sender_id === req.user.sub || message.receiver_id === req.user.sub);
  const grouped = new Map();
  [...messages]
    .sort((first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime())
    .forEach((message) => {
      const otherUserId = message.sender_id === req.user.sub ? message.receiver_id : message.sender_id;
      const key = `${message.ride_id}:${otherUserId}`;
      const existing = grouped.get(key);
      const otherUser = store.users.find((user) => user.user_id === otherUserId);
      if (!existing) {
        grouped.set(key, {
          conversation_id: key,
          ride_id: message.ride_id,
          other_user_id: otherUserId,
          other_user: otherUser ? publicUser(otherUser) : null,
          latest_message: publicMessage(message),
          unread_count: messages.filter((item) => item.sender_id === otherUserId && item.receiver_id === req.user.sub && !item.is_seen).length,
          updated_at: message.created_at,
        });
      }
    });
  res.json({ ok: true, ...paginate([...grouped.values()], req) });
});

app.get('/api/messages/:rideId', requireAuth, (req, res) => {
  const rideId = asNumber(req.params.rideId);
  const messages = store.messages
    .filter((message) => message.ride_id === rideId && (message.sender_id === req.user.sub || message.receiver_id === req.user.sub))
    .sort((first, second) => new Date(first.created_at).getTime() - new Date(second.created_at).getTime())
    .map(publicMessage);
  res.json({ ok: true, ...paginate(messages, req) });
});

app.post('/api/messages', requireAuth, (req, res) => {
  const missing = requireFields(req.body, ['rideId', 'message']);
  if (missing.length) return badRequest(res, missing);
  const ride = store.rides.find((item) => item.ride_id === asNumber(req.body.rideId));
  const booking = store.bookings.find((item) => item.ride_id === asNumber(req.body.rideId));
  const inferredReceiverId = ride
    ? (ride.driver_id === req.user.sub ? booking?.passenger_id : ride.driver_id)
    : undefined;
  const receiverId = asNumber(req.body.receiverId || inferredReceiverId || 2);
  if (receiverId === req.user.sub) {
    return res.status(422).json({ error: 'Receiver must be a different user' });
  }
  const message = {
    message_id: nextId(store.messages, 'message_id'),
    ride_id: asNumber(req.body.rideId),
    sender_id: req.user.sub,
    receiver_id: receiverId,
    message: req.body.message,
    attachment_url: req.body.attachmentUrl || null,
    is_seen: false,
    created_at: new Date().toISOString(),
  };
  store.messages.push(message);
  persistStore();
  const notification = addNotification({
    userId: message.receiver_id,
    type: 'message_received',
    title: 'New message received',
    message: message.message,
  });
  publishRealtime(message.receiver_id, 'message.created', { message: publicMessage(message), notification });
  publishRealtime(message.sender_id, 'message.created', { message: publicMessage(message) });
  notifyUserMobile(message.receiver_id, notification.title, notification.message);
  res.status(201).json({ ok: true, message: publicMessage(message) });
});

app.post('/api/messages/typing', requireAuth, (req, res) => {
  const missing = requireFields(req.body, ['rideId', 'receiverId']);
  if (missing.length) return badRequest(res, missing);
  const payload = {
    ride_id: asNumber(req.body.rideId),
    sender_id: req.user.sub,
    receiver_id: asNumber(req.body.receiverId),
    is_typing: Boolean(req.body.isTyping),
    created_at: new Date().toISOString(),
  };
  publishRealtime(payload.receiver_id, 'message.typing', payload);
  res.status(202).json({ ok: true, typing: payload });
});

app.patch('/api/messages/:messageId/seen', requireAuth, (req, res) => {
  const message = store.messages.find((item) => item.message_id === asNumber(req.params.messageId));
  if (!message) return res.status(404).json({ error: 'Message not found' });
  if (message.receiver_id !== req.user.sub) return res.status(403).json({ error: 'Not message receiver' });
  message.is_seen = true;
  persistStore();
  res.json({ ok: true, message });
});

app.get('/api/notifications', requireAuth, (req, res) => {
  const notifications = store.notifications.filter((item) => item.user_id === req.user.sub);
  res.json({ ok: true, unread: notifications.filter((item) => !item.is_read).length, ...paginate(notifications, req) });
});

app.post('/api/notifications/enqueue', requireAuth, (req, res) => {
  const missing = requireFields(req.body, ['userId', 'type', 'title', 'message']);
  if (missing.length) return badRequest(res, missing);
  const notification = addNotification({ userId: req.body.userId, type: req.body.type, title: req.body.title, message: req.body.message });
  publishRealtime(req.body.userId, 'notification.created', notification);
  notifyUserMobile(req.body.userId, notification.title, notification.message);
  res.status(202).json({ ok: true, notification: buildNotificationPayload({ ...req.body }) });
});

app.patch('/api/notifications/:notificationId/read', requireAuth, (req, res) => {
  const notification = store.notifications.find((item) => item.notification_id === asNumber(req.params.notificationId));
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  notification.is_read = true;
  res.json({ ok: true, notification });
});

app.get('/api/admin/dashboard', requireAuth, requireRole('admin'), (_req, res) => {
  const owners = store.users.filter((user) => user.role === 'driver' || user.role === 'admin');
  const passengers = store.users.filter((user) => user.role === 'passenger');
  const pendingIdVerifications = store.users.filter((user) => user.passenger_verification_status === 'pending' || user.verification_status === 'pending');
  const pendingVehicleVerifications = store.vehicles.filter((vehicle) => vehicle.status === 'pending' || vehicle.status === 'reupload');

  res.json({
    ok: true,
    stats: {
      owners: owners.length,
      passengers: passengers.length,
      pendingIdVerifications: pendingIdVerifications.length,
      pendingVehicleVerifications: pendingVehicleVerifications.length,
      rides: store.rides.length,
      bookings: store.bookings.length,
      walletFloat: store.users.reduce((sum, user) => sum + Number(user.wallet_balance || 0), 0),
    },
    owners,
    passengers,
    vehicles: store.vehicles,
    rides: store.rides,
    bookings: store.bookings,
    payments: store.payments,
    notifications: store.notifications,
  });
});

app.patch('/api/admin/users/:userId', requireAuth, requireRole('admin'), (req, res) => {
  const user = store.users.find((item) => item.user_id === asNumber(req.params.userId));
  if (!user) return res.status(404).json({ error: 'User not found' });

  const previous = {
    status: user.status,
    verification_status: user.verification_status,
    passenger_verification_status: user.passenger_verification_status,
  };
  ['status', 'verification_status', 'passenger_verification_status', 'wallet_balance', 'warning_count'].forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });
  user.updated_at = new Date().toISOString();
  const changedVerification =
    previous.status !== user.status ||
    previous.verification_status !== user.verification_status ||
    previous.passenger_verification_status !== user.passenger_verification_status;
  const notification = changedVerification
    ? addNotification({
        userId: user.user_id,
        type: 'account_verification_update',
        title: 'Account verification updated',
        message: `Your account status is ${user.status || 'active'}, owner verification is ${user.verification_status || 'pending'}, and passenger verification is ${user.passenger_verification_status || 'pending'}.`,
        metadata: {
          status: user.status,
          verification_status: user.verification_status,
          passenger_verification_status: user.passenger_verification_status,
        },
      })
    : null;
  if (notification) {
    publishRealtime(user.user_id, 'notification.created', notification);
    notifyUserMobile(user.user_id, notification.title, notification.message);
  }
  res.json({ ok: true, user, notification });
});

app.post('/api/admin/users/:userId/warnings', requireAuth, requireRole('admin'), (req, res) => {
  const user = store.users.find((item) => item.user_id === asNumber(req.params.userId));
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.warning_count = Math.min(2, Number(user.warning_count || 0) + 1);
  if (user.warning_count >= 2) user.status = 'suspended';
  const notification = addNotification({
    userId: user.user_id,
    type: 'admin_warning',
    title: user.warning_count >= 2 ? 'Second warning issued' : 'Warning issued',
    message: req.body.message || `Admin warning ${user.warning_count}/2. Please resolve account issues.`,
    metadata: { warning_count: user.warning_count, status: user.status },
  });
  publishRealtime(user.user_id, 'notification.created', notification);
  notifyUserMobile(user.user_id, notification.title, notification.message);
  res.json({ ok: true, user, notification });
});

app.patch('/api/admin/vehicles/:vehicleId/verification', requireAuth, requireRole('admin'), (req, res) => {
  const vehicle = store.vehicles.find((item) => item.vehicle_id === asNumber(req.params.vehicleId));
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

  const allowedStatuses = ['pending', 'verified', 'reupload', 'rejected'];
  if (!allowedStatuses.includes(req.body.status)) return res.status(422).json({ error: 'Invalid vehicle status' });
  vehicle.status = req.body.status;
  vehicle.updated_at = new Date().toISOString();

  const notification = addNotification({
    userId: vehicle.owner_id,
    type: 'vehicle_verification',
    title: req.body.status === 'verified' ? 'Vehicle verified' : 'Vehicle verification update',
    message: `${vehicle.make} ${vehicle.model} status changed to ${req.body.status}.`,
    metadata: { vehicle_id: vehicle.vehicle_id, status: vehicle.status },
  });
  publishRealtime(vehicle.owner_id, 'vehicle.verification.updated', { vehicle, notification });
  notifyUserMobile(vehicle.owner_id, notification.title, notification.message);
  res.json({ ok: true, vehicle, notification });
});

app.get('/api/admin/transactions', requireAuth, requireRole('admin'), (req, res) => {
  const transactions = [
    ...store.payments.map((payment) => ({ ...payment, source: 'payment' })),
    ...store.bookings.map((booking) => ({ ...booking, source: 'booking' })),
  ];
  res.json({ ok: true, ...paginate(transactions, req) });
});

function addAdminActivity(req, { activityType, action, targetType, targetId, oldValues, newValues }) {
  const log = {
    log_id: nextId(store.admin_activity_logs, 'log_id'),
    actor_user_id: req.user?.sub || null,
    activity_type: activityType,
    action,
    target_type: targetType,
    target_id: targetId || null,
    old_values: oldValues || null,
    new_values: newValues || null,
    ip_address: req.ip,
    created_at: new Date().toISOString(),
  };
  store.admin_activity_logs.unshift(log);
  return log;
}

app.get('/api/admin/activity-logs', requireAuth, requireRole('admin'), (req, res) => {
  const { type, q } = req.query;
  let logs = [...store.admin_activity_logs];
  if (type) logs = logs.filter((log) => log.activity_type === String(type));
  if (q) {
    const query = String(q).toLowerCase();
    logs = logs.filter((log) => `${log.activity_type} ${log.action} ${log.target_type}`.toLowerCase().includes(query));
  }
  res.json({ ok: true, ...paginate(logs, req) });
});

app.get('/api/admin/ad-partners', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ ok: true, ...paginate(store.ad_partners, req) });
});

app.post('/api/admin/ad-partners', requireAuth, requireRole('admin'), (req, res) => {
  const missing = requireFields(req.body, ['partner_name', 'company_name', 'contact_person', 'mobile', 'email', 'priority']);
  if (missing.length) return badRequest(res, missing);
  const partner = {
    partner_id: nextId(store.ad_partners, 'partner_id'),
    partner_type: req.body.partner_type || 'paid',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...req.body,
  };
  store.ad_partners.unshift(partner);
  addAdminActivity(req, { activityType: 'Ads', action: 'Partner created', targetType: 'ad_partner', targetId: partner.partner_id, newValues: partner });
  res.status(201).json({ ok: true, partner });
});

app.get('/api/admin/ads', requireAuth, requireRole('admin'), (req, res) => {
  const { placement, area, state, status } = req.query;
  let ads = [...store.ads];
  if (placement) ads = ads.filter((ad) => ad.placement === placement);
  if (area) ads = ads.filter((ad) => ad.area === area || ad.area === 'All India');
  if (state) ads = ads.filter((ad) => ad.state === state || ad.state === 'All India');
  if (status) ads = ads.filter((ad) => ad.status === status);
  res.json({ ok: true, ...paginate(ads, req) });
});

app.post('/api/admin/ads', requireAuth, requireRole('admin'), (req, res) => {
  const missing = requireFields(req.body, ['partner_id', 'ad_name', 'ad_type', 'placement', 'size', 'start_date', 'end_date']);
  if (missing.length) return badRequest(res, missing);
  const allowedTypes = ['banner', 'javascript', 'html', 'iframe', 'internal'];
  if (!allowedTypes.includes(req.body.ad_type)) return res.status(422).json({ error: 'Unsupported ad type' });
  const ad = {
    ad_id: nextId(store.ads, 'ad_id'),
    impressions: 0,
    clicks: 0,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...req.body,
  };
  store.ads.unshift(ad);
  store.ad_history.unshift({
    history_id: nextId(store.ad_history, 'history_id'),
    ad_id: ad.ad_id,
    admin_user_id: req.user.sub,
    action_type: 'created',
    old_values: null,
    new_values: ad,
    created_at: new Date().toISOString(),
  });
  addAdminActivity(req, { activityType: 'Ads', action: 'Ad created', targetType: 'ad', targetId: ad.ad_id, newValues: ad });
  res.status(201).json({ ok: true, ad });
});

app.patch('/api/admin/ads/:adId', requireAuth, requireRole('admin'), (req, res) => {
  const ad = store.ads.find((item) => item.ad_id === asNumber(req.params.adId));
  if (!ad) return res.status(404).json({ error: 'Ad not found' });
  const oldValues = { ...ad };
  Object.assign(ad, req.body, { updated_at: new Date().toISOString() });
  store.ad_history.unshift({
    history_id: nextId(store.ad_history, 'history_id'),
    ad_id: ad.ad_id,
    admin_user_id: req.user.sub,
    action_type: 'updated',
    old_values: oldValues,
    new_values: ad,
    created_at: new Date().toISOString(),
  });
  addAdminActivity(req, { activityType: 'Ads', action: 'Ad updated', targetType: 'ad', targetId: ad.ad_id, oldValues, newValues: ad });
  res.json({ ok: true, ad });
});

app.delete('/api/admin/ads/:adId', requireAuth, requireRole('admin'), (req, res) => {
  const adId = asNumber(req.params.adId);
  const ad = store.ads.find((item) => item.ad_id === adId);
  if (!ad) return res.status(404).json({ error: 'Ad not found' });
  store.ads = store.ads.filter((item) => item.ad_id !== adId);
  addAdminActivity(req, { activityType: 'Ads', action: 'Ad deleted', targetType: 'ad', targetId: adId, oldValues: ad });
  res.json({ ok: true });
});

app.get('/api/admin/ad-invoices', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ ok: true, ...paginate(store.ad_invoices, req) });
});

app.post('/api/admin/ad-invoices/calculate', requireAuth, requireRole('admin'), (req, res) => {
  const missing = requireFields(req.body, ['ad_id', 'base_amount', 'start_date', 'end_date']);
  if (missing.length) return badRequest(res, missing);
  const runningDays = Math.max(1, Math.ceil((new Date(req.body.end_date) - new Date(req.body.start_date)) / 86400000) + 1);
  const baseAmount = Number(req.body.base_amount);
  const gst = Math.round(baseAmount * 0.18);
  res.json({ ok: true, runningDays, baseAmount, gst, finalAmount: baseAmount + gst });
});

app.get('/api/admin/ad-analytics', requireAuth, requireRole('admin'), (_req, res) => {
  const totalRevenue = store.ad_invoices.reduce((total, invoice) => total + Number(invoice.final_amount || 0), 0);
  const activeAds = store.ads.filter((ad) => ad.status === 'active');
  const topAds = [...store.ads].sort((first, second) => second.clicks - first.clicks).slice(0, 5);
  res.json({
    ok: true,
    totalRevenue,
    activeAds: activeAds.length,
    expiredAds: store.ads.filter((ad) => ad.status === 'expired').length,
    topAds,
    highestClickedAds: topAds,
    monthlyRevenue: totalRevenue,
    stateWiseRevenue: [{ state: 'Karnataka', revenue: totalRevenue }],
    placementWiseRevenue: [{ placement: 'search', revenue: totalRevenue }],
  });
});

app.get('/api/payments', requireAuth, (req, res) => {
  const payments = store.payments.filter((payment) => payment.payer_id === req.user.sub);
  const user = store.users.find((item) => item.user_id === req.user.sub);
  res.json({ ok: true, walletBalance: Number(user?.wallet_balance || 0), ...paginate(payments, req) });
});

app.post('/api/payments', requireAuth, (req, res) => {
  const missing = requireFields(req.body, ['bookingId', 'amount', 'provider']);
  if (missing.length) return badRequest(res, missing);
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount < 1) {
    return res.status(422).json({ error: 'Enter a valid amount' });
  }
  const payment = {
    payment_id: nextId(store.payments, 'payment_id'),
    booking_id: asNumber(req.body.bookingId),
    payer_id: req.user.sub,
    amount,
    provider: req.body.provider,
    status: req.body.provider === 'razorpay' ? 'created' : 'paid',
    razorpay_order_id: req.body.provider === 'razorpay' ? `order_${Date.now()}_${req.user.sub}` : null,
    razorpay_payment_id: null,
    refund_status: 'none',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store.payments.unshift(payment);
  if (payment.status === 'paid') {
    const user = store.users.find((item) => item.user_id === req.user.sub);
    if (user) user.wallet_balance = Number(user.wallet_balance || 0) + amount;
    notifyUserMobile(req.user.sub, 'Payment successful', `Payment of INR ${payment.amount} was completed.`);
  }
  persistStore();
  res.status(201).json({
    ok: true,
    payment,
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID || '',
      orderId: payment.razorpay_order_id,
      amount: Math.round(amount * 100),
      currency: 'INR',
      name: 'shareMILES Wallet',
      description: 'Wallet top-up',
    },
  });
});

app.post('/api/payments/:paymentId/verify', requireAuth, (req, res) => {
  const payment = store.payments.find((item) => item.payment_id === asNumber(req.params.paymentId) && item.payer_id === req.user.sub);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (payment.status === 'paid') {
    const user = store.users.find((item) => item.user_id === req.user.sub);
    return res.json({ ok: true, payment, walletBalance: Number(user?.wallet_balance || 0) });
  }

  const gatewayStatus = String(req.body.status || '').toLowerCase();
  const paymentId = req.body.razorpayPaymentId || req.body.razorpay_payment_id;
  if (gatewayStatus !== 'success' || !paymentId) {
    payment.status = gatewayStatus === 'cancelled' ? 'cancelled' : gatewayStatus === 'failed' ? 'failed' : 'pending';
    payment.updated_at = new Date().toISOString();
    persistStore();
    return res.status(422).json({ ok: false, error: 'Payment was not successful', payment });
  }

  payment.status = 'paid';
  payment.razorpay_payment_id = paymentId;
  payment.updated_at = new Date().toISOString();
  const user = store.users.find((item) => item.user_id === req.user.sub);
  if (user) user.wallet_balance = Number(user.wallet_balance || 0) + Number(payment.amount || 0);
  persistStore();
  notifyUserMobile(req.user.sub, 'Payment successful', `Payment of INR ${payment.amount} was completed.`);
  res.json({ ok: true, payment, walletBalance: Number(user?.wallet_balance || 0) });
});

app.get('/api/reviews', requireAuth, (req, res) => {
  res.json({ ok: true, ...paginate(store.reviews, req) });
});

app.post('/api/reviews', requireAuth, (req, res) => {
  const missing = requireFields(req.body, ['rideId', 'revieweeId', 'rating']);
  if (missing.length) return badRequest(res, missing);
  const review = {
    review_id: nextId(store.reviews, 'review_id'),
    ride_id: asNumber(req.body.rideId),
    reviewer_id: req.user.sub,
    reviewee_id: asNumber(req.body.revieweeId),
    rating: asNumber(req.body.rating),
    comment: req.body.comment || '',
    created_at: new Date().toISOString(),
  };
  store.reviews.unshift(review);
  if (review.rating <= 2) {
    const notification = addNotification({
      userId: review.reviewee_id,
      type: 'low_rating_alert',
      title: 'Low rating alert',
      message: 'A recent ride received a low rating. Please review feedback.',
    });
    publishRealtime(review.reviewee_id, 'notification.created', notification);
    notifyUserMobile(review.reviewee_id, notification.title, notification.message);
  }
  res.status(201).json({ ok: true, review });
});

app.post('/api/safety/report', requireAuth, (req, res) => {
  const missing = requireFields(req.body, ['targetType', 'targetId', 'reason']);
  if (missing.length) return badRequest(res, missing);
  res.status(201).json({ ok: true, report: { ...req.body, reporter_id: req.user.sub, status: 'open' } });
});

app.get('/api/notification-flows', (_req, res) => {
  res.json({
    passenger: passengerNotificationFlows,
    driver: driverNotificationFlows,
    deliveryPriority: ['socket', 'push', 'email', 'sms', 'in_app'],
  });
});

app.post('/api/devices', async (req, res, next) => {
  try {
    const { token, platform, deviceName } = req.body;
    if (!token || !['android', 'ios', 'web'].includes(platform)) {
      return res.status(400).json({ error: 'token and valid platform are required' });
    }

    await upsertDeviceToken({ token, platform, deviceName });
    return res.status(201).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/notifications/test', async (req, res, next) => {
  try {
    const { token, platform, title = 'FastForward', body = 'Notification test' } = req.body;
    if (!token || !['android', 'ios'].includes(platform)) {
      return res.status(400).json({ error: 'token and android/ios platform are required' });
    }

    const result = await sendPush({
      token,
      platform,
      title,
      body,
      data: { source: 'fastforward-api' },
    });

    await saveNotificationLog({
      token,
      platform,
      title,
      body,
      provider: result.provider,
      response: result.response,
    });

    return res.json({ ok: true, provider: result.provider, response: result.response });
  } catch (error) {
    return next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.message });
});

app.listen(port, host, () => {
  console.log(`FastForward API listening on http://${host}:${port}`);
});
