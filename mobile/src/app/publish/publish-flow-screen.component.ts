import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-publish-flow-screen',
  templateUrl: './publish-flow-screen.component.html',
  standalone: false,
})
export class PublishFlowScreenComponent {
  @Input({ required: true }) vm!: any;
}
