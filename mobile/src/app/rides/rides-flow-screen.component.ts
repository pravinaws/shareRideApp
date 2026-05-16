import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-rides-flow-screen',
  templateUrl: './rides-flow-screen.component.html',
  standalone: false,
})
export class RidesFlowScreenComponent {
  @Input({ required: true }) vm!: any;
}
