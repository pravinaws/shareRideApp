import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-screen',
  templateUrl: './admin-screen.component.html',
  standalone: false,
})
export class AdminScreenComponent {
  @Input({ required: true }) vm!: any;
}
