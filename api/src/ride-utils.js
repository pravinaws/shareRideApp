export function haversineKm(firstLat, firstLng, secondLat, secondLng) {
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

export function rideMatchesRoute(ride, origin, destination, normalizeText) {
  const originText = normalizeText(origin);
  const destinationText = normalizeText(destination);
  const rideOrigin = `${ride.origin} ${ride.pickup_point}`.toLowerCase();
  const rideDestination = `${ride.destination} ${ride.drop_point}`.toLowerCase();
  return (!originText || rideOrigin.includes(originText) || originText.includes(normalizeText(ride.origin))) &&
    (!destinationText || rideDestination.includes(destinationText) || destinationText.includes(normalizeText(ride.destination)));
}

export function rideVehicle(store, ride) {
  return store.vehicles.find((vehicle) => vehicle.vehicle_id === ride.vehicle_id) || null;
}

export function rideOwnerBookings(store, userId) {
  const ownerRideIds = store.rides
    .filter((ride) => ride.driver_id === userId)
    .map((ride) => ride.ride_id);
  return store.bookings.filter((booking) => ownerRideIds.includes(booking.ride_id));
}

export function publicBooking(store, publicUser, booking) {
  const ride = store.rides.find((item) => item.ride_id === booking.ride_id) || null;
  const passenger = store.users.find((item) => item.user_id === booking.passenger_id) || null;
  const vehicle = ride ? rideVehicle(store, ride) : null;
  return {
    ...booking,
    ride,
    passenger: passenger ? publicUser(passenger) : null,
    vehicle,
  };
}

export function canAccessRideChat(store, { ride, userId, receiverId }) {
  if (!ride) return false;
  if (ride.driver_id !== userId) {
    return store.bookings.some(
      (booking) =>
        booking.ride_id === ride.ride_id &&
        booking.passenger_id === userId &&
        ['requested', 'confirmed'].includes(String(booking.status || '').toLowerCase()),
    );
  }

  if (receiverId) {
    return store.bookings.some(
      (booking) =>
        booking.ride_id === ride.ride_id &&
        booking.passenger_id === receiverId &&
        ['requested', 'confirmed'].includes(String(booking.status || '').toLowerCase()),
    );
  }

  return store.bookings.some(
    (booking) => booking.ride_id === ride.ride_id && ['requested', 'confirmed'].includes(String(booking.status || '').toLowerCase()),
  );
}

export function recalculateRideAvailability(store, ride) {
  const confirmedSeats = store.bookings
    .filter((booking) => booking.ride_id === ride.ride_id && String(booking.status || '').toLowerCase() === 'confirmed')
    .reduce((sum, booking) => sum + Number(booking.seats_booked || 0), 0);

  ride.seats_available = Math.max(0, Number(ride.total_seats || 0) - confirmedSeats);
  ride.status = ride.seats_available === 0 ? 'full' : 'published';
  ride.updated_at = new Date().toISOString();
}

export function publicMessage(store, publicUser, message) {
  const sender = store.users.find((user) => user.user_id === message.sender_id);
  const receiver = store.users.find((user) => user.user_id === message.receiver_id);
  return {
    ...message,
    sender: sender ? publicUser(sender) : null,
    receiver: receiver ? publicUser(receiver) : null,
  };
}
