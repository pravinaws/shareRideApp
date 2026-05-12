export const passengerNotificationFlows = [
  { event: 'ride.booking.confirmed', type: 'ride_booked', title: 'Ride booking confirmed', channels: ['socket', 'push', 'email', 'sms', 'in_app'] },
  { event: 'driver.request.accepted', type: 'driver_accepted', title: 'Driver accepted your request', channels: ['socket', 'push', 'email', 'in_app'] },
  { event: 'ride.canceled', type: 'ride_canceled', title: 'Ride canceled', channels: ['socket', 'push', 'email', 'sms', 'in_app'] },
  { event: 'payment.successful', type: 'payment_success', title: 'Payment successful', channels: ['socket', 'push', 'email', 'in_app'] },
  { event: 'refund.initiated', type: 'refund_initiated', title: 'Refund initiated', channels: ['push', 'email', 'in_app'] },
  { event: 'ride.reminder', type: 'ride_reminder', title: 'Ride reminder', channels: ['socket', 'push', 'sms', 'in_app'] },
  { event: 'chat.message.received', type: 'message_received', title: 'New message received', channels: ['socket', 'push', 'in_app'] },
  { event: 'rating.reminder', type: 'rating_reminder', title: 'Rate your ride', channels: ['push', 'email', 'in_app'] },
];

export const driverNotificationFlows = [
  { event: 'passenger.booking.created', type: 'new_passenger_booking', title: 'New passenger booking', priority: 'urgent', channels: ['socket', 'push', 'email'] },
  { event: 'booking.canceled', type: 'booking_canceled', title: 'Booking canceled', priority: 'high', channels: ['socket', 'push', 'email'] },
  { event: 'passenger.message.received', type: 'passenger_message', title: 'Passenger message', priority: 'high', channels: ['socket', 'push', 'email'] },
  { event: 'ride.starting.reminder', type: 'ride_starting_reminder', title: 'Ride starting soon', priority: 'high', channels: ['socket', 'push', 'email'] },
  { event: 'ride.completed', type: 'ride_completed', title: 'Ride completed', priority: 'normal', channels: ['socket', 'push', 'email'] },
  { event: 'payment.credited', type: 'payment_credited', title: 'Payment credited', priority: 'normal', channels: ['socket', 'push', 'email'] },
  { event: 'review.low_rating', type: 'low_rating_alert', title: 'Low rating alert', priority: 'high', channels: ['socket', 'push', 'email'] },
];

export function buildNotificationPayload({ userId, type, title, message, priority = 'normal', channels = ['in_app'] }) {
  return {
    user_id: userId,
    type,
    title,
    message,
    priority,
    channels,
    created_at: new Date().toISOString(),
  };
}
