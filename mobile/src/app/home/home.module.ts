import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import { AuthScreenComponent } from '../auth/auth-screen.component';
import { SearchFlowScreenComponent } from '../search/search-flow-screen.component';
import { PublishFlowScreenComponent } from '../publish/publish-flow-screen.component';
import { RidesFlowScreenComponent } from '../rides/rides-flow-screen.component';
import { ProfileFlowScreenComponent } from '../profile/profile-flow-screen.component';
import { AdminScreenComponent } from '../admin/admin-screen.component';
import { AccountFlowScreenComponent } from '../settings/account-flow-screen.component';
import { PaymentsScreenComponent } from '../payments/payments-screen.component';
import { NotificationsScreenComponent } from '../notifications/notifications-screen.component';
import { InboxFlowScreenComponent } from '../inbox/inbox-flow-screen.component';
import { AppOverlaysComponent } from '../shared/app-overlays.component';
import { AppShellFooterComponent } from '../shared/app-shell-footer.component';

import { HomePageRoutingModule } from './home-routing.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule
  ],
  declarations: [
    HomePage,
    AuthScreenComponent,
    SearchFlowScreenComponent,
    PublishFlowScreenComponent,
    RidesFlowScreenComponent,
    ProfileFlowScreenComponent,
    AdminScreenComponent,
    AccountFlowScreenComponent,
    PaymentsScreenComponent,
    NotificationsScreenComponent,
    InboxFlowScreenComponent,
    AppOverlaysComponent,
    AppShellFooterComponent,
  ]
})
export class HomePageModule {}
