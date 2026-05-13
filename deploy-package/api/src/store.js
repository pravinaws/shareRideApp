import fs from 'fs';
import path from 'path';

const now = () => new Date().toISOString();
const dataDir = path.resolve(process.cwd(), 'data');
const storePath = path.join(dataDir, 'store.json');

const initialStore = {
  users: [
    {
      user_id: 1,
      full_name: 'Harshala',
      email: 'harshala@example.com',
      phone: '+91 98765 43210',
      age: 29,
      photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
      bio: 'Clean car, safe driving, and punctual pickup. Prefer verified travellers for office and intercity routes.',
      rating: 4.9,
      role: 'driver',
      verification_status: 'verified',
      passenger_verification_status: 'verified',
      gov_id_number: 'DEMO-VERIFIED-001',
      gov_id_front_url: 'seed://gov-id-front-harshala',
      gov_id_back_url: 'seed://gov-id-back-harshala',
      wallet_balance: 12840,
      warning_count: 0,
      travel_preferences: {
        music: 'Soft music',
        chat: 'Friendly chat',
        smoking: 'No smoking',
        pets: 'Ask first',
      },
      status: 'active',
      created_at: now(),
      updated_at: now(),
    },
    {
      user_id: 2,
      full_name: 'Aarav Mehta',
      email: 'aarav@example.com',
      phone: '+91 90000 11111',
      age: 34,
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
      bio: 'Verified commuter between Bengaluru and Mysuru.',
      rating: 4.9,
      role: 'driver',
      verification_status: 'verified',
      passenger_verification_status: 'verified',
      gov_id_number: 'DEMO-VERIFIED-002',
      gov_id_front_url: 'seed://gov-id-front-aarav',
      gov_id_back_url: 'seed://gov-id-back-aarav',
      wallet_balance: 24620,
      warning_count: 1,
      travel_preferences: {
        music: 'Any music',
        chat: 'Friendly chat',
        smoking: 'No smoking',
        pets: 'No pets',
      },
      status: 'active',
      created_at: now(),
      updated_at: now(),
    },
  ],
  vehicles: [
    {
      vehicle_id: 1,
      owner_id: 1,
      make: 'Hyundai',
      model: 'Verna',
      color: 'White',
      plate_number: 'KA 05 MK 2281',
      seats: 4,
      rc_document_url: 'seed://rc-book-hyundai-verna',
      insurance_document_url: 'seed://insurance-hyundai-verna',
      front_photo_url: 'seed://front-hyundai-verna',
      back_photo_url: 'seed://back-hyundai-verna',
      status: 'verified',
      created_at: now(),
      updated_at: now(),
    },
  ],
  rides: [
    {
      ride_id: 1,
      driver_id: 2,
      vehicle_id: 1,
      origin: 'Bengaluru',
      destination: 'Mysuru',
      pickup_point: 'Bengaluru Central Metro Gate 2',
      drop_point: 'Mysuru Palace Road',
      origin_lat: 12.9716,
      origin_lng: 77.5946,
      destination_lat: 12.2958,
      destination_lng: 76.6394,
      departure_at: '2026-05-08T08:30:00.000Z',
      price_per_seat: 420,
      seats_available: 3,
      total_seats: 4,
      instant_booking: true,
      status: 'published',
      created_at: now(),
      updated_at: now(),
    },
  ],
  bookings: [],
  messages: [
    {
      message_id: 1,
      ride_id: 1,
      sender_id: 2,
      receiver_id: 1,
      message: 'I will reach pickup in 8 minutes.',
      is_seen: false,
      created_at: now(),
    },
  ],
  notifications: [
    {
      notification_id: 1,
      user_id: 1,
      type: 'ride_booked',
      title: 'Ride booking confirmed',
      message: 'Your seat to Mysuru is confirmed.',
      is_read: false,
      created_at: now(),
    },
  ],
  payments: [],
  admin_activity_logs: [
    {
      log_id: 1,
      actor_user_id: 1,
      activity_type: 'Ride',
      action: 'Ride booking requested',
      target_type: 'ride',
      target_id: 1,
      old_values: null,
      new_values: { status: 'requested' },
      ip_address: '127.0.0.1',
      created_at: now(),
    },
  ],
  ad_partners: [
    {
      partner_id: 1,
      partner_name: 'Groww Ads',
      company_name: 'Groww Partner Media',
      contact_person: 'Neha Shah',
      mobile: '+91 90000 33333',
      email: 'ads@groww.example',
      address: 'Bengaluru, Karnataka',
      gst_number: '29ABCDE1234F1Z5',
      partner_type: 'paid',
      priority: 'high',
      status: 'active',
      agreement_start: '2026-05-01',
      agreement_end: '2026-11-01',
      created_at: now(),
      updated_at: now(),
    },
  ],
  ads: [
    {
      ad_id: 1,
      partner_id: 1,
      ad_name: 'Groww commuter offer',
      ad_type: 'banner',
      banner_url: 'seed://groww-banner',
      redirect_url: 'https://example.com/groww',
      script_content: '',
      placement: 'search',
      area: 'Bengaluru',
      state: 'Karnataka',
      size: '320x100',
      priority: 'high',
      device_type: 'all',
      start_date: '2026-05-01',
      end_date: '2026-05-31',
      status: 'active',
      impressions: 18420,
      clicks: 812,
      created_at: now(),
      updated_at: now(),
    },
  ],
  ad_invoices: [
    {
      invoice_id: 1,
      invoice_number: 'INV-ADS-1001',
      partner_id: 1,
      ad_id: 1,
      running_days: 31,
      base_amount: 42000,
      gst_amount: 7560,
      final_amount: 49560,
      payment_status: 'paid',
      payment_mode: 'upi',
      transaction_reference: 'TXN-GRW-8821',
      created_at: now(),
      updated_at: now(),
    },
  ],
  ad_history: [
    {
      history_id: 1,
      ad_id: 1,
      admin_user_id: 1,
      action_type: 'created',
      old_values: null,
      new_values: { status: 'active' },
      created_at: now(),
    },
  ],
  reviews: [
    {
      review_id: 1,
      ride_id: 1,
      booking_id: 1,
      reviewer_id: 2,
      reviewee_id: 1,
      rating: 5,
      comment: 'Very professional and smooth ride. Pickup was exactly on time.',
      created_at: now(),
    },
  ],
  saved_passengers: [],
};

export const store = loadStore();

function loadStore() {
  try {
    if (fs.existsSync(storePath)) {
      return JSON.parse(fs.readFileSync(storePath, 'utf8'));
    }
  } catch (error) {
    console.error(`Store load failed: ${error.message}`);
  }

  return initialStore;
}

export function persistStore() {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
  } catch (error) {
    console.error(`Store persist failed: ${error.message}`);
  }
}

export function nextId(collection, key) {
  return Math.max(0, ...collection.map((item) => Number(item[key]) || 0)) + 1;
}

export function paginate(items, req) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
  const offset = (page - 1) * limit;
  return {
    data: items.slice(offset, offset + limit),
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit) || 1,
    },
  };
}

export function addNotification({ userId, type, title, message, metadata }) {
  const notification = {
    notification_id: nextId(store.notifications, 'notification_id'),
    user_id: Number(userId),
    type,
    title,
    message,
    metadata: metadata || null,
    is_read: false,
    created_at: now(),
  };
  store.notifications.unshift(notification);
  persistStore();
  return notification;
}

export function publicUser(user) {
  const { phone, email, ...safeUser } = user;
  return safeUser;
}
