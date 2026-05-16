import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-notifications-screen',
  templateUrl: './notifications-screen.component.html',
  standalone: false,
})
export class NotificationsScreenComponent {
  @Input({ required: true }) vm!: any;
}
