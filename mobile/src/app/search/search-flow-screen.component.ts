import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-search-flow-screen',
  templateUrl: './search-flow-screen.component.html',
  standalone: false,
})
export class SearchFlowScreenComponent {
  @Input({ required: true }) vm!: any;
}
