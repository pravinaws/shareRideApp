import { Component, Input } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { AuthService } from '../services/auth.service';
import { RealtimeService } from '../services/realtime.service';

@Component({
  selector: 'app-auth-screen',
  templateUrl: './auth-screen.component.html',
  standalone: false,
})
export class AuthScreenComponent {
  @Input({ required: true }) vm!: any;

  private otpResendTimer?: number;

  constructor(
    private readonly auth: AuthService,
    private readonly realtime: RealtimeService,
  ) {}

  get authPhoneDisplay() {
    const phone = String(this.vm?.loginForm?.phone || '').trim();
    return phone ? `+91 ${phone}` : '+91';
  }

  private isLoginPhoneValid() {
    return /^\d{10}$/.test(this.vm.loginForm.phone);
  }

  private isSignupEmailValid() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(this.vm.loginForm.email || '').trim());
  }

  private getApiErrorMessage(error: any, fallback: string) {
    if (error?.status === 0) {
      return Capacitor.isNativePlatform()
        ? `Cannot reach API ${this.vm.apiUrl}. Check mobile internet and reinstall the latest APK.`
        : `Cannot reach API ${this.vm.apiUrl}. Check that the local backend is running and refresh the page.`;
    }
    return error?.error?.error || error?.error?.message || error?.message || fallback;
  }

  private scrollAuthToTop() {
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  private startOtpResendTimer() {
    this.stopOtpResendTimer();
    this.vm.otpResendSeconds = 45;
    this.otpResendTimer = window.setInterval(() => {
      this.vm.otpResendSeconds = Math.max(0, this.vm.otpResendSeconds - 1);
      if (this.vm.otpResendSeconds === 0) {
        this.stopOtpResendTimer();
      }
    }, 1000);
  }

  private stopOtpResendTimer() {
    if (this.otpResendTimer) {
      window.clearInterval(this.otpResendTimer);
      this.otpResendTimer = undefined;
    }
    this.vm.otpResendSeconds = 0;
  }

  sendLoginOtp() {
    if (this.vm.otpResendSeconds > 0) {
      this.vm.presentToast(`Resend OTP in ${this.vm.otpResendSeconds}s`);
      return;
    }

    if (!this.isLoginPhoneValid()) {
      this.vm.presentToast('Enter 10 digit numeric mobile number');
      return;
    }

    if (this.vm.authMode === 'signup' && !this.isSignupEmailValid()) {
      this.vm.presentToast('Enter valid email for notifications');
      return;
    }

    this.vm.otpSending = true;
    this.vm.liveActivity = 'Sending WhatsApp OTP...';
    this.auth.sendOtp(this.vm.loginForm.phone, this.vm.authMode === 'signup' ? this.vm.loginForm.email : undefined).subscribe({
      next: (response) => {
        this.vm.otpSent = true;
        this.vm.otpSending = false;
        this.scrollAuthToTop();
        this.startOtpResendTimer();
        if (response.testOtp) {
          this.vm.loginForm.otp = response.testOtp;
          this.vm.liveActivity = `Testing OTP: ${response.testOtp}`;
          this.vm.presentToast(`Testing OTP: ${response.testOtp}`);
          return;
        }
        this.vm.liveActivity = 'WhatsApp OTP sent. Check your phone.';
        this.vm.presentToast('WhatsApp OTP sent');
      },
      error: (error) => {
        this.vm.otpSending = false;
        this.vm.liveActivity = this.getApiErrorMessage(error, 'WhatsApp OTP failed');
        this.vm.presentToast(this.vm.liveActivity);
      },
    });
  }

  showSignupForm() {
    this.vm.authMode = 'signup';
    this.vm.otpSent = false;
    this.vm.loginForm.otp = '';
    this.stopOtpResendTimer();
    this.scrollAuthToTop();
  }

  showLoginForm() {
    this.vm.authMode = 'login';
    this.vm.otpSent = false;
    this.vm.loginForm.otp = '';
    this.stopOtpResendTimer();
    this.scrollAuthToTop();
  }

  backAuthStep() {
    if (this.vm.otpSent) {
      this.vm.otpSent = false;
      this.vm.loginForm.otp = '';
      this.stopOtpResendTimer();
      this.scrollAuthToTop();
      return;
    }
    this.showLoginForm();
  }

  login() {
    if (!this.isLoginPhoneValid()) {
      this.vm.presentToast('Enter 10 digit numeric mobile number');
      return;
    }
    if (this.vm.loginForm.otp.length < 4) {
      this.vm.presentToast('Enter OTP received on WhatsApp');
      return;
    }
    if (this.vm.authMode === 'signup' && !this.isSignupEmailValid()) {
      this.vm.presentToast('Enter valid email for notifications');
      return;
    }

    this.vm.loginSubmitting = true;
    this.vm.liveActivity = 'Verifying OTP...';
    this.auth.login(
      this.vm.loginForm.phone,
      this.vm.loginForm.otp,
      this.vm.loginForm.role,
      this.vm.authMode === 'signup' ? this.vm.loginForm.fullName : undefined,
      this.vm.authMode === 'signup' ? this.vm.loginForm.email : undefined,
      this.vm.authMode,
      this.vm.authMode === 'signup' ? this.vm.normalizeReferralCode(this.vm.loginForm.referralCode) : undefined,
    ).subscribe({
      next: () => {
        this.vm.loginSubmitting = false;
        this.vm.isLoggedIn = true;
        this.vm.profile.phone = `+91${this.vm.loginForm.phone}`;
        this.vm.registerReferralClaim();
        this.vm.restoreAuthenticatedSession();
        this.stopOtpResendTimer();
        this.vm.liveActivity = 'WhatsApp OTP verified - realtime session started';
        this.realtime.connect();
        this.vm.presentToast(this.vm.authMode === 'signup' ? 'Signup successful' : 'Login successful');
        this.vm.goTo('/search');
      },
      error: (error) => {
        this.vm.loginSubmitting = false;
        this.vm.liveActivity = this.getApiErrorMessage(error, 'OTP verification failed');
        this.vm.presentToast(this.vm.liveActivity);
      },
    });
  }

  adminLogin() {
    if (!this.vm.adminLoginForm.username.trim() || !this.vm.adminLoginForm.password) {
      this.vm.presentToast('Enter admin username and password');
      return;
    }
    this.vm.adminLoginSubmitting = true;
    this.vm.liveActivity = 'Signing in as admin...';
    this.auth.adminLogin(this.vm.adminLoginForm.username.trim(), this.vm.adminLoginForm.password).subscribe({
      next: () => {
        this.vm.adminLoginSubmitting = false;
        this.vm.isLoggedIn = true;
        this.vm.restoreAuthenticatedSession();
        this.realtime.connect();
        this.vm.liveActivity = 'Admin session started';
        this.vm.presentToast('Admin login successful');
        this.vm.goTo('/admin');
      },
      error: (error) => {
        this.vm.adminLoginSubmitting = false;
        this.vm.liveActivity = this.getApiErrorMessage(error, 'Admin login failed');
        this.vm.presentToast(this.vm.liveActivity);
      },
    });
  }
}
