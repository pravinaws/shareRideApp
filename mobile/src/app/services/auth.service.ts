import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { from, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SessionUser {
  user_id: number;
  full_name: string;
  role: 'passenger' | 'driver' | 'admin';
  verification_status: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly tokenKey = 'rideshare.token';
  private readonly userKey = 'rideshare.user';

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  get token() {
    return localStorage.getItem(this.tokenKey);
  }

  get user(): SessionUser | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  get isAuthenticated() {
    return Boolean(this.token);
  }

  private post<T>(path: string, data: unknown) {
    const url = `${this.apiUrl}${path}`;

    if (!Capacitor.isNativePlatform()) {
      return this.http.post<T>(url, data);
    }

    return from(
      CapacitorHttp.post({
        url,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        data,
        responseType: 'json',
      }).then((response) => {
        if (response.status >= 400) {
          const message = response.data?.error || response.data?.message || `Request failed with ${response.status}`;
          const error: any = new Error(message);
          error.status = response.status;
          error.error = response.data;
          throw error;
        }

        return response.data as T;
      }),
    );
  }

  sendOtp(phone: string, email?: string) {
    return this.post<{ message: string; mode: string; testOtp?: string }>('/auth/send-otp', {
      phone,
      email,
      channel: 'whatsapp',
    });
  }

  adminLogin(username: string, password: string) {
    return this.post<{ token: string; user: SessionUser }>('/admin/login', { username, password }).pipe(
      tap((session) => {
        localStorage.setItem(this.tokenKey, session.token);
        localStorage.setItem(this.userKey, JSON.stringify(session.user));
      }),
    );
  }

  login(phone: string, otp: string, role = 'driver', fullName?: string, email?: string, authMode: 'login' | 'signup' = 'login', referralCode?: string) {
    return this.post<{ token: string; user: SessionUser }>('/auth/login', { phone, otp, role, fullName, email, authMode, referralCode }).pipe(
      tap((session) => {
        localStorage.setItem(this.tokenKey, session.token);
        localStorage.setItem(this.userKey, JSON.stringify(session.user));
      }),
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.router.navigateByUrl('/login');
  }
}
