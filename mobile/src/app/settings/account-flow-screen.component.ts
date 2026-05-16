import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-account-flow-screen',
  templateUrl: './account-flow-screen.component.html',
  standalone: false,
})
export class AccountFlowScreenComponent {
  @Input({ required: true }) vm!: any;
}
