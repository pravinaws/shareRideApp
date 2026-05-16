import { Component, Input } from '@angular/core';
import { RideApiService } from '../services/ride-api.service';

@Component({
  selector: 'app-payments-screen',
  templateUrl: './payments-screen.component.html',
  standalone: false,
})
export class PaymentsScreenComponent {
  @Input({ required: true }) vm!: any;

  constructor(private readonly api: RideApiService) {}

  setWalletTopUpAmount(amount: number) {
    this.vm.walletTopUpAmount = amount;
  }

  openWithdrawDialog() {
    if (!this.vm.auth.isAuthenticated || this.vm.auth.token === 'demo-token') {
      this.vm.presentToast('Login is required for wallet withdrawal');
      return;
    }
    this.vm.withdrawForm = {
      accountHolderName: this.vm.profile.fullName || '',
      bankName: '',
      accountNumber: '',
      confirmAccountNumber: '',
      ifscCode: '',
      amount: null,
    };
    this.vm.withdrawDialogOpen = true;
  }

  topUpWallet() {
    const amount = Number(this.vm.walletTopUpAmount);
    if (!amount || amount < 1) {
      this.vm.presentToast('Enter a valid wallet amount');
      return;
    }
    if (!this.vm.auth.isAuthenticated || this.vm.auth.token === 'demo-token') {
      this.vm.presentToast('Login is required for Razorpay wallet top-up');
      return;
    }
    this.vm.walletProcessing = true;
    this.vm.appLoading = true;
    this.api.createPayment({ bookingId: 0, amount, provider: 'razorpay' }).subscribe({
      next: (response: any) => this.vm.openRazorpayCheckout(response.payment, response.razorpay),
      error: (error) => {
        this.vm.walletProcessing = false;
        this.vm.appLoading = false;
        this.vm.presentToast(error?.error?.error || 'Unable to start Razorpay payment');
      },
    });
  }
}
