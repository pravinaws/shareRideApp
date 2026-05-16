import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-profile-flow-screen',
  templateUrl: './profile-flow-screen.component.html',
  standalone: false,
})
export class ProfileFlowScreenComponent {
  @Input({ required: true }) vm!: any;
}
