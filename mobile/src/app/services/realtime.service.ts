import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private source?: EventSource;
  readonly events$ = new Subject<{ type: string; payload: unknown }>();

  constructor(
    private readonly auth: AuthService,
    private readonly zone: NgZone,
  ) {}

  connect() {
    const token = this.auth.token;
    if (!token || token === 'demo-token' || this.source) {
      return;
    }

    this.source = new EventSource(`${environment.apiUrl}/realtime?token=${encodeURIComponent(token)}`);
    this.source.onmessage = (event) => this.emit('message', event.data);
    this.source.addEventListener('vehicle.created', (event) => this.emit('vehicle.created', (event as MessageEvent).data));
    this.source.addEventListener('notification.created', (event) => this.emit('notification.created', (event as MessageEvent).data));
    this.source.addEventListener('message.created', (event) => this.emit('message.created', (event as MessageEvent).data));
  }

  disconnect() {
    this.source?.close();
    this.source = undefined;
  }

  private emit(type: string, data: string) {
    this.zone.run(() => {
      this.events$.next({ type, payload: JSON.parse(data) });
    });
  }
}
