import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-overlays',
  templateUrl: './app-overlays.component.html',
  standalone: false,
})
export class AppOverlaysComponent {
  @Input({ required: true }) vm!: any;
}
