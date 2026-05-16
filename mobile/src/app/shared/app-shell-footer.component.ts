import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-shell-footer',
  templateUrl: './app-shell-footer.component.html',
  standalone: false,
})
export class AppShellFooterComponent {
  @Input({ required: true }) vm!: any;
}
