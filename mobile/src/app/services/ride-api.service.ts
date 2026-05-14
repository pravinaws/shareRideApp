import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { NotificationItem, RideSummary } from '../models/ride.models';

interface ApiList<T> {
  ok: boolean;
  data: T[];
  unread?: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class RideApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getRides(filters: Record<string, string | number | boolean | undefined> = {}) {
    return this.http.get<ApiList<RideSummary>>(`${this.apiUrl}/rides`, { params: this.toParams(filters) });
  }

  getRide(rideId: number) {
    return this.http.get(`${this.apiUrl}/rides/${rideId}`);
  }

  publishRide(payload: unknown) {
    return this.http.post(`${this.apiUrl}/rides`, payload);
  }

  bookRide(payload: { rideId: number; seats: number }) {
    return this.http.post(`${this.apiUrl}/bookings`, payload);
  }

  getBookings(filters: Record<string, string | number | boolean | undefined> = {}) {
    return this.http.get<ApiList<unknown>>(`${this.apiUrl}/bookings`, { params: this.toParams(filters) });
  }

  updateBooking(bookingId: number, payload: unknown) {
    return this.http.patch(`${this.apiUrl}/bookings/${bookingId}`, payload);
  }

  getVehicles() {
    return this.http.get<ApiList<unknown>>(`${this.apiUrl}/vehicles`);
  }

  addVehicle(payload: unknown) {
    return this.http.post(`${this.apiUrl}/vehicles`, payload);
  }

  updateVehicle(vehicleId: number, payload: unknown) {
    return this.http.patch(`${this.apiUrl}/vehicles/${vehicleId}`, payload);
  }

  deleteVehicle(vehicleId: number) {
    return this.http.delete(`${this.apiUrl}/vehicles/${vehicleId}`);
  }

  getConversations() {
    return this.http.get<ApiList<unknown>>(`${this.apiUrl}/messages/conversations`);
  }

  getMessages(rideId: number) {
    return this.http.get<ApiList<unknown>>(`${this.apiUrl}/messages/${rideId}`);
  }

  sendMessage(payload: unknown) {
    return this.http.post(`${this.apiUrl}/messages`, payload);
  }

  sendTyping(payload: unknown) {
    return this.http.post(`${this.apiUrl}/messages/typing`, payload);
  }

  markMessageSeen(messageId: number) {
    return this.http.patch(`${this.apiUrl}/messages/${messageId}/seen`, {});
  }

  getNotifications() {
    return this.http.get<ApiList<NotificationItem>>(`${this.apiUrl}/notifications`);
  }

  markNotificationRead(notificationId: number) {
    return this.http.patch(`${this.apiUrl}/notifications/${notificationId}/read`, {});
  }

  enqueueNotification(payload: Partial<NotificationItem>) {
    return this.http.post(`${this.apiUrl}/notifications/enqueue`, payload);
  }

  getPayments() {
    return this.http.get<ApiList<unknown>>(`${this.apiUrl}/payments`);
  }

  createPayment(payload: unknown) {
    return this.http.post(`${this.apiUrl}/payments`, payload);
  }

  verifyPayment(paymentId: number, payload: unknown) {
    return this.http.post(`${this.apiUrl}/payments/${paymentId}/verify`, payload);
  }

  reconcilePayment(paymentId: number, payload: unknown = {}) {
    return this.http.post(`${this.apiUrl}/payments/${paymentId}/reconcile`, payload);
  }

  private toParams(filters: Record<string, string | number | boolean | undefined>) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}
