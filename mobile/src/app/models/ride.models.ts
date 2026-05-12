export type RideStatus = 'draft' | 'published' | 'confirmed' | 'started' | 'completed' | 'canceled' | 'archived';
export type BookingStatus = 'requested' | 'accepted' | 'confirmed' | 'canceled' | 'completed' | 'refunded';
export type NotificationChannel = 'socket' | 'push' | 'email' | 'sms' | 'in_app';

export interface RideSummary {
  rideId: number;
  driverId: number;
  route: string;
  departureAt: string;
  pricePerSeat: number;
  seatsAvailable: number;
  status: RideStatus;
}

export interface NotificationItem {
  notificationId: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
