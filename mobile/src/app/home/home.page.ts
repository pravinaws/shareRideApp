import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  addOutline,
  alertCircleOutline,
  arrowBackOutline,
  calendarOutline,
  cameraOutline,
  businessOutline,
  carOutline,
  cardOutline,
  chatbubbleEllipsesOutline,
  checkmarkDoneOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
  closeCircleOutline,
  cloudUploadOutline,
  createOutline,
  documentAttachOutline,
  documentTextOutline,
  ellipsisVerticalOutline,
  eyeOutline,
  flagOutline,
  funnelOutline,
  gitBranchOutline,
  shareSocialOutline,
  lockClosedOutline,
  locationOutline,
  mapOutline,
  moonOutline,
  notificationsOutline,
  optionsOutline,
  personCircleOutline,
  removeOutline,
  searchOutline,
  settingsOutline,
  shieldCheckmarkOutline,
  starOutline,
  timeOutline,
  trashOutline,
  walletOutline,
} from 'ionicons/icons';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { RealtimeService } from '../services/realtime.service';
import { RideApiService } from '../services/ride-api.service';
import { filter } from 'rxjs';

type LocationField = 'from' | 'to';
type AdminMoneyTab = 'admin' | 'owners' | 'passengers';

interface LocationSuggestion {
  id: string;
  title: string;
  subtitle: string;
  lat?: number;
  lng?: number;
  source: 'map' | 'popular' | 'recent' | 'typed';
}

interface RideSearchResult {
  id?: number;
  driverId?: number;
  driver: string;
  photo: string;
  rating: string;
  departure: string;
  arrival: string;
  route: string;
  price: string;
  priceValue: number;
  seats: number;
  totalSeats: number;
  bookedSeats: number;
  status: 'Full booked' | 'Available';
  instant: boolean;
  verified: boolean;
  owner: string;
  vehicle: string;
  vehicleMeta: string;
  pickup: string;
  drop: string;
  liveLocation: string;
  liveStatus: string;
  lastLocationUpdate: string;
  passengers: string[];
  duration: string;
  serviceFee: number;
}

interface PassengerPublicProfile {
  name: string;
  photo: string;
  pickup: string;
  rating: string;
  moods: string[];
  verified: boolean;
}

interface BookingRequestDetails {
  bookingId?: number;
  rideId?: number;
  passengerId?: number;
  passengerName: string;
  passengerPhoto: string;
  passengerPhone: string;
  passengerEmail?: string;
  passengerGovIdNumber: string;
  verified: boolean;
  seatsBooked?: number;
  status?: string;
  from: string;
  to: string;
  route: string;
  vehicle: string;
  pickup: string;
  drop: string;
}

interface ManagedRideItem {
  id?: number;
  tab: 'My Published Rides' | 'Past' | 'Archived';
  driver: string;
  image: string;
  route: string;
  date: string;
  time: string;
  price: string;
  status: string;
  vehicle?: string;
  seatsAvailable?: number;
  totalSeats?: number;
  bookingRequests?: BookingRequestDetails[];
}

interface NotificationCenterItem {
  type: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  icon: string;
  bookingDetails?: BookingRequestDetails;
  action?: 'same_route' | 'messages' | 'vehicles' | 'payments' | 'profile' | 'rides';
}

interface WalletTransactionItem {
  title: string;
  amountValue: number;
  amountLabel: string;
  status: string;
  transactionId: string;
  timestamp: string;
}

interface ReferralClaim {
  code: string;
  referredPhone: string;
  referredName: string;
  reward: number;
  createdAt: string;
  creditedToReferrer: boolean;
  creditedToReferred: boolean;
}

interface AccountSectionItem {
  title: string;
  icon: string;
  route: string;
  subtitle?: string;
  statusText?: string;
  statusTone?: 'verified' | 'pending';
}

interface ProfileVehicle {
  vehicleId?: number;
  make: string;
  model: string;
  color: string;
  plateNumber: string;
  seats: number;
  status: string;
  rcDocumentUrl?: string;
  insuranceDocumentUrl?: string;
  frontPhotoUrl?: string;
  backPhotoUrl?: string;
}

interface ProfileReview {
  rating: number;
  comment: string;
  reviewer?: {
    full_name?: string;
  };
}

interface ProfileStats {
  completedRides: number;
  reviews: number;
  vehicles: number;
  savedPassengers: number;
}

interface AdminUser {
  id: number;
  name: string;
  role: 'owner' | 'passenger';
  photo: string;
  phone: string;
  email?: string;
  status: 'active' | 'blocked' | 'warning';
  verification: 'pending' | 'verified' | 'rejected' | 'reupload';
  rides: number;
  balance: number;
  warningCount: number;
  govIdNumber?: string;
  documents?: AdminDocument[];
}

interface AdminDocument {
  label: string;
  value: string;
  status: 'pending' | 'verified' | 'reupload' | 'rejected';
  previewUrl?: string;
}

interface AdminVehicleCase {
  id: number;
  ownerId: number;
  owner: string;
  vehicle: string;
  plate: string;
  documents: string;
  status: 'pending' | 'verified' | 'reupload' | 'rejected';
  color?: string;
  seats?: number;
  documentItems?: AdminDocument[];
}

interface AdminTour {
  id: number;
  type: 'Passenger tour' | 'Vehicle tour';
  route: string;
  user: string;
  vehicle: string;
  status: string;
  amount: number;
}

interface AdminTransaction {
  id: number;
  user: string;
  role: string;
  title: string;
  amount: number;
  status: string;
  type?: 'Deposit' | 'Withdraw' | 'Refund' | 'Failed' | 'Canceled' | 'Payout' | 'Adjustment';
  date?: string;
  time?: string;
  method?: string;
  reference?: string;
}

interface AdminLog {
  id: number;
  type: 'Passenger' | 'Owner' | 'Ride' | 'Security' | 'Ads';
  action: string;
  actor: string;
  target: string;
  priority: 'active' | 'pending' | 'warning' | 'blocked';
  icon: string;
  createdAt: string;
}

interface AdminAd {
  id: number;
  name: string;
  type: string;
  partner: string;
  size: string;
  placement: string;
  area: string;
  state: string;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  ctr: number;
  status: 'active' | 'disabled' | 'expired';
}

interface AdPartner {
  id: number;
  partnerName: string;
  companyName: string;
  contactPerson: string;
  mobile: string;
  email: string;
  address: string;
  gstNumber: string;
  type: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'active' | 'disabled';
  startDate: string;
  endDate: string;
}

interface AdInvoice {
  invoiceNumber: string;
  partnerName: string;
  adName: string;
  placement: string;
  runningDays: number;
  baseAmount: number;
  gst: number;
  finalAmount: number;
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded' | 'Partial Payment';
  paymentMode: string;
  transactionRef: string;
}

interface AdHistory {
  id: number;
  adName: string;
  action: string;
  details: string;
  adminUser: string;
  createdAt: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  apiUrl = environment.apiUrl;
  platform = Capacitor.getPlatform();
  showIntroSplash = Capacitor.isNativePlatform();
  status = 'Ready';
  isLoggedIn = false;
  liveActivity = 'Realtime channel connected';
  unreadCount = 2;
  authMode: 'login' | 'signup' = 'login';
  currentRouteValue = '/login';
  otpSent = false;
  otpSending = false;
  otpResendSeconds = 0;
  otpBoxIndexes = [0, 1, 2, 3, 4, 5];
  private otpResendTimer?: number;
  loginSubmitting = false;
  loginForm = {
    fullName: 'Harshala',
    email: '',
    phone: '9970795914',
    otp: '',
    referralCode: '',
    role: 'driver' as 'passenger' | 'driver',
  };
  profileLoading = false;
  profileSaving = false;
  personalDetailsEditing = false;
  profile = {
    fullName: 'Harshala',
    age: 29,
    birthDate: '1997-01-01',
    rating: 4.9,
    role: 'driver',
    verificationStatus: 'verified',
    phone: '+919970795914',
    email: 'harshala@example.com',
    address: 'Pune, Maharashtra',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    gender: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    bio: 'Clean car, safe driving, and punctual pickup. Prefer verified travellers for office and intercity routes.',
    referralCode: '',
    memberSince: '2026',
    govIdNumber: '',
    govIdFrontUrl: '',
    govIdBackUrl: '',
    passengerVerificationStatus: 'pending',
    stats: {
      completedRides: 42,
      reviews: 18,
      vehicles: 1,
      savedPassengers: 7,
    },
    travelPreferences: {
      music: 'Soft music',
      chat: 'Friendly chat',
      smoking: 'No smoking',
      pets: 'Ask first',
    },
    reviews: [
      {
        rating: 5,
        comment: 'Very professional and smooth ride. Pickup was exactly on time.',
        reviewer: { full_name: 'Aarav Mehta' },
      },
    ] as ProfileReview[],
  };
  vehicleForm = {
    vehicleId: null as number | null,
    make: '',
    model: '',
    color: '',
    plateNumber: '',
    seats: 4,
    rcDocumentUrl: '',
    insuranceDocumentUrl: '',
    frontPhotoUrl: '',
    backPhotoUrl: '',
    status: 'pending',
  };
  vehicleCatalog = [
    {
      make: 'Maruti Suzuki',
      models: [
        { name: 'Alto K10', seats: 5 },
        { name: 'Swift', seats: 5 },
        { name: 'Baleno', seats: 5 },
        { name: 'Dzire', seats: 5 },
        { name: 'Brezza', seats: 5 },
        { name: 'Ertiga', seats: 7 },
        { name: 'XL6', seats: 6 },
      ],
    },
    {
      make: 'Hyundai',
      models: [
        { name: 'Grand i10 Nios', seats: 5 },
        { name: 'i20', seats: 5 },
        { name: 'Aura', seats: 5 },
        { name: 'Verna', seats: 5 },
        { name: 'Venue', seats: 5 },
        { name: 'Creta', seats: 5 },
        { name: 'Alcazar', seats: 7 },
      ],
    },
    {
      make: 'Tata',
      models: [
        { name: 'Tiago', seats: 5 },
        { name: 'Tigor', seats: 5 },
        { name: 'Punch', seats: 5 },
        { name: 'Nexon', seats: 5 },
        { name: 'Altroz', seats: 5 },
        { name: 'Harrier', seats: 5 },
        { name: 'Safari', seats: 7 },
      ],
    },
    {
      make: 'Mahindra',
      models: [
        { name: 'XUV 3XO', seats: 5 },
        { name: 'Bolero Neo', seats: 7 },
        { name: 'Scorpio N', seats: 7 },
        { name: 'Thar', seats: 4 },
        { name: 'XUV700', seats: 7 },
        { name: 'Marazzo', seats: 7 },
      ],
    },
    {
      make: 'Toyota',
      models: [
        { name: 'Glanza', seats: 5 },
        { name: 'Urban Cruiser Hyryder', seats: 5 },
        { name: 'Rumion', seats: 7 },
        { name: 'Innova Crysta', seats: 7 },
        { name: 'Innova Hycross', seats: 7 },
        { name: 'Fortuner', seats: 7 },
      ],
    },
    {
      make: 'Honda',
      models: [
        { name: 'Amaze', seats: 5 },
        { name: 'City', seats: 5 },
        { name: 'Elevate', seats: 5 },
      ],
    },
    {
      make: 'Kia',
      models: [
        { name: 'Sonet', seats: 5 },
        { name: 'Seltos', seats: 5 },
        { name: 'Carens', seats: 7 },
        { name: 'Carnival', seats: 7 },
      ],
    },
    {
      make: 'Renault',
      models: [
        { name: 'Kwid', seats: 5 },
        { name: 'Kiger', seats: 5 },
        { name: 'Triber', seats: 7 },
      ],
    },
    {
      make: 'Nissan',
      models: [
        { name: 'Magnite', seats: 5 },
        { name: 'Kicks', seats: 5 },
      ],
    },
    {
      make: 'Skoda',
      models: [
        { name: 'Slavia', seats: 5 },
        { name: 'Kushaq', seats: 5 },
        { name: 'Kodiaq', seats: 7 },
      ],
    },
    {
      make: 'Volkswagen',
      models: [
        { name: 'Polo', seats: 5 },
        { name: 'Virtus', seats: 5 },
        { name: 'Taigun', seats: 5 },
        { name: 'Tiguan', seats: 5 },
      ],
    },
    {
      make: 'MG',
      models: [
        { name: 'Astor', seats: 5 },
        { name: 'Hector', seats: 5 },
        { name: 'Hector Plus', seats: 7 },
        { name: 'Gloster', seats: 7 },
      ],
    },
    {
      make: 'Citroen',
      models: [
        { name: 'C3', seats: 5 },
        { name: 'eC3', seats: 5 },
        { name: 'C3 Aircross', seats: 7 },
        { name: 'Basalt', seats: 5 },
        { name: 'C5 Aircross', seats: 5 },
      ],
    },
    {
      make: 'Jeep',
      models: [
        { name: 'Compass', seats: 5 },
        { name: 'Meridian', seats: 7 },
        { name: 'Wrangler', seats: 5 },
        { name: 'Grand Cherokee', seats: 5 },
      ],
    },
    {
      make: 'BYD',
      models: [
        { name: 'Atto 3', seats: 5 },
        { name: 'e6', seats: 5 },
        { name: 'Seal', seats: 5 },
      ],
    },
    {
      make: 'Mercedes-Benz',
      models: [
        { name: 'A-Class Limousine', seats: 5 },
        { name: 'C-Class', seats: 5 },
        { name: 'E-Class', seats: 5 },
        { name: 'GLA', seats: 5 },
        { name: 'GLC', seats: 5 },
        { name: 'GLE', seats: 5 },
        { name: 'GLS', seats: 7 },
      ],
    },
    {
      make: 'BMW',
      models: [
        { name: '2 Series Gran Coupe', seats: 5 },
        { name: '3 Series', seats: 5 },
        { name: '5 Series', seats: 5 },
        { name: 'X1', seats: 5 },
        { name: 'X3', seats: 5 },
        { name: 'X5', seats: 5 },
        { name: 'X7', seats: 7 },
      ],
    },
    {
      make: 'Audi',
      models: [
        { name: 'A4', seats: 5 },
        { name: 'A6', seats: 5 },
        { name: 'Q3', seats: 5 },
        { name: 'Q5', seats: 5 },
        { name: 'Q7', seats: 7 },
      ],
    },
    {
      make: 'Volvo',
      models: [
        { name: 'XC40', seats: 5 },
        { name: 'XC60', seats: 5 },
        { name: 'XC90', seats: 7 },
        { name: 'S90', seats: 5 },
      ],
    },
    {
      make: 'Lexus',
      models: [
        { name: 'ES', seats: 5 },
        { name: 'NX', seats: 5 },
        { name: 'RX', seats: 5 },
        { name: 'LX', seats: 7 },
      ],
    },
    {
      make: 'Isuzu',
      models: [
        { name: 'D-Max V-Cross', seats: 5 },
        { name: 'MU-X', seats: 7 },
      ],
    },
    {
      make: 'Force Motors',
      models: [
        { name: 'Gurkha', seats: 4 },
        { name: 'Trax Cruiser', seats: 9 },
        { name: 'Traveller', seats: 12 },
      ],
    },
    {
      make: 'Ford',
      models: [
        { name: 'Figo', seats: 5 },
        { name: 'Aspire', seats: 5 },
        { name: 'Freestyle', seats: 5 },
        { name: 'EcoSport', seats: 5 },
        { name: 'Endeavour', seats: 7 },
      ],
    },
    {
      make: 'Chevrolet',
      models: [
        { name: 'Beat', seats: 5 },
        { name: 'Spark', seats: 5 },
        { name: 'Sail', seats: 5 },
        { name: 'Enjoy', seats: 7 },
        { name: 'Cruze', seats: 5 },
      ],
    },
    {
      make: 'Fiat',
      models: [
        { name: 'Punto', seats: 5 },
        { name: 'Linea', seats: 5 },
        { name: 'Avventura', seats: 5 },
      ],
    },
    {
      make: 'Datsun',
      models: [
        { name: 'Redi-GO', seats: 5 },
        { name: 'GO', seats: 5 },
        { name: 'GO+', seats: 7 },
      ],
    },
    {
      make: 'Mitsubishi',
      models: [
        { name: 'Pajero Sport', seats: 7 },
        { name: 'Outlander', seats: 7 },
        { name: 'Lancer', seats: 5 },
      ],
    },
    {
      make: 'Jaguar',
      models: [
        { name: 'XE', seats: 5 },
        { name: 'XF', seats: 5 },
        { name: 'F-Pace', seats: 5 },
      ],
    },
    {
      make: 'Land Rover',
      models: [
        { name: 'Discovery Sport', seats: 7 },
        { name: 'Defender', seats: 7 },
        { name: 'Range Rover Evoque', seats: 5 },
        { name: 'Range Rover Velar', seats: 5 },
      ],
    },
    {
      make: 'Mini',
      models: [
        { name: 'Cooper', seats: 4 },
        { name: 'Countryman', seats: 5 },
      ],
    },
    {
      make: 'Porsche',
      models: [
        { name: 'Macan', seats: 5 },
        { name: 'Cayenne', seats: 5 },
        { name: 'Panamera', seats: 4 },
      ],
    },
  ];
  vehicleSaving = false;
  activeVehicleMenuId: string | null = null;
  editingVehicleKey: string | null = null;
  activeVehicleLookup: 'make' | 'model' | null = null;
  token = '';
  lastNotification = 'None yet';
  deviceName = `${this.platform}-${Math.random().toString(16).slice(2, 8)}`;
  activeTab: 'search' | 'publish' | 'yourRides' | 'inbox' | 'profile' = 'search';
  searchState: 'ready' | 'loading' | 'error' | 'empty' = 'ready';
  toastMessage = '';
  showSuccess = false;
  isDark = false;
  datePickerOpen = false;
  filterDropdownOpen = false;
  search = {
    from: 'Bengaluru',
    to: 'Mysuru',
    date: 'Today',
    dateValue: this.toDateInputValue(new Date()),
    seats: 2,
    fromLat: 12.9716,
    fromLng: 77.5946,
    toLat: 12.2958,
    toLng: 76.6394,
  };
  activeLocationField: LocationField | null = null;
  locationLoading: Record<LocationField, boolean> = {
    from: false,
    to: false,
  };
  locationError: Record<LocationField, string> = {
    from: '',
    to: '',
  };
  locationSuggestions: Record<LocationField, LocationSuggestion[]> = {
    from: [],
    to: [],
  };
  private readonly locationTimers: Record<LocationField, ReturnType<typeof setTimeout> | undefined> = {
    from: undefined,
    to: undefined,
  };
  private readonly popularLocations: LocationSuggestion[] = [
    {
      id: 'popular-bengaluru',
      title: 'Bengaluru',
      subtitle: 'Karnataka, India',
      lat: 12.9716,
      lng: 77.5946,
      source: 'popular',
    },
    {
      id: 'popular-mysuru',
      title: 'Mysuru',
      subtitle: 'Karnataka, India',
      lat: 12.2958,
      lng: 76.6394,
      source: 'popular',
    },
    {
      id: 'popular-airport',
      title: 'Kempegowda International Airport',
      subtitle: 'Bengaluru, Karnataka',
      lat: 13.1986,
      lng: 77.7066,
      source: 'popular',
    },
    {
      id: 'popular-whitefield',
      title: 'Whitefield',
      subtitle: 'Bengaluru, Karnataka',
      lat: 12.9698,
      lng: 77.75,
      source: 'popular',
    },
    {
      id: 'popular-hsr',
      title: 'HSR Layout',
      subtitle: 'Bengaluru, Karnataka',
      lat: 12.9116,
      lng: 77.6474,
      source: 'popular',
    },
    {
      id: 'popular-electronic-city',
      title: 'Electronic City',
      subtitle: 'Bengaluru, Karnataka',
      lat: 12.8452,
      lng: 77.6602,
      source: 'popular',
    },
  ];
  publishStep = 1;
  steps = ['Route', 'Time', 'Seats', 'Confirm'];
  rides = [
    {
      driver: 'Aarav Mehta',
      route: 'Bengaluru to Mysuru',
      time: '08:30 AM',
      price: 'INR 420',
      seats: 3,
      rating: '4.9',
      verified: true,
      badge: 'Fastest',
    },
    {
      driver: 'Nisha Rao',
      route: 'Indiranagar to Mandya',
      time: '10:15 AM',
      price: 'INR 360',
      seats: 2,
      rating: '4.8',
      verified: true,
      badge: 'Eco',
    },
  ];
  recentSearches = [
    { from: 'Bengaluru', to: 'Mysuru', date: 'Today', passengers: 2 },
    { from: 'HSR Layout', to: 'Electronic City', date: 'Tomorrow', passengers: 1 },
    { from: 'Whitefield', to: 'Airport', date: 'Fri, 8 May', passengers: 3 },
  ];
  sponsoredAds = [
    {
      label: 'Wallet offer',
      title: 'Save 15% on your next ride',
      body: 'Use FastPay for verified shared rides this week.',
      cta: 'Apply',
      variant: 'default',
    },
    {
      label: 'Premium',
      title: 'Priority pickup lanes',
      body: 'Book clean, rated cars for office commutes.',
      cta: 'Explore',
      variant: 'alt',
    },
  ];
  chats = [
    { id: 1, from: 'driver', text: 'Hi, I can pick you near Metro Gate 2.', time: '09:10' },
    { id: 2, from: 'me', text: 'Perfect. I will be there 10 minutes early.', time: '09:11' },
    { id: 3, from: 'driver', text: 'Great, ride confirmed.', time: '09:12' },
  ] as Array<{
    id: number;
    from: 'driver' | 'me';
    text: string;
    time: string;
    attachment?: string;
    attachmentType?: 'image' | 'file';
    previewUrl?: string;
  }>;
  chatDraft = '';
  attachedFileName = '';
  attachedFileType: 'image' | 'file' = 'file';
  attachedPreviewUrl = '';
  isTyping = false;
  remoteTypingUser = '';
  chatLoading = false;
  walletProcessing = false;
  appLoading = false;
  private typingTimer?: number;
  private remoteTypingTimer?: number;
  settings = [
    'Identity verification',
    'Notification preferences',
    'Privacy and safety',
  ];
  rideTabs = ['My Published Rides', 'Past', 'Archived'];
  activeRideTab = 'My Published Rides';
  managedRides: ManagedRideItem[] = [
    {
      id: 1,
      tab: 'My Published Rides',
      driver: 'Harshala',
      image: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Crect width=%2280%22 height=%2280%22 rx=%2224%22 fill=%22%23001F3F%22/%3E%3Ctext x=%2240%22 y=%2248%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2228%22 font-weight=%22700%22 fill=%22white%22%3EAM%3C/text%3E%3C/svg%3E',
      route: 'Bengaluru to Mysuru',
      date: 'Today',
      time: '08:30 AM',
      price: 'INR 420',
      status: 'Published',
      vehicle: 'Hyundai Verna',
      seatsAvailable: 3,
      totalSeats: 4,
      bookingRequests: [],
    },
    {
      id: 2,
      tab: 'Past',
      driver: 'Nisha Rao',
      image: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Crect width=%2280%22 height=%2280%22 rx=%2224%22 fill=%22%23123E68%22/%3E%3Ctext x=%2240%22 y=%2248%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2228%22 font-weight=%22700%22 fill=%22white%22%3ENR%3C/text%3E%3C/svg%3E',
      route: 'Airport to Whitefield',
      date: '5 May',
      time: '06:10 PM',
      price: 'INR 680',
      status: 'Completed',
    },
  ];
  conversations = [
    {
      name: 'Aarav Mehta',
      image: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Crect width=%2280%22 height=%2280%22 rx=%2224%22 fill=%22%23001F3F%22/%3E%3Ctext x=%2240%22 y=%2248%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2228%22 font-weight=%22700%22 fill=%22white%22%3EAM%3C/text%3E%3C/svg%3E',
      trip: 'Bengaluru to Mysuru',
      last: 'I will reach pickup in 8 minutes.',
      time: '09:12',
      unread: 2,
      seen: false,
    },
    {
      name: 'Nisha Rao',
      image: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Crect width=%2280%22 height=%2280%22 rx=%2224%22 fill=%22%23123E68%22/%3E%3Ctext x=%2240%22 y=%2248%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2228%22 font-weight=%22700%22 fill=%22white%22%3ENR%3C/text%3E%3C/svg%3E',
      trip: 'Airport transfer',
      last: 'Thanks for booking.',
      time: 'Yesterday',
      unread: 0,
      seen: true,
    },
  ];
  private lastHandledPaymentRedirect = '';
  private readonly referralRewardStorageKey = 'rideshare.referralRewardAmount';
  private readonly referralClaimsStorageKey = 'rideshare.referralClaims';
  walletBalance = 2480;
  walletTopUpAmount = 500;
  readonly quickWalletAmounts = [100, 500, 1000];
  adminReferralRewardAmount = 100;
  referralClaims: ReferralClaim[] = [];
  withdrawDialogOpen = false;
  withdrawalProcessing = false;
  withdrawForm = {
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    amount: null as number | null,
  };
  rideDetailsBackRoute = '/results';
  selectedBookingRequest: BookingRequestDetails | null = null;
  ownerProfileOpen = false;
  selectedPassengerProfile: PassengerPublicProfile | null = null;
  selectedRideMode: 'active' | 'past' = 'active';
  pastRideRating = 0;
  pastRideFeedback = '';
  transactions: WalletTransactionItem[] = [
    {
      title: 'Razorpay wallet top-up',
      amountValue: 500,
      amountLabel: '+ INR 500',
      status: 'Paid',
      transactionId: '4927600101',
      timestamp: '14 May, 04:27 AM',
    },
    {
      title: 'Razorpay wallet top-up',
      amountValue: 111,
      amountLabel: 'INR 111',
      status: 'Failed',
      transactionId: '4927000202',
      timestamp: '14 May, 04:26 AM',
    },
  ];
  notificationCenter: NotificationCenterItem[] = [
    { type: 'Ride booked', title: 'Ride booking confirmed', message: 'Your seat to Mysuru is confirmed.', time: 'Now', unread: true, icon: 'checkmark-circle-outline' },
    { type: 'Message received', title: 'New driver message', message: 'Aarav shared pickup timing.', time: '5m', unread: true, icon: 'chatbubble-ellipses-outline' },
    { type: 'Ride request', title: 'Passenger requested a seat', message: 'Open to review passenger details and route.', time: '8m', unread: true, icon: 'person-circle-outline' },
    { type: 'Ride confirmed', title: 'Ride confirmed by owner', message: 'Your booking is confirmed for the same route.', time: '14m', unread: false, icon: 'checkmark-circle-outline' },
    { type: 'Ride rejected', title: 'Ride request rejected', message: 'Try another available owner on this route.', time: '25m', unread: false, icon: 'alert-circle-outline' },
    { type: 'Ride canceled', title: 'Passenger canceled ride', message: 'Seat availability was updated for owner and passengers.', time: '35m', unread: false, icon: 'close-circle-outline' },
    { type: 'Vehicle full', title: 'Vehicle fully booked', message: 'This vehicle has no seats left.', time: '45m', unread: false, icon: 'car-outline' },
    { type: 'Verification', title: 'Verification status updated', message: 'Your ID or vehicle verification status changed.', time: '1h', unread: false, icon: 'shield-checkmark-outline' },
    { type: 'Same route ride', title: 'New ride available on your route', message: 'Tap to view available rides from Your Rides.', time: '2h', unread: false, icon: 'notifications-outline', action: 'same_route' },
    { type: 'Payment success', title: 'Payment successful', message: 'INR 420 was paid securely.', time: '3h', unread: false, icon: 'wallet-outline' },
    { type: 'Rating reminder', title: 'Rate your ride', message: 'Tell us about your last trip.', time: 'Yesterday', unread: false, icon: 'star-outline' },
  ];
  accountSections: AccountSectionItem[] = [
    { title: 'Personal details', icon: 'person-circle-outline', route: '/profile', subtitle: 'Profile info and contact details' },
    { title: 'KYC', icon: 'shield-checkmark-outline', route: '/kyc' },
    { title: 'My Vehicle', icon: 'car-outline', route: '/vehicles' },
    { title: 'Referral', icon: 'git-branch-outline', route: '/referral' },
    { title: 'Payments', icon: 'wallet-outline', route: '/payments', subtitle: 'Wallet, add money, and withdrawals' },
    { title: 'Notifications', icon: 'notifications-outline', route: '/notifications', subtitle: 'Alerts and updates' },
    { title: 'Security', icon: 'lock-closed-outline', route: '/settings', subtitle: 'Account protection' },
    { title: 'Privacy', icon: 'shield-checkmark-outline', route: '/settings', subtitle: 'Permissions and visibility' },
    { title: 'Dark mode', icon: 'moon-outline', route: '/settings' },
  ];
  vehicles = [] as ProfileVehicle[];
  notificationFlow = [
    { title: 'Ride requested', status: 'Queued', tone: 'pending' },
    { title: 'Driver accepted', status: 'Push sent', tone: 'success' },
    { title: 'Pickup reminder', status: 'Scheduled', tone: 'pending' },
  ];
  filters = [
    { key: 'price', label: 'Price', active: true },
    { key: 'departure', label: 'Departure Time', active: false },
    { key: 'verified', label: 'Verified Drivers', active: true },
    { key: 'instant', label: 'Instant Booking', active: true },
  ];
  activeAdminTab = 'overview';
  adminTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'owners', label: 'Owners' },
    { key: 'passengers', label: 'Passengers' },
    { key: 'verify', label: 'Verify' },
    { key: 'tours', label: 'Tours' },
    { key: 'money', label: 'Money' },
    { key: 'logs', label: 'Logs' },
    { key: 'ads', label: 'Ads' },
    { key: 'partners', label: 'Partners' },
    { key: 'billing', label: 'Billing' },
    { key: 'analytics', label: 'Analytics' },
  ];
  adminOwners: AdminUser[] = [
    {
      id: 1,
      name: 'Harshala',
      role: 'owner',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
      phone: '+91 99707 95914',
      email: 'harshala@example.com',
      status: 'active',
      verification: 'verified',
      rides: 42,
      balance: 12840,
      warningCount: 0,
      govIdNumber: 'OWNER-VERIFIED-001',
      documents: [
        { label: 'Owner Gov ID front', value: 'Uploaded', status: 'verified' },
        { label: 'Owner Gov ID back', value: 'Uploaded', status: 'verified' },
        { label: 'Driving license', value: 'Uploaded', status: 'verified' },
      ],
    },
    {
      id: 2,
      name: 'Aarav Mehta',
      role: 'owner',
      photo: this.avatarForName('Aarav Mehta'),
      phone: '+91 90000 11111',
      email: 'aarav@example.com',
      status: 'warning',
      verification: 'verified',
      rides: 128,
      balance: 24620,
      warningCount: 1,
      govIdNumber: 'OWNER-VERIFIED-002',
      documents: [
        { label: 'Owner Gov ID front', value: 'Uploaded', status: 'verified' },
        { label: 'Owner Gov ID back', value: 'Uploaded', status: 'verified' },
        { label: 'Driving license', value: 'Uploaded', status: 'pending' },
      ],
    },
  ];
  adminPassengers: AdminUser[] = [
    {
      id: 21,
      name: 'Riya Sharma',
      role: 'passenger',
      photo: this.avatarForName('Riya Sharma'),
      phone: '+91 98888 12001',
      email: 'riya@example.com',
      status: 'active',
      verification: 'pending',
      rides: 18,
      balance: 2480,
      warningCount: 0,
      govIdNumber: 'PASS-PENDING-021',
      documents: [
        { label: 'Passenger Gov ID front', value: 'Uploaded', status: 'pending' },
        { label: 'Passenger Gov ID back', value: 'Uploaded', status: 'pending' },
      ],
    },
    {
      id: 22,
      name: 'Dev Patel',
      role: 'passenger',
      photo: this.avatarForName('Dev Patel'),
      phone: '+91 97777 23002',
      email: 'dev@example.com',
      status: 'active',
      verification: 'verified',
      rides: 31,
      balance: 920,
      warningCount: 0,
      govIdNumber: 'PASS-VERIFIED-022',
      documents: [
        { label: 'Passenger Gov ID front', value: 'Uploaded', status: 'verified' },
        { label: 'Passenger Gov ID back', value: 'Uploaded', status: 'verified' },
      ],
    },
  ];
  adminVehicleCases: AdminVehicleCase[] = [
    {
      id: 1,
      ownerId: 1,
      owner: 'Harshala',
      vehicle: 'Hyundai Verna',
      plate: 'KA 05 MK 2281',
      documents: 'RC, front, back verified',
      status: 'verified',
      color: 'White',
      seats: 4,
      documentItems: [
        { label: 'RC book', value: 'KA 05 MK 2281', status: 'verified' },
        { label: 'Vehicle front photo', value: 'White Hyundai Verna front', status: 'verified' },
        { label: 'Vehicle back photo', value: 'White Hyundai Verna back', status: 'verified' },
        { label: 'Insurance', value: 'Insurance uploaded', status: 'verified' },
      ],
    },
    {
      id: 2,
      ownerId: 2,
      owner: 'Aarav Mehta',
      vehicle: 'Maruti Baleno',
      plate: 'KA 03 NR 4108',
      documents: 'Insurance optional, RC uploaded',
      status: 'pending',
      color: 'Blue',
      seats: 4,
      documentItems: [
        { label: 'RC book', value: 'KA 03 NR 4108', status: 'pending' },
        { label: 'Vehicle front photo', value: 'Blue Maruti Baleno front', status: 'pending' },
        { label: 'Vehicle back photo', value: 'Blue Maruti Baleno back', status: 'pending' },
        { label: 'Insurance', value: 'Optional insurance uploaded', status: 'pending' },
      ],
    },
  ];
  adminTours: AdminTour[] = [
    { id: 1, type: 'Vehicle tour', route: 'Bengaluru to Mysuru', user: 'Aarav Mehta', vehicle: 'Hyundai Verna', status: 'Live', amount: 1680 },
    { id: 2, type: 'Passenger tour', route: 'Airport to Whitefield', user: 'Riya Sharma', vehicle: 'Maruti Baleno', status: 'Completed', amount: 680 },
    { id: 3, type: 'Vehicle tour', route: 'Whitefield to Mysuru', user: 'Kabir Singh', vehicle: 'Toyota Glanza', status: 'Dispute check', amount: 1560 },
  ];
  adminTransactions: AdminTransaction[] = [
    { id: 1, user: 'Riya Sharma', role: 'Passenger', title: 'Seat booking debit', amount: -420, status: 'Payment success' },
    { id: 2, user: 'Aarav Mehta', role: 'Owner', title: 'Driver payout credited', amount: 1260, status: 'Credited' },
    { id: 3, user: 'Dev Patel', role: 'Passenger', title: 'Refund initiated', amount: 180, status: 'Refund pending' },
  ];
  adminWalletTransactions: AdminTransaction[] = [
    { id: 101, user: 'Admin Float', role: 'Admin', title: 'Opening wallet float', amount: 25000, status: 'Credited', type: 'Deposit', date: '11 May 2026', time: '09:00 AM', method: 'Bank transfer', reference: 'ADM-FLT-1001' },
    { id: 102, user: 'Admin Float', role: 'Admin', title: 'Gateway settlement failed', amount: 0, status: 'Failed', type: 'Failed', date: '11 May 2026', time: '09:18 AM', method: 'Razorpay', reference: 'ADM-FAIL-1002' },
    { id: 103, user: 'Admin Float', role: 'Admin', title: 'Canceled duplicate credit', amount: -1200, status: 'Canceled', type: 'Canceled', date: '11 May 2026', time: '10:04 AM', method: 'Admin action', reference: 'ADM-CAN-1003' },
    { id: 104, user: 'Aarav Mehta', role: 'Owner', title: 'Driver payout credited', amount: 1260, status: 'Credited', type: 'Payout', date: '11 May 2026', time: '10:20 AM', method: 'UPI', reference: 'OWN-PAY-2201' },
    { id: 105, user: 'Aarav Mehta', role: 'Owner', title: 'Owner wallet withdrawal', amount: -800, status: 'Paid', type: 'Withdraw', date: '11 May 2026', time: '11:05 AM', method: 'Bank transfer', reference: 'OWN-WD-2202' },
    { id: 106, user: 'Kabir Singh', role: 'Owner', title: 'Payout refund reversal', amount: -320, status: 'Refunded', type: 'Refund', date: '10 May 2026', time: '07:42 PM', method: 'Wallet', reference: 'OWN-REF-2203' },
    { id: 107, user: 'Riya Sharma', role: 'Passenger', title: 'Wallet money added', amount: 2000, status: 'Payment success', type: 'Deposit', date: '11 May 2026', time: '09:35 AM', method: 'UPI', reference: 'PAS-DEP-3301' },
    { id: 108, user: 'Dev Patel', role: 'Passenger', title: 'Wallet top-up via UPI', amount: 1000, status: 'Payment success', type: 'Deposit', date: '11 May 2026', time: '09:52 AM', method: 'UPI', reference: 'PAS-DEP-3302' },
    { id: 109, user: 'Riya Sharma', role: 'Passenger', title: 'Ride cancellation refund', amount: 420, status: 'Refunded', type: 'Refund', date: '10 May 2026', time: '06:15 PM', method: 'Wallet', reference: 'PAS-REF-3303' },
    { id: 110, user: 'Dev Patel', role: 'Passenger', title: 'Failed card wallet add', amount: 0, status: 'Failed', type: 'Failed', date: '10 May 2026', time: '02:40 PM', method: 'Card', reference: 'PAS-FAIL-3304' },
    { id: 111, user: 'Riya Sharma', role: 'Passenger', title: 'Canceled wallet withdrawal', amount: 0, status: 'Canceled', type: 'Canceled', date: '09 May 2026', time: '08:10 PM', method: 'Admin action', reference: 'PAS-CAN-3305' },
  ];
  adminMoneyTabs: { key: AdminMoneyTab; label: string }[] = [
    { key: 'admin', label: 'Admin' },
    { key: 'owners', label: 'Owners' },
    { key: 'passengers', label: 'Passengers' },
  ];
  adminMoneyTab: AdminMoneyTab = 'admin';
  adminMoneyPage = 1;
  adminMoneyPageSize = 5;
  selectedAdminUser: AdminUser | null = null;
  selectedAdminVehicle: AdminVehicleCase | null = null;
  selectedAdminDocument: AdminDocument | null = null;
  adminLogSearch = '';
  adminLogType = 'All';
  adminLogPage = 1;
  adminLogPageSize = 4;
  adminLogs: AdminLog[] = [
    { id: 1, type: 'Passenger', action: 'Ride booking requested', actor: 'Riya Sharma', target: 'Bengaluru to Mysuru', priority: 'active', icon: 'car-outline', createdAt: 'Today 09:12' },
    { id: 2, type: 'Owner', action: 'Vehicle approved', actor: 'Admin', target: 'Hyundai Verna KA 05 MK 2281', priority: 'active', icon: 'shield-checkmark-outline', createdAt: 'Today 08:30' },
    { id: 3, type: 'Ride', action: 'Ride cancelled by passenger', actor: 'Dev Patel', target: 'Airport transfer', priority: 'warning', icon: 'alert-circle-outline', createdAt: 'Yesterday 18:20' },
    { id: 4, type: 'Security', action: 'Second warning issued', actor: 'Admin', target: 'Owner account', priority: 'blocked', icon: 'lock-closed-outline', createdAt: 'Yesterday 16:05' },
    { id: 5, type: 'Ads', action: 'Banner ad renewed', actor: 'Admin', target: 'Groww commuter offer', priority: 'pending', icon: 'time-outline', createdAt: 'Yesterday 12:40' },
  ];
  adForm = {
    name: 'Weekend route offer',
    type: 'Banner',
    size: '320x100',
    placement: 'Search Page',
    area: 'All India',
    redirectUrl: 'https://example.com/offer',
  };
  adminAds: AdminAd[] = [
    { id: 1, name: 'Groww commuter offer', type: 'Banner', partner: 'Groww Ads', size: '320x100', placement: 'Search Page', area: 'Bengaluru', state: 'Karnataka', startDate: '2026-05-01', endDate: '2026-05-31', impressions: 18420, clicks: 812, ctr: 4.4, status: 'active' },
    { id: 2, name: 'AdMob intercity script', type: 'JavaScript', partner: 'Google AdMob', size: '300x250', placement: 'Dashboard', area: 'All India', state: 'All India', startDate: '2026-04-20', endDate: '2026-05-10', impressions: 22890, clicks: 632, ctr: 2.8, status: 'expired' },
  ];
  adPartners: AdPartner[] = [
    { id: 1, partnerName: 'Groww Ads', companyName: 'Groww Partner Media', contactPerson: 'Neha Shah', mobile: '+91 90000 33333', email: 'ads@groww.example', address: 'Bengaluru, Karnataka', gstNumber: '29ABCDE1234F1Z5', type: 'Paid Partner', priority: 'High', status: 'active', startDate: '2026-05-01', endDate: '2026-11-01' },
    { id: 2, partnerName: 'Google AdMob', companyName: 'Google India', contactPerson: 'Ad Ops', mobile: '+91 90000 44444', email: 'admob@example.com', address: 'Hyderabad, Telangana', gstNumber: '36ABCDE1234F1Z5', type: 'Script Partner', priority: 'Medium', status: 'active', startDate: '2026-04-01', endDate: '2027-04-01' },
  ];
  adInvoices: AdInvoice[] = [
    { invoiceNumber: 'INV-ADS-1001', partnerName: 'Groww Ads', adName: 'Groww commuter offer', placement: 'Search Page', runningDays: 31, baseAmount: 42000, gst: 7560, finalAmount: 49560, paymentStatus: 'Paid', paymentMode: 'UPI', transactionRef: 'TXN-GRW-8821' },
    { invoiceNumber: 'INV-ADS-1002', partnerName: 'Google AdMob', adName: 'AdMob intercity script', placement: 'Dashboard', runningDays: 21, baseAmount: 21000, gst: 3780, finalAmount: 24780, paymentStatus: 'Pending', paymentMode: 'Bank transfer', transactionRef: 'Awaiting' },
  ];
  adminAdHistory: AdHistory[] = [
    { id: 1, adName: 'Groww commuter offer', action: 'Created', details: 'Banner uploaded, redirect URL added, Search Page placement scheduled.', adminUser: 'Admin', createdAt: '2026-05-01 10:00' },
    { id: 2, adName: 'AdMob intercity script', action: 'Script validation', details: 'Script sandboxed and lazy loading enabled.', adminUser: 'Admin', createdAt: '2026-05-02 12:15' },
    { id: 3, adName: 'Groww commuter offer', action: 'Billing generated', details: 'GST and final invoice amount calculated.', adminUser: 'Admin', createdAt: '2026-05-03 09:30' },
  ];
  resultRides: RideSearchResult[] = [
    {
      driver: 'Aarav Mehta',
      photo: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Crect width=%2280%22 height=%2280%22 rx=%2224%22 fill=%22%23001F3F%22/%3E%3Ctext x=%2240%22 y=%2248%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2228%22 font-weight=%22700%22 fill=%22white%22%3EAM%3C/text%3E%3C/svg%3E',
      rating: '4.9',
      departure: '08:30',
      arrival: '11:05',
      route: 'Bengaluru Central to Mysuru Palace Road',
      price: 'INR 420',
      priceValue: 420,
      seats: 3,
      totalSeats: 4,
      bookedSeats: 1,
      status: 'Available',
      instant: true,
      verified: true,
      owner: 'Aarav Mehta',
      vehicle: 'Hyundai Verna',
      vehicleMeta: 'White sedan · KA 05 MK 2281',
      pickup: 'Bengaluru Central Metro Gate 2',
      drop: 'Mysuru Palace Road, North Entrance',
      liveLocation: 'Near Deepanjali Nagar, Mysuru Road',
      liveStatus: 'Driver moving toward pickup',
      lastLocationUpdate: 'Updated just now',
      passengers: ['Riya Sharma'],
      duration: '2h 35m',
      serviceFee: 25,
    },
    {
      driver: 'Nisha Rao',
      photo: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Crect width=%2280%22 height=%2280%22 rx=%2224%22 fill=%22%23123E68%22/%3E%3Ctext x=%2240%22 y=%2248%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2228%22 font-weight=%22700%22 fill=%22white%22%3ENR%3C/text%3E%3C/svg%3E',
      rating: '4.8',
      departure: '10:15',
      arrival: '12:40',
      route: 'Indiranagar Metro to Mandya Bypass',
      price: 'INR 360',
      priceValue: 360,
      seats: 0,
      totalSeats: 3,
      bookedSeats: 3,
      status: 'Full booked',
      instant: true,
      verified: true,
      owner: 'Nisha Rao',
      vehicle: 'Maruti Baleno',
      vehicleMeta: 'Blue hatchback · KA 03 NR 4108',
      pickup: 'Indiranagar Metro, 100 Feet Road',
      drop: 'Mandya Bypass near service road',
      liveLocation: 'Near Domlur Flyover',
      liveStatus: 'Ride is full booked · tracking active for passengers',
      lastLocationUpdate: 'Updated 1 min ago',
      passengers: ['Dev Patel', 'Amina Khan', 'Joel Mathew'],
      duration: '2h 25m',
      serviceFee: 22,
    },
    {
      driver: 'Kabir Singh',
      photo: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Crect width=%2280%22 height=%2280%22 rx=%2224%22 fill=%22%230F766E%22/%3E%3Ctext x=%2240%22 y=%2248%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2228%22 font-weight=%22700%22 fill=%22white%22%3EKS%3C/text%3E%3C/svg%3E',
      rating: '4.7',
      departure: '13:00',
      arrival: '15:35',
      route: 'Whitefield to Mysuru Ring Road',
      price: 'INR 390',
      priceValue: 390,
      seats: 1,
      totalSeats: 4,
      bookedSeats: 3,
      status: 'Available',
      instant: false,
      verified: true,
      owner: 'Kabir Singh',
      vehicle: 'Toyota Glanza',
      vehicleMeta: 'Silver hatchback · KA 04 KS 7781',
      pickup: 'Whitefield Main Road, Forum Shantiniketan',
      drop: 'Mysuru Ring Road, Columbia Asia signal',
      liveLocation: 'Near Whitefield Main Road',
      liveStatus: 'Driver waiting near pickup',
      lastLocationUpdate: 'Updated 2 min ago',
      passengers: ['Meera Iyer', 'Sahil Jain', 'Anu George'],
      duration: '2h 35m',
      serviceFee: 24,
    },
  ];
  selectedRide: RideSearchResult & { trips: number; price: string; priceValue: number } = {
    driver: 'Aarav Mehta',
    photo: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Crect width=%2280%22 height=%2280%22 rx=%2224%22 fill=%22%23001F3F%22/%3E%3Ctext x=%2240%22 y=%2248%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2228%22 font-weight=%22700%22 fill=%22white%22%3EAM%3C/text%3E%3C/svg%3E',
    rating: '4.9',
    trips: 128,
    verified: true,
    vehicle: 'Hyundai Verna',
    vehicleMeta: 'White sedan · KA 05 MK 2281',
    departure: '08:30',
    arrival: '11:05',
    duration: '2h 35m',
    price: 'INR 420',
    priceValue: 420,
    serviceFee: 25,
    seats: 3,
    totalSeats: 4,
    bookedSeats: 1,
    status: 'Available',
    instant: true,
    owner: 'Aarav Mehta',
    pickup: 'Bengaluru Central Metro Gate 2',
    drop: 'Mysuru Palace Road, North Entrance',
    liveLocation: 'Near Deepanjali Nagar, Mysuru Road',
    liveStatus: 'Driver moving toward pickup',
    lastLocationUpdate: 'Updated just now',
    passengers: ['Riya Sharma'],
    route: 'Bengaluru Central to Mysuru Palace Road',
  };
  publishRideForm = {
    vehicleId: 0,
    departure: 'Bengaluru Central',
    destination: 'Mysuru Palace Road',
    departureLat: 12.9716,
    departureLng: 77.5946,
    destinationLat: 12.2958,
    destinationLng: 76.6394,
    allowedPassengers: 3,
    backpackAllowed: true,
    bigTrolleyAllowed: false,
  };
  stops = ['Mandya Bypass'];
  mapEmbedUrl: SafeResourceUrl;
  publishFlowStep = 2;
  rideSetup = {
    pricePerSeat: 420,
    instantBooking: false,
  };
  travelPreferences = {
    smokingAllowed: false,
    petsAllowed: false,
    music: 'Soft music',
    chat: 'Friendly chat',
  };
  musicOptions = ['Quiet ride', 'Soft music', 'Any music'];
  chatOptions = ['Quiet', 'Friendly chat', 'Chatty'];
  showPublishSuccess = false;
  ridePreferences = [
    { label: 'Smoking', value: 'No smoking', allowed: false },
    { label: 'Music', value: 'Soft music ok', allowed: true },
    { label: 'Pets', value: 'Ask first', allowed: false },
    { label: 'Chattiness', value: 'Friendly chat', allowed: true },
  ];

  constructor(
    private readonly http: HttpClient,
    private readonly toastController: ToastController,
    private readonly sanitizer: DomSanitizer,
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly api: RideApiService,
    private readonly realtime: RealtimeService,
  ) {
    this.mapEmbedUrl = this.buildRouteMapUrl(this.selectedRide.pickup, this.selectedRide.drop);
    this.currentRouteValue = this.normalizeRoute(this.router.url);
    this.hydrateReferralState();
    this.applyReferralParamsFromUrl(this.router.url);

    addIcons({
      addCircleOutline,
      addOutline,
      alertCircleOutline,
      arrowBackOutline,
      calendarOutline,
      cameraOutline,
      businessOutline,
      carOutline,
      cardOutline,
      chatbubbleEllipsesOutline,
      checkmarkDoneOutline,
      checkmarkCircleOutline,
      chevronForwardOutline,
      closeCircleOutline,
      cloudUploadOutline,
      createOutline,
      documentAttachOutline,
      documentTextOutline,
      ellipsisVerticalOutline,
      eyeOutline,
      flagOutline,
      funnelOutline,
      gitBranchOutline,
      shareSocialOutline,
      lockClosedOutline,
      locationOutline,
      mapOutline,
      moonOutline,
      notificationsOutline,
      optionsOutline,
      personCircleOutline,
      removeOutline,
      searchOutline,
      settingsOutline,
      shieldCheckmarkOutline,
      starOutline,
      timeOutline,
      trashOutline,
      walletOutline,
    });

    this.clearLegacyLocalAppData();
    this.restoreAuthenticatedSession();
    this.bindRealtimeEvents();
    this.loadProfile();
    this.loadConversations();
    this.loadPayments();
    this.handlePaymentRedirectState();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentRouteValue = this.normalizeRoute(event.urlAfterRedirects);
        this.applyReferralParamsFromUrl(event.urlAfterRedirects);
        if (this.currentRouteValue === '/profile') {
          this.loadProfile();
        }
        if (this.currentRouteValue === '/payments') {
          this.handlePaymentRedirectState();
        }
      });

    setInterval(() => {
      this.liveActivity = `Realtime sync active · ${new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }, 5000);

    this.finishNativeIntro();
  }

  get currentRoute() {
    return this.currentRouteValue;
  }

  private finishNativeIntro() {
    if (!Capacitor.isNativePlatform()) {
      this.showIntroSplash = false;
      return;
    }

    window.setTimeout(() => {
      this.showIntroSplash = false;
    }, 4000);
  }

  private normalizeRoute(url: string) {
    const path = (url || '').split('?')[0].replace(/\/+$/, '') || '/';
    if (path === '/home') return '/publish';
    if (path === '/' || (path === '/login' && this.auth.isAuthenticated)) return this.auth.isAuthenticated ? '/search' : '/login';
    return path;
  }

  private restoreAuthenticatedSession() {
    const user = this.auth.user;
    if (!this.auth.isAuthenticated || !user) {
      this.isLoggedIn = false;
      return;
    }

    this.isLoggedIn = true;
    this.profile = {
      ...this.profile,
      fullName: user.full_name || this.profile.fullName,
      role: user.role || this.profile.role,
      verificationStatus: user.verification_status || this.profile.verificationStatus,
    };
    if (this.calculatedProfileAge) {
      this.profile.age = this.calculatedProfileAge;
    }
    this.ensureReferralCode();
    this.syncReferralRewardsForCurrentUser();
    this.realtime.connect();
    if (this.currentRouteValue === '/login') {
      this.currentRouteValue = '/search';
      this.router.navigateByUrl('/search');
    }
  }

  private clearLegacyLocalAppData() {
    [
      'rideshare.profilePhotoUrl',
      'rideshare.passengerVerification',
      'rideshare.vehicles',
      'rideshare.notifications',
      'rideshare.unreadCount',
      'rideshare.introSplashSeen',
    ].forEach((key) => localStorage.removeItem(key));
  }

  get publishFlowStepFromRoute() {
    if (this.currentRoute === '/publish/preferences') {
      return 3;
    }

    if (this.currentRoute === '/publish/confirm') {
      return 4;
    }

    return 2;
  }

  get activeNav() {
    if (this.currentRoute.startsWith('/publish')) {
      return 'publish';
    }

    if (this.currentRoute === '/your-rides') {
      return 'your-rides';
    }

    if (this.currentRoute === '/inbox' || this.currentRoute === '/chat') {
      return 'inbox';
    }

    if (
      this.currentRoute === '/login' ||
      this.currentRoute === '/profile' ||
      this.currentRoute === '/kyc' ||
      this.currentRoute === '/vehicles' ||
      this.currentRoute === '/referral' ||
      this.currentRoute === '/settings' ||
      this.currentRoute === '/admin' ||
      this.currentRoute === '/payments' ||
      this.currentRoute === '/notifications'
    ) {
      return 'profile';
    }

    return 'search';
  }

  goTo(route: string) {
    this.currentRouteValue = this.normalizeRoute(route);
    if (route === '/profile') {
      this.loadProfile();
    }
    this.router.navigateByUrl(route);
  }

  refreshCurrentScreen(event?: CustomEvent) {
    this.liveActivity = 'Refreshing latest app data...';
    if (this.auth.isAuthenticated && this.auth.token !== 'demo-token') {
      if (['/profile', '/kyc', '/vehicles', '/referral', '/settings', '/payments', '/notifications'].includes(this.currentRoute)) {
        this.loadProfile();
      }
      if (this.currentRoute === '/your-rides') {
        this.loadPublishedRides();
        this.loadOwnerBookingRequests();
      }
      if (this.currentRoute === '/inbox') this.loadConversations();
      if (this.currentRoute === '/chat') this.loadChatHistory();
      if (this.currentRoute === '/payments') this.loadPayments();
      if (this.currentRoute === '/results' || this.currentRoute === '/search') {
        this.searchRides();
      }
    }
    window.setTimeout(() => {
      (event?.target as any)?.complete?.();
      this.liveActivity = 'Refresh complete';
    }, 450);
  }

  get profilePreferenceList() {
    return [
      { label: 'Music', value: this.profile.travelPreferences.music },
      { label: 'Chat', value: this.profile.travelPreferences.chat },
      { label: 'Smoking', value: this.profile.travelPreferences.smoking },
      { label: 'Pets', value: this.profile.travelPreferences.pets },
    ];
  }

  get profileBadges() {
    const badges = ['Phone verified'];
    if (this.profile.verificationStatus === 'verified') badges.unshift('Identity verified');
    if (this.isPassengerVerified) badges.unshift('Passenger verified');
    if (this.profile.email) badges.push('Email verified');
    return badges;
  }

  get isPassengerVerified() {
    return this.profile.passengerVerificationStatus === 'verified';
  }

  get hasVerifiedPublishVehicle() {
    return this.vehicles.some((vehicle) => vehicle.vehicleId && this.isVehicleVerified(vehicle));
  }

  get verifiedPublishVehicles() {
    return this.vehicles.filter((vehicle) => vehicle.vehicleId && this.isVehicleVerified(vehicle));
  }

  get selectedPublishVehicle() {
    return this.vehicles.find((vehicle) => Number(vehicle.vehicleId) === Number(this.publishRideForm.vehicleId)) || null;
  }

  get canPublishRide() {
    return this.profile.verificationStatus === 'verified' && this.hasVerifiedPublishVehicle;
  }

  get canContinuePublishDetails() {
    return Boolean(
      this.selectedPublishVehicle?.vehicleId &&
      this.publishRideForm.departure.trim() &&
      this.publishRideForm.destination.trim() &&
      Number(this.publishRideForm.allowedPassengers) > 0,
    );
  }

  get passengerVerificationLabel() {
    const status = this.profile.passengerVerificationStatus;
    return status === 'verified' ? 'Verified' : status === 'rejected' ? 'Rejected' : 'Pending verification';
  }

  get myVehicleMenuStatus() {
    if (!this.vehicles.length) return 'Not added';
    return this.vehicles.some((vehicle) => this.isVehicleVerified(vehicle)) ? 'Verified' : 'Pending';
  }

  get currentReferralCode() {
    this.ensureReferralCode();
    return this.profile.referralCode;
  }

  get calculatedProfileAge() {
    return this.calculateAgeFromBirthDate(this.profile.birthDate);
  }

  get profileAgeText() {
    return this.calculatedProfileAge ? `${this.calculatedProfileAge} years` : 'Age not added';
  }

  get referralLink() {
    const origin = window.location.origin && window.location.origin !== 'null' ? window.location.origin : 'http://localhost:4200';
    return `${origin}/login?mode=signup&ref=${encodeURIComponent(this.currentReferralCode)}`;
  }

  accountSectionMeta(section: AccountSectionItem) {
    if (section.title === 'Dark mode') {
      return {
        subtitle: this.isDark ? 'Enabled' : 'Disabled',
        statusText: '',
        statusTone: 'pending' as const,
      };
    }
    if (section.title === 'KYC') {
      return {
        subtitle: 'Passenger Gov ID verification',
        statusText: this.isPassengerVerified ? 'Verified' : 'Pending',
        statusTone: this.isPassengerVerified ? 'verified' as const : 'pending' as const,
      };
    }
    if (section.title === 'My Vehicle') {
      return {
        subtitle: this.vehicles.length ? `${this.vehicles.length}/2 vehicle${this.vehicles.length > 1 ? 's' : ''} added` : 'Add and manage your vehicle',
        statusText: this.myVehicleMenuStatus,
        statusTone: this.myVehicleMenuStatus === 'Verified' ? 'verified' as const : 'pending' as const,
      };
    }
    if (section.title === 'Referral') {
      return {
        subtitle: `Invite and earn INR ${this.adminReferralRewardAmount} per successful signup`,
        statusText: this.currentReferralCode,
        statusTone: 'verified' as const,
      };
    }
    return {
      subtitle: section.subtitle || '',
      statusText: section.statusText || '',
      statusTone: section.statusTone || 'pending',
    };
  }

  private hydrateReferralState() {
    const storedAmount = Number(localStorage.getItem(this.referralRewardStorageKey) || 0);
    if (storedAmount > 0) {
      this.adminReferralRewardAmount = storedAmount;
    }
    try {
      const claims = JSON.parse(localStorage.getItem(this.referralClaimsStorageKey) || '[]');
      this.referralClaims = Array.isArray(claims) ? claims : [];
    } catch {
      this.referralClaims = [];
    }
    this.ensureReferralCode();
  }

  private persistReferralClaims() {
    localStorage.setItem(this.referralClaimsStorageKey, JSON.stringify(this.referralClaims));
  }

  private ensureReferralCode() {
    if (this.profile.referralCode) return;
    this.profile.referralCode = this.buildReferralCode(this.profile.fullName, this.profile.phone);
  }

  private buildReferralCode(name: string, phone: string) {
    const initials = String(name || 'RS')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
    const digits = String(phone || '').replace(/\D/g, '').slice(-4).padStart(4, '0');
    return `${initials || 'RS'}${digits}`;
  }

  private applyReferralParamsFromUrl(url: string) {
    if (this.normalizeRoute(url) !== '/login') return;
    const params = new URLSearchParams(window.location.search || '');
    const mode = String(params.get('mode') || '').toLowerCase();
    const ref = this.normalizeReferralCode(params.get('ref') || '');
    if (mode === 'signup' || ref) {
      this.authMode = 'signup';
      this.otpSent = false;
    }
    if (ref) {
      this.loginForm.referralCode = ref;
    }
  }

  private normalizeReferralCode(value: string) {
    return String(value || '').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 12);
  }

  async copyReferralCode() {
    try {
      await navigator.clipboard.writeText(this.currentReferralCode);
      await this.presentToast('Referral code copied');
    } catch {
      await this.presentToast(this.currentReferralCode);
    }
  }

  async copyReferralLink() {
    try {
      await navigator.clipboard.writeText(this.referralLink);
      await this.presentToast('Referral link copied');
    } catch {
      await this.presentToast(this.referralLink);
    }
  }

  async shareReferralLink() {
    const shareData = {
      title: 'Join RideShare',
      text: `Sign up on RideShare with my referral code ${this.currentReferralCode} and earn INR ${this.adminReferralRewardAmount}.`,
      url: this.referralLink,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        await this.presentToast('Referral link shared');
        return;
      }
      await this.copyReferralLink();
    } catch {
      await this.copyReferralLink();
    }
  }

  private calculateAgeFromBirthDate(value: string) {
    if (!value) return null;
    const birthDate = new Date(value);
    if (Number.isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }
    return age >= 0 ? age : null;
  }

  saveAdminReferralSettings() {
    this.adminReferralRewardAmount = Math.max(0, Math.round(Number(this.adminReferralRewardAmount || 0)));
    localStorage.setItem(this.referralRewardStorageKey, String(this.adminReferralRewardAmount));
    this.presentToast(`Referral reward set to INR ${this.adminReferralRewardAmount}`);
  }

  private registerReferralClaim() {
    const code = this.normalizeReferralCode(this.loginForm.referralCode);
    if (this.authMode !== 'signup' || !code) return;
    const phone = String(this.loginForm.phone || '').replace(/\D/g, '').slice(-10);
    if (!phone) return;
    if (code === this.buildReferralCode(this.loginForm.fullName || 'User', phone)) return;
    if (!this.referralClaims.some((claim) => claim.code === code && claim.referredPhone === phone)) {
      this.referralClaims = [
        {
          code,
          referredPhone: phone,
          referredName: this.loginForm.fullName || 'New user',
          reward: this.adminReferralRewardAmount,
          createdAt: new Date().toISOString(),
          creditedToReferrer: false,
          creditedToReferred: false,
        },
        ...this.referralClaims,
      ];
      this.persistReferralClaims();
    }
  }

  private syncReferralRewardsForCurrentUser() {
    const currentPhone = String(this.profile.phone || this.loginForm.phone || '').replace(/\D/g, '').slice(-10);
    const referralCode = this.currentReferralCode;
    let walletDelta = 0;
    let changed = false;
    this.referralClaims = this.referralClaims.map((claim) => {
      let nextClaim = { ...claim };
      if (!nextClaim.creditedToReferred && currentPhone && nextClaim.referredPhone === currentPhone) {
        walletDelta += nextClaim.reward;
        this.prependWalletTransaction('Referral bonus received', nextClaim.reward, 'Paid', nextClaim.createdAt);
        nextClaim.creditedToReferred = true;
        changed = true;
      }
      if (!nextClaim.creditedToReferrer && referralCode && nextClaim.code === referralCode) {
        walletDelta += nextClaim.reward;
        this.prependWalletTransaction('Referral bonus earned', nextClaim.reward, 'Paid', nextClaim.createdAt);
        nextClaim.creditedToReferrer = true;
        changed = true;
      }
      return nextClaim;
    });
    if (walletDelta) {
      this.walletBalance += walletDelta;
    }
    if (changed) {
      this.persistReferralClaims();
    }
  }

  get adminKpis() {
    const users = [...this.adminOwners, ...this.adminPassengers];
    return [
      { label: 'Owners', value: this.adminOwners.length, tone: 'ink' },
      { label: 'Passengers', value: this.adminPassengers.length, tone: 'blue' },
      { label: 'Pending verify', value: users.filter((user) => user.verification === 'pending').length + this.adminVehicleCases.filter((item) => item.status === 'pending').length, tone: 'warn' },
      { label: 'Wallet float', value: `INR ${users.reduce((sum, user) => sum + user.balance, 0).toLocaleString('en-IN')}`, tone: 'success' },
    ];
  }

  get pendingIdVerifications() {
    return [...this.adminOwners, ...this.adminPassengers].filter((user) => user.verification === 'pending');
  }

  get adminPendingVehicleCount() {
    return this.adminVehicleCases.filter((item) => item.status === 'pending').length;
  }

  get adminWarningsCount() {
    return [...this.adminOwners, ...this.adminPassengers].reduce((sum, user) => sum + user.warningCount, 0);
  }

  get adminPassengerTourCount() {
    return this.adminTours.filter((tour) => tour.type === 'Passenger tour').length;
  }

  get adminVehicleTourCount() {
    return this.adminTours.filter((tour) => tour.type === 'Vehicle tour').length;
  }

  get profileInitials() {
    return this.profile.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'RS';
  }

  vehicleStatus(vehicle: Partial<ProfileVehicle>) {
    return String(vehicle.status || 'pending');
  }

  isVehicleVerified(vehicle: Partial<ProfileVehicle>) {
    return this.vehicleStatus(vehicle).toLowerCase() === 'verified';
  }

  vehicleDisplayStatus(vehicle: Partial<ProfileVehicle>) {
    return this.normalizedVehicleStatus(vehicle);
  }

  loadProfile() {
    if (!this.auth.isAuthenticated || this.auth.token === 'demo-token') {
      return;
    }

    this.profileLoading = true;
    this.http
      .get<{
        user: any;
        vehicles: any[];
        reviews: ProfileReview[];
        stats: ProfileStats;
      }>(`${this.apiUrl}/users/me`)
      .subscribe({
        next: ({ user, vehicles, reviews, stats }) => {
          this.profileLoading = false;
          this.profile = {
            ...this.profile,
            fullName: user.full_name || this.profile.fullName,
            birthDate: user.birth_date || this.profile.birthDate,
            age: this.calculateAgeFromBirthDate(user.birth_date || this.profile.birthDate) || Number(user.age || this.profile.age),
            rating: Number(user.rating || this.profile.rating),
            role: user.role || this.profile.role,
            verificationStatus: user.verification_status || this.profile.verificationStatus,
            phone: user.phone || this.profile.phone,
            email: user.email || this.profile.email,
            address: user.address || this.profile.address,
            city: user.city || this.profile.city,
            state: user.state || this.profile.state,
            pincode: user.pincode || this.profile.pincode,
            gender: user.gender || this.profile.gender,
            emergencyContactName: user.emergency_contact_name || this.profile.emergencyContactName,
            emergencyContactPhone: user.emergency_contact_phone || this.profile.emergencyContactPhone,
            photoUrl: user.photo_url || this.profile.photoUrl,
            bio: user.bio || this.profile.bio,
            referralCode: user.referral_code || this.profile.referralCode || this.buildReferralCode(user.full_name || this.profile.fullName, user.phone || this.profile.phone),
            memberSince: user.created_at ? new Date(user.created_at).getFullYear().toString() : this.profile.memberSince,
            govIdNumber: user.gov_id_number || this.profile.govIdNumber,
            govIdFrontUrl: user.gov_id_front_url || this.profile.govIdFrontUrl,
            govIdBackUrl: user.gov_id_back_url || this.profile.govIdBackUrl,
            passengerVerificationStatus: user.passenger_verification_status || this.profile.passengerVerificationStatus,
            stats: stats || this.profile.stats,
            travelPreferences: {
              ...this.profile.travelPreferences,
              ...(user.travel_preferences || {}),
            },
            reviews: reviews?.length ? reviews : this.profile.reviews,
          };
          this.vehicles = vehicles?.length
            ? vehicles.map((vehicle) => ({
                make: vehicle.make,
                model: vehicle.model,
                color: vehicle.color || 'Not set',
                vehicleId: vehicle.vehicle_id || vehicle.vehicleId,
                plateNumber: vehicle.plate_number || vehicle.plateNumber,
                seats: Number(vehicle.seats || 4),
                status: vehicle.status || 'pending',
                rcDocumentUrl: vehicle.rc_document_url || vehicle.rcDocumentUrl,
                insuranceDocumentUrl: vehicle.insurance_document_url || vehicle.insuranceDocumentUrl,
                frontPhotoUrl: vehicle.front_photo_url || vehicle.frontPhotoUrl,
                backPhotoUrl: vehicle.back_photo_url || vehicle.backPhotoUrl,
              }))
            : [];
          this.ensurePublishVehicleSelection();
          this.loadPublishedRides();
          this.loadOwnerBookingRequests();
          this.syncReferralRewardsForCurrentUser();
        },
        error: () => {
          this.profileLoading = false;
        },
      });
  }

  loadConversations() {
    if (!this.auth.isAuthenticated || this.auth.token === 'demo-token') return;
    this.api.getConversations().subscribe({
      next: (response: any) => {
        const data = Array.isArray(response.data) ? response.data : [];
        if (!data.length) return;
        this.conversations = data.map((conversation: any) => {
          const otherUser = conversation.other_user || {};
          const latest = conversation.latest_message || {};
          return {
            rideId: conversation.ride_id,
            receiverId: conversation.other_user_id,
            name: otherUser.full_name || 'Ride contact',
            image: otherUser.photo_url || this.avatarForName(otherUser.full_name || 'Ride contact'),
            trip: `Ride #${conversation.ride_id}`,
            last: latest.message || 'No messages yet',
            time: latest.created_at ? new Date(latest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            unread: Number(conversation.unread_count || 0),
            seen: Number(conversation.unread_count || 0) === 0,
          };
        });
      },
      error: () => undefined,
    });
  }

  loadPayments() {
    if (!this.auth.isAuthenticated || this.auth.token === 'demo-token') return;
    this.api.getPayments().subscribe({
      next: (response: any) => {
        if (response.walletBalance !== undefined) this.walletBalance = Number(response.walletBalance || 0);
        const data = Array.isArray(response.data) ? response.data : [];
        if (data.length) {
          this.transactions = data.map((payment: any) => ({
            title: payment.provider === 'razorpay' ? 'Razorpay wallet top-up' : 'Wallet transaction',
            status: this.formatPaymentStatus(payment.status),
            amountValue: Number(payment.amount || 0),
            amountLabel: `${String(payment.status || '').toLowerCase() === 'paid' ? '+ ' : ''}INR ${Number(payment.amount || 0)}`,
            timestamp: this.formatPaymentTimestamp(payment.updated_at || payment.created_at),
            transactionId: this.buildPaymentTransactionId(payment),
          }));
        }
        this.syncReferralRewardsForCurrentUser();
      },
      error: () => undefined,
    });
  }

  private ensurePublishVehicleSelection() {
    if (this.selectedPublishVehicle?.vehicleId) return;
    const firstVerifiedVehicle = this.verifiedPublishVehicles[0];
    if (firstVerifiedVehicle?.vehicleId) {
      this.publishRideForm.vehicleId = Number(firstVerifiedVehicle.vehicleId);
    }
  }

  private loadPublishedRides() {
    if (!this.auth.isAuthenticated || this.auth.token === 'demo-token') return;
    this.api.getRides({ scope: 'owner' }).subscribe({
      next: (response: any) => {
        const rides = Array.isArray(response.data) ? response.data : [];
        if (!rides.length) return;
        const mappedPublishedRides: ManagedRideItem[] = rides.map((ride: any) => {
          const vehicle = this.vehicles.find((item) => Number(item.vehicleId) === Number(ride.vehicle_id));
          const departureDate = ride.departure_at ? new Date(ride.departure_at) : null;
          return {
            id: ride.ride_id,
            tab: 'My Published Rides',
            driver: this.profile.fullName,
            image: this.currentUserAvatar,
            route: `${ride.origin} to ${ride.destination}`,
            date: departureDate ? departureDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today',
            time: departureDate ? departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '08:30 AM',
            price: `INR ${Number(ride.price_per_seat || this.rideSetup.pricePerSeat)}`,
            status: String(ride.status || 'published').replace(/^./, (value: string) => value.toUpperCase()),
            vehicle: vehicle ? `${vehicle.make} ${vehicle.model}` : 'Verified vehicle',
            seatsAvailable: Number(ride.seats_available ?? 0),
            totalSeats: Number(ride.total_seats ?? 0),
            bookingRequests: [],
          };
        });
        this.managedRides = [
          ...mappedPublishedRides,
          ...this.managedRides.filter((ride) => ride.tab !== 'My Published Rides'),
        ];
      },
      error: () => undefined,
    });
  }

  private loadOwnerBookingRequests() {
    if (!this.auth.isAuthenticated || this.auth.token === 'demo-token') return;
    this.api.getBookings({ scope: 'owner' }).subscribe({
      next: (response: any) => {
        const bookings = Array.isArray(response.data) ? response.data : [];
        const bookingMap = new Map<number, BookingRequestDetails[]>();
        bookings.forEach((booking: any) => {
          const ride = booking.ride || {};
          const vehicle = booking.vehicle || {};
          const passenger = booking.passenger || {};
          const details: BookingRequestDetails = {
            bookingId: booking.booking_id,
            rideId: booking.ride_id,
            passengerId: passenger.user_id,
            passengerName: passenger.full_name || 'Passenger',
            passengerPhoto: passenger.photo_url || this.avatarForName(passenger.full_name || 'Passenger'),
            passengerPhone: passenger.phone || '',
            passengerEmail: passenger.email || '',
            passengerGovIdNumber: passenger.gov_id_number || 'Not shared',
            verified: passenger.verification_status === 'verified',
            seatsBooked: Number(booking.seats_booked || 1),
            status: booking.status || 'requested',
            from: ride.pickup_point || ride.origin || '',
            to: ride.drop_point || ride.destination || '',
            route: `${ride.origin || ''} to ${ride.destination || ''}`.trim(),
            vehicle: `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Vehicle not found',
            pickup: ride.pickup_point || ride.origin || '',
            drop: ride.drop_point || ride.destination || '',
          };
          const rideId = Number(booking.ride_id || 0);
          if (!bookingMap.has(rideId)) bookingMap.set(rideId, []);
          bookingMap.get(rideId)?.push(details);
        });

        this.managedRides = this.managedRides.map((ride) => ({
          ...ride,
          bookingRequests: bookingMap.get(Number(ride.id || 0)) || [],
        }));
      },
      error: () => undefined,
    });
  }

  private formatPaymentStatus(status: string) {
    const normalized = String(status || '').trim().toLowerCase();
    if (!normalized) return 'Pending';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  private formatPaymentTimestamp(value: string) {
    if (!value) return 'Now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Now';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  private buildPaymentTransactionId(payment: any) {
    const rawDate = payment.updated_at || payment.created_at;
    const date = rawDate ? new Date(rawDate) : new Date();
    const millis = Number.isNaN(date.getTime()) ? Date.now() : date.getTime();
    const timestampPart = String(millis).slice(-8);
    const idPart = String(payment.payment_id || payment.id || 0)
      .replace(/\D/g, '')
      .slice(-2)
      .padStart(2, '0');
    return `${timestampPart}${idPart}`;
  }

  private buildTimestampTransactionId(value: string) {
    const date = new Date(value);
    const millis = Number.isNaN(date.getTime()) ? Date.now() : date.getTime();
    return String(millis).slice(-10);
  }

  private prependWalletTransaction(title: string, amount: number, status: string, timestampSource = new Date().toISOString()) {
    const transactionId = this.buildTimestampTransactionId(timestampSource);
    if (this.transactions.some((transaction) => transaction.transactionId === transactionId && transaction.title === title)) {
      return;
    }
    this.transactions = [
      {
        title,
        amountValue: amount,
        amountLabel: `${amount > 0 ? '+ ' : ''}INR ${Math.abs(amount)}`,
        status,
        transactionId,
        timestamp: this.formatPaymentTimestamp(timestampSource),
      },
      ...this.transactions,
    ];
  }

  private handlePaymentRedirectState() {
    if (this.normalizeRoute(this.router.url) !== '/payments') return;
    const params = new URLSearchParams(window.location.search || '');
    const paymentStatus = params.get('paymentStatus');
    const paymentId = params.get('paymentId');
    if (!paymentStatus) return;

    const redirectKey = `${paymentStatus}:${paymentId || ''}:${window.location.search}`;
    if (this.lastHandledPaymentRedirect === redirectKey) return;
    this.lastHandledPaymentRedirect = redirectKey;

    if (paymentStatus === 'pending' && paymentId) {
      this.walletProcessing = true;
      this.appLoading = true;
      this.api.reconcilePayment(Number(paymentId), { status: 'pending' }).subscribe({
        next: (response: any) => {
          this.walletProcessing = false;
          this.appLoading = false;
          if (response.walletBalance !== undefined) this.walletBalance = Number(response.walletBalance || 0);
          this.loadPayments();
          const finalStatus = String(response.finalStatus || response.payment?.status || 'pending').toLowerCase();
          if (finalStatus === 'paid') {
            this.presentToast('Payment successful. Wallet updated.');
          } else if (finalStatus === 'failed') {
            this.presentToast('Payment failed. Wallet not updated.');
          } else if (finalStatus === 'cancelled') {
            this.presentToast('Payment cancelled. Wallet not updated.');
          } else {
            this.presentToast('Payment is pending. Wallet will update after Razorpay confirms it.');
          }
          this.router.navigateByUrl('/payments', { replaceUrl: true });
        },
        error: (error) => {
          this.walletProcessing = false;
          this.appLoading = false;
          this.loadPayments();
          this.presentToast(error?.error?.error || 'Unable to check Razorpay payment status');
          this.router.navigateByUrl('/payments', { replaceUrl: true });
        },
      });
      return;
    }

    this.walletProcessing = false;
    this.appLoading = false;
    this.loadPayments();

    if (paymentStatus === 'success') {
      this.presentToast('Payment successful. Wallet updated.');
    } else if (paymentStatus === 'cancelled') {
      this.presentToast('Payment cancelled. Wallet not updated.');
    } else if (paymentStatus === 'failed') {
      this.presentToast('Payment failed. Wallet not updated.');
    } else {
      this.presentToast(`Payment status: ${this.formatPaymentStatus(paymentStatus)}`);
    }

    this.router.navigateByUrl('/payments', { replaceUrl: true });
  }

  saveProfile(options: { silent?: boolean } = {}) {
    if (!this.auth.isAuthenticated || this.auth.token === 'demo-token') {
      if (!options.silent) this.presentToast('Profile photo updated');
      return;
    }

    this.profileSaving = true;
    this.http
      .patch(`${this.apiUrl}/users/me`, {
        full_name: this.profile.fullName,
        age: this.calculatedProfileAge || this.profile.age,
        birth_date: this.profile.birthDate,
        email: this.profile.email,
        address: this.profile.address,
        city: this.profile.city,
        state: this.profile.state,
        pincode: this.profile.pincode,
        gender: this.profile.gender,
        emergency_contact_name: this.profile.emergencyContactName,
        emergency_contact_phone: this.profile.emergencyContactPhone,
        bio: this.profile.bio,
        photo_url: this.profile.photoUrl,
        gov_id_number: this.profile.govIdNumber,
        gov_id_front_url: this.profile.govIdFrontUrl,
        gov_id_back_url: this.profile.govIdBackUrl,
        passenger_verification_status: this.profile.passengerVerificationStatus,
        travel_preferences: this.profile.travelPreferences,
      })
      .subscribe({
        next: () => {
          this.profileSaving = false;
          this.personalDetailsEditing = false;
          if (!options.silent) this.presentToast('Profile saved');
          this.loadProfile();
        },
        error: (error) => {
          this.profileSaving = false;
          this.presentToast(error?.error?.error || 'Profile save failed');
        },
      });
  }

  editPersonalDetails() {
    this.personalDetailsEditing = true;
  }

  cancelPersonalDetailsEdit() {
    this.personalDetailsEditing = false;
    this.loadProfile();
  }

  updateProfilePhoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.profile.photoUrl = String(reader.result || this.profile.photoUrl);
      this.saveProfile({ silent: true });
      this.presentToast('Profile photo updated');
    };
    reader.readAsDataURL(file);
  }

  updateGovIdPhoto(event: Event, side: 'front' | 'back') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      input.value = '';
      this.presentToast('Only image files are allowed for Gov ID proof');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = String(reader.result || '');
      if (side === 'front') {
        this.profile.govIdFrontUrl = imageUrl;
      } else {
        this.profile.govIdBackUrl = imageUrl;
      }
      this.profile.passengerVerificationStatus = 'pending';
      this.saveProfile({ silent: true });
    };
    reader.readAsDataURL(file);
  }

  submitPassengerVerification() {
    const idNumber = this.profile.govIdNumber.trim();
    if (!idNumber || !this.profile.govIdFrontUrl || !this.profile.govIdBackUrl) {
      this.presentToast('Upload Gov ID front, back photo, and ID number');
      return;
    }

    this.profile.passengerVerificationStatus = 'verified';
    this.notificationCenter = [
      {
        type: 'Passenger verification',
        title: 'Passenger verified',
        message: 'Your Gov ID proof is verified. You can now confirm seats.',
        time: 'Now',
        unread: true,
        icon: 'shield-checkmark-outline',
      },
      ...this.notificationCenter,
    ];
    this.unreadCount += 1;
    this.saveRealtimeState();
    this.saveProfile();
    this.presentToast('Passenger verification completed');
  }

  get currentUserAvatar(): string {
    return this.profile.photoUrl || this.avatarForName(this.profile.fullName);
  }

  avatarForName(name: string): string {
    if (name === this.profile.fullName && this.profile.photoUrl) {
      return this.currentUserAvatar;
    }

    const initials = String(name || 'User')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'U';
    const colors = ['#001F3F', '#123E68', '#0F766E', '#5B5F97', '#334155'];
    const color = colors[Math.abs(this.hashText(name)) % colors.length];
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="40" fill="${color}"/><text x="40" y="48" text-anchor="middle" font-family="Arial" font-size="26" font-weight="700" fill="white">${initials}</text></svg>`,
    )}`;
  }

  chatAvatar(sender: 'driver' | 'me'): string {
    return sender === 'me' ? this.currentUserAvatar : this.selectedRide.photo;
  }

  get driverPublicProfile() {
    const isCurrentProfile = this.selectedRide.driver === this.profile.fullName;
    const joinedYear = isCurrentProfile ? Number(this.profile.memberSince) || 2026 : this.driverJoinedYear(this.selectedRide.driver);
    const yearsOnRide = Math.max(1, new Date().getFullYear() - joinedYear + 1);
    const preferences = this.profile.travelPreferences;

    return {
      name: this.selectedRide.driver,
      photo: this.selectedRide.photo,
      rating: this.selectedRide.rating,
      trips: this.selectedRide.trips,
      bio: isCurrentProfile
        ? this.profile.bio
        : `${this.selectedRide.driver} is a verified ride owner with punctual pickup, clean car standards, and safe intercity driving.`,
      phone: isCurrentProfile ? this.profile.phone : '+91 98xx xxx xxx',
      email: isCurrentProfile ? this.profile.email : 'Contact through chat',
      verification: this.selectedRide.verified ? 'ID and phone verified' : 'Verification pending',
      vehicle: this.selectedRide.vehicle,
      vehicleMeta: this.selectedRide.vehicleMeta,
      joinedYear,
      yearsOnRide: `${yearsOnRide} ${yearsOnRide === 1 ? 'year' : 'years'} on rides`,
      moods: [preferences.music, preferences.chat, preferences.smoking, preferences.pets],
    };
  }

  get confirmedPassengerProfiles(): PassengerPublicProfile[] {
    return this.selectedRide.passengers.map((passenger) => this.passengerPublicProfile(passenger));
  }

  passengerPublicProfile(name: string): PassengerPublicProfile {
    const hash = Math.abs(this.hashText(name));
    const pickups = [
      this.selectedRide.pickup,
      'Near main gate',
      'Metro station pickup',
      'Office pickup point',
      'High street junction',
    ];
    const moodSets = [
      ['Quiet ride', 'Light luggage'],
      ['Friendly chat', 'Music okay'],
      ['Work commute', 'On time'],
      ['Verified rider', 'Window seat'],
      ['Minimal calls', 'Easy pickup'],
    ];

    return {
      name,
      photo: this.avatarForName(name),
      pickup: name === this.profile.fullName ? this.selectedRide.pickup : pickups[hash % pickups.length],
      rating: (4.5 + (hash % 5) / 10).toFixed(1),
      moods: moodSets[hash % moodSets.length],
      verified: true,
    };
  }

  private driverJoinedYear(driver: string): number {
    const joinedYears: Record<string, number> = {
      'Aarav Mehta': 2023,
      'Nisha Rao': 2022,
      'Kabir Singh': 2024,
    };

    return joinedYears[driver] || 2024;
  }

  private hashText(value: string): number {
    return String(value || '')
      .split('')
      .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) | 0, 0);
  }

  onLoginPhoneInput(value: string) {
    this.loginForm.phone = String(value || '').replace(/\D/g, '').slice(0, 10);
    this.otpSent = false;
    this.loginForm.otp = '';
    this.stopOtpResendTimer();
  }

  onLoginOtpInput(value: string) {
    this.loginForm.otp = String(value || '').replace(/\D/g, '').slice(0, 6);
  }

  get authPhoneDisplay() {
    const phone = this.loginForm.phone || '';
    return phone ? `+91 ${phone}` : '+91';
  }

  private isLoginPhoneValid() {
    return /^\d{10}$/.test(this.loginForm.phone);
  }

  private isSignupEmailValid() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(this.loginForm.email || '').trim());
  }

  private getApiErrorMessage(error: any, fallback: string) {
    if (error?.status === 0) {
      return `Cannot reach API ${this.apiUrl}. Check mobile internet and reinstall the latest APK.`;
    }

    return error?.error?.error || error?.error?.message || error?.message || fallback;
  }

  sendLoginOtp() {
    if (this.otpResendSeconds > 0) {
      this.presentToast(`Resend OTP in ${this.otpResendSeconds}s`);
      return;
    }

    if (!this.isLoginPhoneValid()) {
      this.presentToast('Enter 10 digit numeric mobile number');
      return;
    }

    if (this.authMode === 'signup' && !this.isSignupEmailValid()) {
      this.presentToast('Enter valid email for notifications');
      return;
    }

    this.otpSending = true;
    this.liveActivity = 'Sending WhatsApp OTP...';
    this.auth.sendOtp(this.loginForm.phone, this.authMode === 'signup' ? this.loginForm.email : undefined).subscribe({
      next: (response) => {
        this.otpSent = true;
        this.otpSending = false;
        this.scrollAuthToTop();
        this.startOtpResendTimer();
        if (response.testOtp) {
          this.loginForm.otp = response.testOtp;
          this.liveActivity = `Testing OTP: ${response.testOtp}`;
          this.presentToast(`Testing OTP: ${response.testOtp}`);
          return;
        }
        this.liveActivity = 'WhatsApp OTP sent. Check your phone.';
        this.presentToast('WhatsApp OTP sent');
      },
      error: (error) => {
        this.otpSending = false;
        this.liveActivity = this.getApiErrorMessage(error, 'WhatsApp OTP failed');
        this.presentToast(this.liveActivity);
      },
    });
  }

  showSignupForm() {
    this.authMode = 'signup';
    this.otpSent = false;
    this.loginForm.otp = '';
    this.stopOtpResendTimer();
    this.scrollAuthToTop();
  }

  showLoginForm() {
    this.authMode = 'login';
    this.otpSent = false;
    this.loginForm.otp = '';
    this.stopOtpResendTimer();
    this.scrollAuthToTop();
  }

  backAuthStep() {
    if (this.otpSent) {
      this.otpSent = false;
      this.loginForm.otp = '';
      this.stopOtpResendTimer();
      this.scrollAuthToTop();
      return;
    }

    this.showLoginForm();
  }

  private scrollAuthToTop() {
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  private startOtpResendTimer() {
    this.stopOtpResendTimer();
    this.otpResendSeconds = 45;
    this.otpResendTimer = window.setInterval(() => {
      this.otpResendSeconds = Math.max(0, this.otpResendSeconds - 1);
      if (this.otpResendSeconds === 0) {
        this.stopOtpResendTimer();
      }
    }, 1000);
  }

  private stopOtpResendTimer() {
    if (this.otpResendTimer) {
      window.clearInterval(this.otpResendTimer);
      this.otpResendTimer = undefined;
    }
    this.otpResendSeconds = 0;
  }

  login() {
    if (!this.isLoginPhoneValid()) {
      this.presentToast('Enter 10 digit numeric mobile number');
      return;
    }

    if (this.loginForm.otp.length < 4) {
      this.presentToast('Enter OTP received on WhatsApp');
      return;
    }

    if (this.authMode === 'signup' && !this.isSignupEmailValid()) {
      this.presentToast('Enter valid email for notifications');
      return;
    }

    this.loginSubmitting = true;
    this.liveActivity = 'Verifying OTP...';
    this.auth.login(
      this.loginForm.phone,
      this.loginForm.otp,
      this.loginForm.role,
      this.authMode === 'signup' ? this.loginForm.fullName : undefined,
      this.authMode === 'signup' ? this.loginForm.email : undefined,
      this.authMode,
      this.authMode === 'signup' ? this.normalizeReferralCode(this.loginForm.referralCode) : undefined,
    ).subscribe({
      next: () => {
        this.loginSubmitting = false;
        this.isLoggedIn = true;
        this.profile.phone = `+91${this.loginForm.phone}`;
        this.registerReferralClaim();
        this.restoreAuthenticatedSession();
        this.stopOtpResendTimer();
        this.liveActivity = 'WhatsApp OTP verified · realtime session started';
        this.realtime.connect();
        this.presentToast(this.authMode === 'signup' ? 'Signup successful' : 'Login successful');
        this.goTo('/search');
      },
      error: (error) => {
        this.loginSubmitting = false;
        this.liveActivity = this.getApiErrorMessage(error, 'OTP verification failed');
        this.presentToast(this.liveActivity);
      },
    });
  }

  logout() {
    this.isLoggedIn = false;
    this.realtime.disconnect();
    this.presentToast('Logged out');
    this.auth.logout();
  }

  goBackToSearch() {
    this.goTo('/search');
  }

  toggleFilter(filter: { key: string; label: string; active: boolean }) {
    filter.active = !filter.active;
  }

  toggleFilterDropdown() {
    this.filterDropdownOpen = !this.filterDropdownOpen;
  }

  viewRide(ride: RideSearchResult) {
    this.rideDetailsBackRoute = '/results';
    this.selectedRideMode = 'active';
    this.selectedRide = {
      ...ride,
      trips: ride.driver === 'Aarav Mehta' ? 128 : ride.driver === 'Nisha Rao' ? 96 : 74,
    };
    this.mapEmbedUrl = this.buildRouteMapUrl(ride.pickup, ride.drop);
    this.presentToast(`Opening ${ride.driver}'s ride`);
    this.goTo('/ride-details');
  }

  viewManagedRide(ride: (typeof this.managedRides)[number]) {
    const matchedRide =
      this.resultRides.find((result) => result.driver === ride.driver) ||
      this.resultRides.find((result) => {
        const [from, to] = ride.route.split(' to ').map((part) => part.toLowerCase());
        return result.route.toLowerCase().includes(from || '') || result.route.toLowerCase().includes(to || '');
      });

    const detailRide = matchedRide || this.selectedRide;
    const confirmedPassengers = detailRide.passengers.length
      ? detailRide.passengers
      : [this.profile.fullName, 'Riya Sharma'];

    this.rideDetailsBackRoute = '/your-rides';
    this.selectedRideMode = ride.tab === 'Past' ? 'past' : 'active';
    this.selectedRide = {
      ...detailRide,
      driver: ride.driver,
      owner: ride.driver,
      photo: ride.image,
      route: matchedRide?.route || ride.route,
      price: ride.price,
      priceValue: Number(String(ride.price).replace(/\D/g, '')) || detailRide.priceValue,
      status: detailRide.status,
      passengers: confirmedPassengers,
      bookedSeats: Math.max(detailRide.bookedSeats, confirmedPassengers.length),
      seats: Math.max(0, detailRide.totalSeats - Math.max(detailRide.bookedSeats, confirmedPassengers.length)),
      trips: ride.driver === 'Aarav Mehta' ? 128 : ride.driver === 'Nisha Rao' ? 96 : 74,
    };
    this.mapEmbedUrl = this.buildRouteMapUrl(this.selectedRide.pickup, this.selectedRide.drop);
    this.presentToast(`Opening ${ride.driver}'s ride details`);
    this.goTo('/ride-details');
  }

  bookSeat(ride: RideSearchResult) {
    if (!this.isPassengerVerified) {
      this.presentToast('Complete passenger Gov ID verification before booking');
      this.goTo('/profile');
      return;
    }

    if (ride.seats < 1) {
      this.viewRide(ride);
      this.presentToast('This ride is full booked. You can view details only.');
      return;
    }

    this.api.bookRide({ rideId: ride.id || 1, seats: 1 }).subscribe({
      next: (response: any) => {
        this.viewRide(ride);
        const bookingStatus = String(response?.booking?.status || 'requested').toLowerCase();
        if (bookingStatus === 'confirmed') {
          this.addCurrentPassengerToSelectedRide();
          this.presentToast(`Booking confirmed with ${ride.driver}`);
        } else {
          this.presentToast(`Seat request sent to ${ride.driver}`);
        }
        this.loadOwnerBookingRequests();
      },
      error: (error) => {
        this.presentToast(error.error?.error || `Unable to send seat request to ${ride.driver}`);
      },
    });
  }

  messageDriver() {
    if (!this.selectedRide.id) {
      this.presentToast('Chat becomes available after a booking request is sent');
      return;
    }
    this.presentToast(`Opening chat with ${this.selectedRide.driver}`);
    this.goTo('/chat');
    this.loadChatHistory();
  }

  openConversation(conversation: any) {
    this.selectedRide = {
      ...this.selectedRide,
      id: conversation.rideId || this.selectedRide.id || 1,
      driverId: conversation.receiverId || this.selectedRide.driverId || 2,
      driver: conversation.name || this.selectedRide.driver,
      owner: conversation.name || this.selectedRide.owner,
      photo: conversation.image || this.selectedRide.photo,
    };
    conversation.unread = 0;
    conversation.seen = true;
    this.goTo('/chat');
    this.loadChatHistory();
  }

  loadChatHistory() {
    if (!this.auth.isAuthenticated || this.auth.token === 'demo-token') return;
    this.chatLoading = true;
    this.api.getMessages(this.selectedRide.id || 1).subscribe({
      next: (response: any) => {
        this.chatLoading = false;
        const currentUserId = this.auth.user?.user_id;
        const messages = Array.isArray(response.data) ? response.data : [];
        this.chats = messages.map((message: any) => ({
          id: message.message_id,
          from: message.sender_id === currentUserId ? 'me' : 'driver',
          text: message.message,
          time: message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          attachment: message.attachment_url ? 'Attachment' : undefined,
          attachmentType: message.attachment_url?.startsWith('data:image/') ? 'image' : undefined,
          previewUrl: message.attachment_url?.startsWith('data:image/') ? message.attachment_url : undefined,
        }));
        messages
          .filter((message: any) => message.receiver_id === currentUserId && !message.is_seen)
          .forEach((message: any) => this.api.markMessageSeen(message.message_id).subscribe({ error: () => undefined }));
      },
      error: () => {
        this.chatLoading = false;
      },
    });
  }

  attachChatFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.attachedFileName = file.name;
    this.attachedFileType = file.type.startsWith('image/') ? 'image' : 'file';
    this.attachedPreviewUrl = '';

    if (this.attachedFileType === 'image') {
      const reader = new FileReader();
      reader.onload = () => {
        this.attachedPreviewUrl = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    }

    this.presentToast(`${file.name} attached`);
  }

  clearChatAttachment() {
    this.attachedFileName = '';
    this.attachedPreviewUrl = '';
    this.attachedFileType = 'file';
  }

  sendChatMessage() {
    const text = this.chatDraft.trim();
    if (!text && !this.attachedFileName) {
      this.presentToast('Type a message or attach a file');
      return;
    }

    const messageText = text || `Shared file: ${this.attachedFileName}`;
    const sentMessage = {
      id: Date.now(),
      from: 'me' as const,
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: this.attachedFileName || undefined,
      attachmentType: this.attachedFileName ? this.attachedFileType : undefined,
      previewUrl: this.attachedPreviewUrl || undefined,
    };

    this.chats = [...this.chats, sentMessage];
    this.chatDraft = '';
    this.clearTypingState();
    this.clearChatAttachment();
    this.liveActivity = 'Message sent · realtime sync pending';

    const currentUserId = this.auth.user?.user_id || 1;
    const receiverId = this.selectedRide.driverId && this.selectedRide.driverId !== currentUserId ? this.selectedRide.driverId : 2;
    this.api
      .sendMessage({
        rideId: this.selectedRide.id || 1,
        receiverId,
        message: sentMessage.text,
        attachmentUrl: sentMessage.attachment ? `local://${sentMessage.attachment}` : undefined,
      })
      .subscribe({
        next: () => {
          this.liveActivity = 'Message delivered - realtime event sent';
          this.loadConversations();
        },
        error: () => {
          this.liveActivity = 'Message saved locally · backend not connected';
        },
      });
  }

  onChatDraftChange(value: string) {
    this.chatDraft = value;
    this.isTyping = Boolean(value.trim());
    if (this.typingTimer) window.clearTimeout(this.typingTimer);
    this.typingTimer = window.setTimeout(() => this.clearTypingState(), 1500);
    const currentUserId = this.auth.user?.user_id || 1;
    const receiverId = this.selectedRide.driverId && this.selectedRide.driverId !== currentUserId ? this.selectedRide.driverId : 2;
    if (this.auth.isAuthenticated && this.auth.token !== 'demo-token') {
      this.api
        .sendTyping({ rideId: this.selectedRide.id || 1, receiverId, isTyping: Boolean(value.trim()) })
        .subscribe({ error: () => undefined });
    }
  }

  private clearTypingState() {
    this.isTyping = false;
    if (this.typingTimer) {
      window.clearTimeout(this.typingTimer);
      this.typingTimer = undefined;
    }
  }

  setWalletTopUpAmount(amount: number) {
    this.walletTopUpAmount = amount;
  }

  openWithdrawDialog() {
    if (!this.auth.isAuthenticated || this.auth.token === 'demo-token') {
      this.presentToast('Login is required for wallet withdrawal');
      return;
    }
    this.withdrawForm = {
      accountHolderName: this.profile.fullName || '',
      bankName: '',
      accountNumber: '',
      confirmAccountNumber: '',
      ifscCode: '',
      amount: null,
    };
    this.withdrawDialogOpen = true;
  }

  closeWithdrawDialog() {
    if (this.withdrawalProcessing) return;
    this.withdrawDialogOpen = false;
  }

  processWalletWithdrawal() {
    const accountHolderName = this.withdrawForm.accountHolderName.trim();
    const bankName = this.withdrawForm.bankName.trim();
    const accountNumber = String(this.withdrawForm.accountNumber || '').replace(/\D/g, '');
    const confirmAccountNumber = String(this.withdrawForm.confirmAccountNumber || '').replace(/\D/g, '');
    const ifscCode = String(this.withdrawForm.ifscCode || '').trim().toUpperCase();
    const amount = Number(this.withdrawForm.amount || 0);

    if (!accountHolderName || !bankName) {
      this.presentToast('Enter account holder name and bank name');
      return;
    }
    if (accountNumber.length < 9 || accountNumber.length > 18) {
      this.presentToast('Enter valid bank account number');
      return;
    }
    if (accountNumber !== confirmAccountNumber) {
      this.presentToast('Confirm account number does not match');
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      this.presentToast('Enter valid IFSC code');
      return;
    }
    if (!amount || amount < 1) {
      this.presentToast('Enter valid withdrawal amount');
      return;
    }
    if (amount > this.walletBalance) {
      this.presentToast('Withdrawal amount exceeds wallet balance');
      return;
    }

    this.withdrawalProcessing = true;
    this.walletProcessing = true;

    window.setTimeout(() => {
      const timestampSource = new Date().toISOString();
      this.walletBalance = Math.max(0, this.walletBalance - amount);
      this.transactions = [
        {
          title: 'Wallet withdrawal',
          amountValue: -amount,
          amountLabel: `INR ${amount}`,
          status: 'Paid',
          transactionId: this.buildTimestampTransactionId(timestampSource),
          timestamp: this.formatPaymentTimestamp(timestampSource),
        },
        ...this.transactions,
      ];
      this.withdrawalProcessing = false;
      this.walletProcessing = false;
      this.withdrawDialogOpen = false;
      this.presentToast(`Withdrawal processed to ${bankName} via Razorpay`);
    }, 900);
  }

  topUpWallet() {
    const amount = Number(this.walletTopUpAmount);
    if (!amount || amount < 1) {
      this.presentToast('Enter a valid wallet amount');
      return;
    }

    if (!this.auth.isAuthenticated || this.auth.token === 'demo-token') {
      this.presentToast('Login is required for Razorpay wallet top-up');
      return;
    }

    this.walletProcessing = true;
    this.appLoading = true;
    this.api.createPayment({ bookingId: 0, amount, provider: 'razorpay' }).subscribe({
      next: (response: any) => this.openRazorpayCheckout(response.payment, response.razorpay),
      error: (error) => {
        this.walletProcessing = false;
        this.appLoading = false;
        this.presentToast(error?.error?.error || 'Unable to start Razorpay payment');
      },
    });
  }

  private async openRazorpayCheckout(payment: any, razorpay: any) {
    if (!razorpay?.keyId) {
      this.walletProcessing = false;
      this.appLoading = false;
      this.loadPayments();
      this.presentToast('Razorpay key is not configured on the API. Balance not updated.');
      return;
    }

    const loaded = await this.loadRazorpayScript();
    if (!loaded || !(window as any).Razorpay) {
      this.walletProcessing = false;
      this.appLoading = false;
      this.presentToast('Razorpay checkout could not be loaded');
      return;
    }

    const checkout = new (window as any).Razorpay({
      key: razorpay.keyId,
      amount: razorpay.amount,
      currency: 'INR',
      name: razorpay.name,
      description: razorpay.description,
      order_id: razorpay.orderId,
      callback_url: `${this.apiUrl}/payments/razorpay/callback`,
      redirect: true,
      prefill: {
        name: this.profile.fullName,
        contact: this.profile.phone,
        email: this.profile.email,
      },
      theme: {
        color: '#001F3F',
      },
      handler: (result: any) => this.verifyRazorpayPayment(payment.payment_id, result),
      modal: {
        ondismiss: () => {
          this.walletProcessing = false;
          this.appLoading = false;
          this.presentToast('Payment cancelled. Wallet not updated.');
          this.api.verifyPayment(payment.payment_id, { status: 'cancelled' }).subscribe({
            next: () => this.loadPayments(),
            error: () => this.loadPayments(),
          });
        },
      },
    });
    checkout.on('payment.failed', (response: any) => {
      this.walletProcessing = false;
      this.appLoading = false;
      this.api.verifyPayment(payment.payment_id, {
        status: 'failed',
        razorpayPaymentId: response?.error?.metadata?.payment_id,
        razorpayOrderId: response?.error?.metadata?.order_id,
      }).subscribe({
        next: () => this.redirectToPaymentPending(payment.payment_id),
        error: () => this.redirectToPaymentPending(payment.payment_id),
      });
    });
    checkout.open();
  }

  private verifyRazorpayPayment(paymentId: number, result: any) {
    this.api.verifyPayment(paymentId, {
      status: 'success',
      razorpayPaymentId: result?.razorpay_payment_id,
      razorpayOrderId: result?.razorpay_order_id,
      razorpaySignature: result?.razorpay_signature,
    }).subscribe({
      next: (response: any) => {
        this.walletProcessing = false;
        this.appLoading = false;
        this.walletBalance = Number(response.walletBalance || this.walletBalance);
        this.loadPayments();
        this.redirectToPaymentPending(paymentId);
      },
      error: (error) => {
        this.walletProcessing = false;
        this.appLoading = false;
        this.presentToast(error?.error?.error || 'Payment verification failed');
      },
    });
  }

  private redirectToPaymentPending(paymentId: number) {
    this.router.navigateByUrl(`/payments?paymentStatus=pending&paymentId=${paymentId}`, { replaceUrl: true });
  }

  private loadRazorpayScript() {
    return new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  deleteChatMessage(messageId: number) {
    this.chats = this.chats.filter((chat) => chat.id !== messageId);
    this.presentToast('Message deleted');
  }

  bookRide() {
    this.presentToast('Ride booking started');
  }

  confirmBooking() {
    if (!this.isPassengerVerified) {
      this.presentToast('Passenger Gov ID verification is required before confirming ride');
      this.goTo('/profile');
      return;
    }

    if (this.selectedRide.seats < 1) {
      this.presentToast('This ride is full booked');
      return;
    }

    this.addCurrentPassengerToSelectedRide();
    this.sendBookingReceivedNotification(this.selectedRide);
    this.presentToast('Booking confirmed');
  }

  private sendBookingReceivedNotification(ride: RideSearchResult) {
    const details = this.buildBookingRequestDetails(ride);
    this.notificationCenter = [
      {
        type: 'Booking received',
        title: 'Booking received',
        message: `${details.passengerName} requested ${details.from} to ${details.to}.`,
        time: 'Now',
        unread: true,
        icon: 'person-circle-outline',
        bookingDetails: details,
      },
      ...this.notificationCenter,
    ];
    this.unreadCount += 1;
    this.liveActivity = `Booking received for ${details.route}`;
    this.saveRealtimeState();
  }

  private buildBookingRequestDetails(ride: RideSearchResult): BookingRequestDetails {
    return {
      passengerName: this.profile.fullName || 'Passenger',
      passengerPhoto: this.currentUserAvatar,
      passengerPhone: this.profile.phone,
      passengerGovIdNumber: this.profile.govIdNumber || 'Verified ID',
      verified: this.isPassengerVerified,
      from: ride.pickup,
      to: ride.drop,
      route: ride.route,
      vehicle: ride.vehicle,
      pickup: ride.pickup,
      drop: ride.drop,
    };
  }

  openNotification(item: NotificationCenterItem) {
    item.unread = false;
    this.unreadCount = Math.max(0, this.unreadCount - 1);
    if (item.bookingDetails) {
      this.selectedBookingRequest = item.bookingDetails;
    }
    if (item.action === 'same_route') {
      this.viewSameRouteRidesFromNotification();
      this.saveRealtimeState();
      return;
    }
    const targetRoute = this.notificationTargetRoute(item);
    if (targetRoute) this.goTo(targetRoute);
    this.saveRealtimeState();
  }

  private notificationTargetRoute(item: NotificationCenterItem) {
    const text = `${item.type} ${item.title} ${item.message} ${item.action || ''}`.toLowerCase();
    if (item.action === 'messages' || text.includes('message') || text.includes('chat')) return '/chat';
    if (item.action === 'vehicles' || text.includes('vehicle') || text.includes('verification')) return '/vehicles';
    if (item.action === 'payments' || text.includes('payment') || text.includes('wallet') || text.includes('refund')) return '/payments';
    if (item.action === 'profile' || text.includes('profile') || text.includes('document')) return '/profile';
    if (item.action === 'rides' || text.includes('ride') || text.includes('booking')) return '/your-rides';
    return '';
  }

  viewSameRouteRidesFromNotification() {
    this.activeRideTab = 'My Published Rides';
    this.search.from = 'Bengaluru Central';
    this.search.to = 'Mysuru Palace Road';
    this.resultRides = this.buildNearbyRideResults();
    this.presentToast('Showing available rides on the same route');
    this.goTo('/results');
  }

  closeBookingRequestPopup() {
    this.selectedBookingRequest = null;
  }

  approveBookingRequest() {
    if (!this.selectedBookingRequest?.bookingId) return;
    this.api.updateBooking(this.selectedBookingRequest.bookingId, { status: 'confirmed' }).subscribe({
      next: () => {
        this.presentToast('Booking confirmed');
        this.loadOwnerBookingRequests();
        this.loadPublishedRides();
        this.closeBookingRequestPopup();
      },
      error: (error) => this.presentToast(error?.error?.error || 'Unable to confirm booking'),
    });
  }

  rejectBookingRequest() {
    if (!this.selectedBookingRequest?.bookingId) return;
    this.api.updateBooking(this.selectedBookingRequest.bookingId, { status: 'rejected' }).subscribe({
      next: () => {
        this.presentToast('Booking rejected');
        this.loadOwnerBookingRequests();
        this.closeBookingRequestPopup();
      },
      error: (error) => this.presentToast(error?.error?.error || 'Unable to reject booking'),
    });
  }

  contactBookingPassenger(mode: 'phone' | 'email' | 'chat') {
    if (!this.selectedBookingRequest) return;
    if (mode === 'phone' && this.selectedBookingRequest.passengerPhone) {
      window.location.href = `tel:${this.selectedBookingRequest.passengerPhone.replace(/\s+/g, '')}`;
      return;
    }
    if (mode === 'email' && this.selectedBookingRequest.passengerEmail) {
      window.location.href = `mailto:${this.selectedBookingRequest.passengerEmail}`;
      return;
    }
    if (mode === 'chat' && this.selectedBookingRequest.rideId && this.selectedBookingRequest.passengerId) {
      this.selectedRide = {
        ...this.selectedRide,
        id: this.selectedBookingRequest.rideId,
        driverId: this.selectedBookingRequest.passengerId,
        driver: this.selectedBookingRequest.passengerName,
        owner: this.selectedBookingRequest.passengerName,
        photo: this.selectedBookingRequest.passengerPhoto || this.avatarForName(this.selectedBookingRequest.passengerName),
        route: this.selectedBookingRequest.route,
        pickup: this.selectedBookingRequest.pickup,
        drop: this.selectedBookingRequest.drop,
      };
      this.goTo('/chat');
      this.loadChatHistory();
      return;
    }
    this.presentToast('Contact detail unavailable');
  }

  openOwnerProfile() {
    this.ownerProfileOpen = true;
  }

  closeOwnerProfile() {
    this.ownerProfileOpen = false;
  }

  openPassengerProfile(passenger: PassengerPublicProfile) {
    this.selectedPassengerProfile = passenger;
  }

  closePassengerProfile() {
    this.selectedPassengerProfile = null;
  }

  setPastRideRating(star: number) {
    this.pastRideRating = star;
  }

  submitPastRideRating() {
    if (!this.pastRideRating) {
      this.presentToast('Select a star rating first');
      return;
    }

    this.recordAdminLog('Ride', 'Owner rating submitted', this.profile.fullName, this.selectedRide.driver, 'active');
    this.presentToast('Rating submitted');
  }

  private addCurrentPassengerToSelectedRide() {
    const passengerName = this.profile.fullName || 'You';
    const passengerExists = this.selectedRide.passengers.includes(passengerName);
    this.selectedRide = {
      ...this.selectedRide,
      seats: Math.max(0, this.selectedRide.seats - (passengerExists ? 0 : 1)),
      bookedSeats: Math.min(this.selectedRide.totalSeats, this.selectedRide.bookedSeats + (passengerExists ? 0 : 1)),
      passengers: passengerExists ? this.selectedRide.passengers : [...this.selectedRide.passengers, passengerName],
    };
  }

  addStop() {
    this.stops = [...this.stops, 'New stop'];
    this.presentToast('Stop added');
  }

  startPublishRideFlow() {
    if (!this.vehicles.length) {
      this.presentToast('Add your vehicle first before publishing a ride');
      this.goTo('/vehicles');
      return;
    }
    if (!this.hasVerifiedPublishVehicle) {
      this.presentToast('Only verified vehicles can be used to publish rides. Verification usually takes 10 to 15 minutes.');
      this.goTo('/vehicles');
      return;
    }
    this.ensurePublishVehicleSelection();
    this.goTo('/publish');
  }

  selectPublishVehicle(vehicle: ProfileVehicle) {
    if (!this.isVehicleVerified(vehicle) || !vehicle.vehicleId) {
      this.presentToast('This vehicle is still under verification');
      return;
    }
    this.publishRideForm.vehicleId = Number(vehicle.vehicleId);
  }

  useCurrentLocationForPublish() {
    if (!navigator.geolocation) {
      this.presentToast('Current location is not supported on this device');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.publishRideForm.departureLat = Number(position.coords.latitude);
        this.publishRideForm.departureLng = Number(position.coords.longitude);
        this.publishRideForm.departure = 'Current location';
        this.presentToast('Current location added as source');
      },
      () => this.presentToast('Unable to fetch current location'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  continuePublish() {
    if (!this.canPublishRide) {
      this.presentToast('Complete owner profile and vehicle verification before publishing');
      this.goTo(this.hasVerifiedPublishVehicle ? '/profile' : '/vehicles');
      return;
    }

    if (!this.canContinuePublishDetails) {
      this.presentToast('Select a verified vehicle, source, destination, and allowed passengers');
      return;
    }

    const nextStep = Math.min(4, this.publishFlowStepFromRoute + 1);
    const routes = {
      3: '/publish/preferences',
      4: '/publish/confirm',
    };

    this.goTo(routes[nextStep as 3 | 4] || '/publish');
    this.presentToast(nextStep === 4 ? 'Review your ride' : 'Preferences saved');
  }

  previousPublishStep() {
    if (this.publishFlowStepFromRoute === 4) {
      this.goTo('/publish/preferences');
      return;
    }

    if (this.publishFlowStepFromRoute === 3) {
      this.goTo('/publish');
      return;
    }

    this.goTo('/search');
  }

  increaseSeats() {
    this.publishRideForm.allowedPassengers = Math.min(8, this.publishRideForm.allowedPassengers + 1);
  }

  decreaseSeats() {
    this.publishRideForm.allowedPassengers = Math.max(1, this.publishRideForm.allowedPassengers - 1);
  }

  selectMusic(option: string) {
    this.travelPreferences.music = option;
  }

  selectChat(option: string) {
    this.travelPreferences.chat = option;
  }

  publishRideNow() {
    const verifiedVehicle = this.selectedPublishVehicle;
    if (!this.canPublishRide || !verifiedVehicle?.vehicleId) {
      this.presentToast('Verification must be complete before your ride can go public');
      this.goTo(this.hasVerifiedPublishVehicle ? '/profile' : '/vehicles');
      return;
    }

    this.api
      .publishRide({
        vehicleId: verifiedVehicle.vehicleId,
        origin: this.publishRideForm.departure,
        destination: this.publishRideForm.destination,
        originLat: this.publishRideForm.departureLat,
        originLng: this.publishRideForm.departureLng,
        destinationLat: this.publishRideForm.destinationLat,
        destinationLng: this.publishRideForm.destinationLng,
        departureAt: new Date(Date.now() + 86400000).toISOString(),
        pricePerSeat: this.rideSetup.pricePerSeat,
        totalSeats: this.publishRideForm.allowedPassengers,
        instantBooking: false,
        stops: this.stops,
        backpackAllowed: this.publishRideForm.backpackAllowed,
        bigTrolleyAllowed: this.publishRideForm.bigTrolleyAllowed,
      })
      .subscribe({
        next: (response: any) => {
          const ride = response.ride || {};
          this.managedRides = [
            {
              id: ride.ride_id,
              tab: 'My Published Rides',
              driver: this.profile.fullName,
              image: this.currentUserAvatar,
              route: `${ride.origin || this.publishRideForm.departure} to ${ride.destination || this.publishRideForm.destination}`,
              date: 'Tomorrow',
              time: new Date(ride.departure_at || Date.now() + 86400000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              price: `INR ${Number(ride.price_per_seat || this.rideSetup.pricePerSeat)}`,
              status: 'Published',
              vehicle: `${verifiedVehicle.make} ${verifiedVehicle.model}`,
              seatsAvailable: Number(ride.seats_available ?? this.publishRideForm.allowedPassengers),
              totalSeats: Number(ride.total_seats ?? this.publishRideForm.allowedPassengers),
              bookingRequests: [],
            },
            ...this.managedRides.filter((item) => item.tab !== 'My Published Rides'),
          ];
          this.activeRideTab = 'My Published Rides';
          this.showPublishSuccess = true;
          this.loadPublishedRides();
        },
        error: () => {
          this.showPublishSuccess = true;
        },
      });
  }

  closePublishSuccess() {
    this.showPublishSuccess = false;
  }

  selectTab(tab: 'search' | 'publish' | 'yourRides' | 'inbox' | 'profile') {
    if (tab === 'publish') {
      this.startPublishRideFlow();
      return;
    }

    const routes = {
      search: '/search',
      publish: '/publish',
      yourRides: '/your-rides',
      inbox: '/inbox',
      profile: '/profile',
    };

    this.goTo(routes[tab]);
  }

  get filteredManagedRides() {
    return this.managedRides.filter((ride) => ride.tab === this.activeRideTab);
  }

  get currentRideIsPast() {
    return this.selectedRideMode === 'past';
  }

  get unreadMessageCount() {
    return this.conversations.reduce((total, conversation) => total + conversation.unread, 0);
  }

  get filteredAdminLogs() {
    const query = this.adminLogSearch.trim().toLowerCase();
    return this.adminLogs
      .filter((log) => this.adminLogType === 'All' || log.type === this.adminLogType)
      .filter((log) => {
        const searchable = `${log.action} ${log.actor} ${log.target} ${log.type} ${log.createdAt}`.toLowerCase();
        return !query || searchable.includes(query);
      })
      .sort((first, second) => second.id - first.id);
  }

  get pagedAdminLogs() {
    const start = (this.adminLogPage - 1) * this.adminLogPageSize;
    return this.filteredAdminLogs.slice(start, start + this.adminLogPageSize);
  }

  get adminLogTotalPages() {
    return Math.max(1, Math.ceil(this.filteredAdminLogs.length / this.adminLogPageSize));
  }

  get activeAdminAds() {
    return this.adminAds.filter((ad) => ad.status === 'active');
  }

  get expiredAdminAds() {
    return this.adminAds.filter((ad) => ad.status === 'expired');
  }

  get adminAdRevenue() {
    return this.adInvoices.reduce((total, invoice) => total + invoice.finalAmount, 0);
  }

  get monthlyAdRevenue() {
    return this.adInvoices
      .filter((invoice) => invoice.paymentStatus === 'Paid')
      .reduce((total, invoice) => total + invoice.finalAmount, 0);
  }

  get adminOwnerBalance() {
    return this.adminOwners.reduce((total, owner) => total + owner.balance, 0);
  }

  get adminPassengerBalance() {
    return this.adminPassengers.reduce((total, passenger) => total + passenger.balance, 0);
  }

  get adminWalletFloat() {
    return this.adminOwnerBalance + this.adminPassengerBalance;
  }

  get adminWalletAddedTotal() {
    return this.adminWalletTransactions.reduce((total, transaction) => total + Math.max(0, transaction.amount), 0);
  }

  get adminMoneyTabLabel() {
    return this.adminMoneyTabs.find((tab) => tab.key === this.adminMoneyTab)?.label || 'Admin';
  }

  get adminWalletVisibleTransactions() {
    const roleByTab: Record<AdminMoneyTab, string> = {
      admin: 'Admin',
      owners: 'Owner',
      passengers: 'Passenger',
    };
    return this.adminWalletTransactions
      .filter((transaction) => transaction.role === roleByTab[this.adminMoneyTab])
      .sort((first, second) => second.id - first.id);
  }

  get pagedAdminWalletTransactions() {
    const start = (this.adminMoneyPage - 1) * this.adminMoneyPageSize;
    return this.adminWalletVisibleTransactions.slice(start, start + this.adminMoneyPageSize);
  }

  get adminMoneyTotalPages() {
    return Math.max(1, Math.ceil(this.adminWalletVisibleTransactions.length / this.adminMoneyPageSize));
  }

  get adminVisibleWalletTotal() {
    return this.adminWalletVisibleTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  }

  get adminVisibleWalletCredits() {
    return this.adminWalletVisibleTransactions.reduce((total, transaction) => total + Math.max(0, transaction.amount), 0);
  }

  get adminVisibleWalletDebits() {
    return this.adminWalletVisibleTransactions.reduce((total, transaction) => total + Math.abs(Math.min(0, transaction.amount)), 0);
  }

  get selectedAdminUserDocuments() {
    if (!this.selectedAdminUser) return [];
    const baseDocuments = this.selectedAdminUser.documents || [];
    if (this.selectedAdminUser.role !== 'owner') return baseDocuments;

    const vehicleDocuments = this.adminVehicleCases
      .filter((vehicle) => vehicle.ownerId === this.selectedAdminUser?.id)
      .reduce<AdminDocument[]>((documents, vehicle) => {
        const vehicleDocs = vehicle.documentItems?.length
          ? vehicle.documentItems.map((document) => ({
              ...document,
              label: `${vehicle.vehicle} ${document.label}`,
              status: vehicle.status === 'verified' ? 'verified' as const : document.status,
            }))
          : [
              { label: `${vehicle.vehicle} RC book`, value: vehicle.plate, status: vehicle.status },
              { label: `${vehicle.vehicle} front photo`, value: vehicle.documents, status: vehicle.status },
              { label: `${vehicle.vehicle} back photo`, value: vehicle.documents, status: vehicle.status },
            ];
        documents.push(...vehicleDocs);
        return documents;
      }, []);
    return [...baseDocuments, ...vehicleDocuments];
  }

  get selectedAdminVehicleDocuments() {
    return this.selectedAdminVehicle?.documentItems || [];
  }

  get selectedAdminUserTransactions() {
    if (!this.selectedAdminUser) return [];
    return [...this.adminWalletTransactions, ...this.adminTransactions].filter(
      (transaction) => transaction.user === this.selectedAdminUser?.name,
    );
  }

  get activeAdPartners() {
    return this.adPartners.filter((partner) => partner.status === 'active');
  }

  get highPriorityPartners() {
    return this.adPartners.filter((partner) => partner.priority === 'High');
  }

  get pendingBillingAmount() {
    return this.adInvoices
      .filter((invoice) => invoice.paymentStatus === 'Pending' || invoice.paymentStatus === 'Partial Payment')
      .reduce((total, invoice) => total + invoice.finalAmount, 0);
  }

  get paidBillingAmount() {
    return this.adInvoices
      .filter((invoice) => invoice.paymentStatus === 'Paid')
      .reduce((total, invoice) => total + invoice.finalAmount, 0);
  }

  get totalBillingGst() {
    return this.adInvoices.reduce((total, invoice) => total + invoice.gst, 0);
  }

  openVehicleAdd() {
    if (this.vehicles.length >= 2) {
      this.showVehicleLimitAlert();
      return;
    }

    this.resetVehicleForm();
    this.goTo('/vehicles');
  }

  vehicleKey(vehicle: Partial<ProfileVehicle>) {
    return String(vehicle.vehicleId || vehicle.plateNumber || `${vehicle.make}-${vehicle.model}`);
  }

  get isEditingVehicle() {
    return Boolean(this.editingVehicleKey);
  }

  get vehicleMakeOptions() {
    return this.vehicleCatalog.map((item) => item.make);
  }

  get vehicleModelOptions() {
    return this.vehicleCatalog.find((item) => item.make === this.vehicleForm.make)?.models || [];
  }

  get filteredVehicleMakeOptions() {
    const query = this.vehicleForm.make.trim().toLowerCase();
    return this.vehicleMakeOptions.filter((make) => make.toLowerCase().includes(query)).slice(0, 8);
  }

  get filteredVehicleModelOptions() {
    const query = this.vehicleForm.model.trim().toLowerCase();
    return this.vehicleModelOptions.filter((model) => model.name.toLowerCase().includes(query)).slice(0, 8);
  }

  openVehicleLookup(type: 'make' | 'model') {
    this.activeVehicleLookup = type;
  }

  closeVehicleLookup() {
    window.setTimeout(() => {
      this.activeVehicleLookup = null;
    }, 120);
  }

  onVehicleMakeChange(value: string) {
    this.vehicleForm.make = value;
    this.activeVehicleLookup = 'make';
    const selectedMake = this.vehicleCatalog.find((item) => item.make === value);
    const modelExists = selectedMake?.models.some((model) => model.name === this.vehicleForm.model);

    if (!modelExists) {
      this.vehicleForm.model = '';
      this.vehicleForm.seats = 4;
    }
  }

  onVehicleModelChange(value: string) {
    this.vehicleForm.model = value;
    this.activeVehicleLookup = 'model';
    const selectedModel = this.vehicleModelOptions.find((model) => model.name === value);

    if (selectedModel) {
      this.vehicleForm.seats = selectedModel.seats;
    }
  }

  selectVehicleMake(make: string) {
    this.onVehicleMakeChange(make);
    this.activeVehicleLookup = null;
  }

  selectVehicleModel(model: { name: string; seats: number }) {
    this.vehicleForm.model = model.name;
    this.vehicleForm.seats = model.seats;
    this.activeVehicleLookup = null;
  }

  toggleVehicleMenu(vehicle: Partial<ProfileVehicle>) {
    const key = this.vehicleKey(vehicle);
    this.activeVehicleMenuId = this.activeVehicleMenuId === key ? null : key;
  }

  backFromVehicleForm() {
    this.resetVehicleForm();
    this.goTo('/profile');
  }

  private showVehicleLimitAlert() {
    window.alert(
      'Maximum 2 vehicles. Admin verifies vehicle and documents before ride publishing. If you want to add a new vehicle, delete one existing vehicle first. Verification can take 3-4 hours.',
    );
  }

  addVehicle() {
    const isEdit = this.isEditingVehicle;
    if (!isEdit && this.vehicles.length >= 2) {
      this.showVehicleLimitAlert();
      return;
    }

    if (
      !this.vehicleForm.make.trim() ||
      !this.vehicleForm.model.trim() ||
      !this.vehicleForm.plateNumber ||
      !Number(this.vehicleForm.seats) ||
      !this.vehicleForm.rcDocumentUrl ||
      !this.vehicleForm.frontPhotoUrl ||
      !this.vehicleForm.backPhotoUrl
    ) {
      this.presentToast('Make, model, seats, plate number, RC book, and vehicle photos are mandatory');
      return;
    }

    const plateNumber = this.normalizePlateNumber(this.vehicleForm.plateNumber);
    this.vehicleForm.plateNumber = plateNumber;

    const payload = {
      make: this.vehicleForm.make.trim(),
      model: this.vehicleForm.model.trim(),
      color: this.vehicleForm.color,
      plateNumber,
      seats: Math.max(1, Math.min(12, Number(this.vehicleForm.seats))),
      rcDocumentUrl: this.vehicleForm.rcDocumentUrl,
      insuranceDocumentUrl: this.vehicleForm.insuranceDocumentUrl,
      frontPhotoUrl: this.vehicleForm.frontPhotoUrl,
      backPhotoUrl: this.vehicleForm.backPhotoUrl,
    };

    if (isEdit && !this.vehicleForm.vehicleId) {
      const vehicle = {
        make: this.vehicleForm.make,
        model: this.vehicleForm.model,
        color: this.vehicleForm.color,
        plateNumber: this.vehicleForm.plateNumber,
        seats: this.vehicleForm.seats,
        status: 'pending',
        rcDocumentUrl: this.vehicleForm.rcDocumentUrl,
        insuranceDocumentUrl: this.vehicleForm.insuranceDocumentUrl,
        frontPhotoUrl: this.vehicleForm.frontPhotoUrl,
        backPhotoUrl: this.vehicleForm.backPhotoUrl,
      };
      this.vehicles = this.vehicles.map((item) => (this.vehicleKey(item) === this.editingVehicleKey ? vehicle : item));
      this.saveRealtimeState();
      this.resetVehicleForm();
      this.presentToast('Vehicle updated successfully');
      return;
    }

    const request$ = isEdit
      ? this.api.updateVehicle(this.vehicleForm.vehicleId as number, payload)
      : this.api.addVehicle(payload);

    this.vehicleSaving = true;
    request$.subscribe({
      next: (response: any) => {
        const saved = response.vehicle || {};
        const vehicle = {
          vehicleId: saved.vehicle_id || this.vehicleForm.vehicleId || Date.now(),
          make: saved.make || this.vehicleForm.make,
          model: saved.model || this.vehicleForm.model,
          color: saved.color || this.vehicleForm.color,
          plateNumber: saved.plate_number || plateNumber,
          seats: saved.seats || this.vehicleForm.seats,
          status: saved.status || 'pending',
          rcDocumentUrl: saved.rc_document_url || this.vehicleForm.rcDocumentUrl,
          insuranceDocumentUrl: saved.insurance_document_url || this.vehicleForm.insuranceDocumentUrl,
          frontPhotoUrl: saved.front_photo_url || this.vehicleForm.frontPhotoUrl,
          backPhotoUrl: saved.back_photo_url || this.vehicleForm.backPhotoUrl,
        };
        this.vehicles = isEdit
          ? this.vehicles.map((item) => (item.vehicleId === vehicle.vehicleId ? vehicle : item))
          : [vehicle, ...this.vehicles];
        this.vehicleSaving = false;
        this.liveActivity = 'Backend vehicle event received · realtime notification pushed';
        this.saveRealtimeState();
        this.resetVehicleForm();
        this.loadProfile();
      },
      error: (error) => {
        this.vehicleSaving = false;
        this.presentToast(error?.error?.error || 'Vehicle save failed');
      },
    });
    this.notificationCenter = [
      {
        type: 'Vehicle added',
        title: isEdit ? 'Vehicle updated for verification' : 'Vehicle submitted for verification',
        message: `${this.vehicleForm.make} ${this.vehicleForm.model} is now in review.`,
        time: 'Now',
        unread: true,
        icon: 'car-outline',
      },
      ...this.notificationCenter,
    ];
    this.unreadCount += 1;
    this.liveActivity = isEdit ? 'Vehicle updated · notification pushed in realtime' : 'Vehicle created · notification pushed in realtime';
    this.saveRealtimeState();
    this.presentToast(isEdit ? 'Vehicle updated successfully' : 'Vehicle added successfully');
  }

  onVehiclePlateInput(value: string) {
    this.vehicleForm.plateNumber = this.normalizePlateNumber(value);
  }

  private normalizePlateNumber(value: string) {
    return String(value || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').replace(/^\s+/, '');
  }

  editVehicle(vehicle: ProfileVehicle) {
    this.activeVehicleMenuId = null;
    this.editingVehicleKey = this.vehicleKey(vehicle);
    this.vehicleForm = {
      vehicleId: vehicle.vehicleId || null,
      make: vehicle.make,
      model: vehicle.model,
      color: vehicle.color,
      plateNumber: vehicle.plateNumber,
      seats: vehicle.seats,
      rcDocumentUrl: vehicle.rcDocumentUrl || '',
      insuranceDocumentUrl: vehicle.insuranceDocumentUrl || '',
      frontPhotoUrl: vehicle.frontPhotoUrl || '',
      backPhotoUrl: vehicle.backPhotoUrl || '',
      status: vehicle.status || 'pending',
    };
    this.goTo('/vehicles');
  }

  deleteVehicle(vehicle: ProfileVehicle) {
    this.activeVehicleMenuId = null;
    if (!window.confirm(`Delete ${vehicle.make} ${vehicle.model}?`)) return;

    const previousVehicles = [...this.vehicles];
    this.vehicles = this.vehicles.filter((item) => item !== vehicle && item.vehicleId !== vehicle.vehicleId);
    this.saveRealtimeState();

    if (!vehicle.vehicleId) {
      this.presentToast('Vehicle deleted');
      return;
    }

    this.api.deleteVehicle(vehicle.vehicleId).subscribe({
      next: () => {
        this.loadProfile();
        this.presentToast('Vehicle deleted');
      },
      error: (error) => {
        if (this.auth.isAuthenticated && this.auth.token !== 'demo-token') {
          this.vehicles = previousVehicles;
          this.saveRealtimeState();
          this.presentToast(error?.error?.error || 'Vehicle delete failed');
          return;
        }

        this.presentToast('Vehicle deleted locally');
      },
    });
  }

  resetVehicleForm() {
    this.editingVehicleKey = null;
    this.vehicleForm = {
      vehicleId: null,
      make: '',
      model: '',
      color: '',
      plateNumber: '',
      seats: 4,
      rcDocumentUrl: '',
      insuranceDocumentUrl: '',
      frontPhotoUrl: '',
      backPhotoUrl: '',
      status: 'pending',
    };
  }

  updateVehicleDocument(event: Event, field: 'rcDocumentUrl' | 'insuranceDocumentUrl' | 'frontPhotoUrl' | 'backPhotoUrl') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      input.value = '';
      this.presentToast('Only image files are allowed');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.vehicleForm[field] = String(reader.result || file.name);
    };
    reader.readAsDataURL(file);
  }

  vehiclePreviewUrl(value: string, label: string) {
    if (value.startsWith('data:image/')) {
      return value;
    }

    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="120" viewBox="0 0 180 120"><rect width="180" height="120" rx="18" fill="#eef3f8"/><text x="90" y="56" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#001F3F">${label}</text><text x="90" y="78" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">Current image</text></svg>`,
    )}`;
  }

  vehicleStatusClass(vehicle: Partial<ProfileVehicle>) {
    const status = this.normalizedVehicleStatus(vehicle).toLowerCase();
    return {
      pending: status === 'pending',
      reupload: status === 'reupload',
      rejected: status === 'rejected',
      verified: status === 'verified',
    };
  }

  vehicleDocumentSummary(vehicle: Partial<ProfileVehicle>) {
    const mandatoryUploaded = [
      vehicle.rcDocumentUrl,
      vehicle.frontPhotoUrl,
      vehicle.backPhotoUrl,
    ].filter(Boolean).length;
    return `${mandatoryUploaded}/3 mandatory images uploaded${vehicle.insuranceDocumentUrl ? ' - Insurance uploaded' : ' - Insurance optional'}`;
  }

  private normalizedVehicleStatus(vehicle: Partial<ProfileVehicle>) {
    const status = this.vehicleStatus(vehicle);
    const hasMandatoryImages = Boolean(vehicle.rcDocumentUrl && vehicle.frontPhotoUrl && vehicle.backPhotoUrl);
    if (status.toLowerCase() === 'verified' && !hasMandatoryImages) {
      return 'reupload';
    }

    return status;
  }

  private restoreRealtimeState() {
    this.clearLegacyLocalAppData();
  }

  private saveRealtimeState() {
    // App data is API/database-owned. Only the auth session is cached locally.
  }

  private bindRealtimeEvents() {
    this.realtime.events$.subscribe((event) => {
      this.liveActivity = `Realtime event - ${event.type}`;
      const payload: any = event.payload;
      if (event.type === 'message.created' && payload?.message) {
        this.applyRealtimeMessage(payload.message);
      }
      if (event.type === 'message.typing') {
        this.applyRemoteTyping(payload);
      }
      if (event.type === 'booking.updated') {
        this.presentToast(payload?.notification?.message || 'Ride booking updated');
      }
      const notification = payload?.notification || payload;
      if (notification?.title && notification?.message) {
        this.notificationCenter = [
          {
            type: notification.type || 'Realtime',
            title: notification.title,
            message: notification.message,
            time: 'Now',
            unread: true,
            icon: notification.type === 'message_received' ? 'chatbubble-ellipses-outline' : 'notifications-outline',
          },
          ...this.notificationCenter,
        ];
        this.unreadCount += 1;
        this.saveRealtimeState();
      }
    });
  }

  private applyRealtimeMessage(message: any) {
    const currentUserId = this.auth.user?.user_id;
    if (Number(message.ride_id) === Number(this.selectedRide.id || 1)) {
      const exists = this.chats.some((chat) => Number(chat.id) === Number(message.message_id));
      if (!exists) {
        this.chats = [
          ...this.chats,
          {
            id: message.message_id,
            from: message.sender_id === currentUserId ? 'me' : 'driver',
            text: message.message,
            time: message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
            attachment: message.attachment_url ? 'Attachment' : undefined,
            attachmentType: message.attachment_url?.startsWith('data:image/') ? 'image' : undefined,
            previewUrl: message.attachment_url?.startsWith('data:image/') ? message.attachment_url : undefined,
          },
        ];
      }
    }
    this.loadConversations();
  }

  private applyRemoteTyping(payload: any) {
    if (Number(payload?.ride_id) !== Number(this.selectedRide.id || 1) || !payload?.is_typing) return;
    this.remoteTypingUser = this.selectedRide.driver;
    if (this.remoteTypingTimer) window.clearTimeout(this.remoteTypingTimer);
    this.remoteTypingTimer = window.setTimeout(() => {
      this.remoteTypingUser = '';
      this.remoteTypingTimer = undefined;
    }, 1800);
  }

  setRideTab(tab: string) {
    this.activeRideTab = tab;
  }

  setAdminTab(tab: string) {
    this.activeAdminTab = tab;
  }

  viewAdminUserDetails(user: AdminUser) {
    this.selectedAdminUser = user;
  }

  closeAdminUserDetails() {
    this.selectedAdminUser = null;
  }

  viewAdminVehicleDetails(vehicle: AdminVehicleCase) {
    this.selectedAdminVehicle = vehicle;
  }

  closeAdminVehicleDetails() {
    this.selectedAdminVehicle = null;
  }

  openAdminDocumentPreview(document: AdminDocument) {
    this.selectedAdminDocument = document;
  }

  closeAdminDocumentPreview() {
    this.selectedAdminDocument = null;
  }

  adminDocumentPreviewUrl(document: AdminDocument) {
    if (document.previewUrl?.startsWith('data:image/')) return document.previewUrl;
    const statusColors: Record<AdminDocument['status'], string> = {
      pending: '#fff7ed',
      verified: '#ecfdf5',
      reupload: '#eef3ff',
      rejected: '#fff1f2',
    };
    const inkColors: Record<AdminDocument['status'], string> = {
      pending: '#9a3412',
      verified: '#047857',
      reupload: '#1d4ed8',
      rejected: '#be123c',
    };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360" viewBox="0 0 360 360"><rect width="360" height="360" rx="28" fill="${statusColors[document.status]}"/><rect x="42" y="54" width="276" height="210" rx="18" fill="#ffffff" stroke="#d7dee8" stroke-width="3"/><text x="180" y="120" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700" fill="${inkColors[document.status]}">${this.escapeSvg(document.label)}</text><text x="180" y="168" text-anchor="middle" font-family="Arial" font-size="16" fill="#475569">${this.escapeSvg(document.value)}</text><text x="180" y="216" text-anchor="middle" font-family="Arial" font-size="15" font-weight="700" fill="${inkColors[document.status]}">${document.status.toUpperCase()}</text><text x="180" y="304" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748b">Document preview</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  private escapeSvg(value: string) {
    return value.replace(/[&<>"']/g, (char) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      };
      return entities[char];
    });
  }

  adminStatusClass(status: string) {
    return {
      verified: ['verified', 'active', 'Credited', 'Live', 'Paid', 'Payment success', 'Success'].includes(status),
      pending: ['pending', 'warning', 'Refund pending', 'Pending', 'Partial Payment', 'disabled', 'expired', 'Processing'].includes(status),
      rejected: ['blocked', 'rejected', 'Dispute check', 'Failed', 'Refunded', 'Canceled', 'Cancelled'].includes(status),
      reupload: status === 'reupload',
    };
  }

  changeAdminLogPage(direction: number) {
    this.adminLogPage = Math.min(this.adminLogTotalPages, Math.max(1, this.adminLogPage + direction));
  }

  setAdminMoneyTab(tab: AdminMoneyTab) {
    this.adminMoneyTab = tab;
    this.adminMoneyPage = 1;
  }

  changeAdminMoneyPage(direction: number) {
    this.adminMoneyPage = Math.min(this.adminMoneyTotalPages, Math.max(1, this.adminMoneyPage + direction));
  }

  createAdminAd() {
    const ad: AdminAd = {
      id: Date.now(),
      name: this.adForm.name || 'Untitled ad',
      type: this.adForm.type,
      partner: 'Internal Promotions',
      size: this.adForm.size,
      placement: this.adForm.placement,
      area: this.adForm.area || 'All India',
      state: this.adForm.area || 'All India',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      impressions: 0,
      clicks: 0,
      ctr: 0,
      status: 'active',
    };
    this.adminAds = [ad, ...this.adminAds];
    this.adminAdHistory = [
      { id: Date.now(), adName: ad.name, action: 'Created', details: `${ad.type} scheduled for ${ad.placement}`, adminUser: 'Admin', createdAt: new Date().toLocaleString() },
      ...this.adminAdHistory,
    ];
    this.recordAdminLog('Ads', 'Ad created', 'Admin', ad.name, 'active');
    this.presentToast('Ad created and scheduled');
  }

  toggleAdminAd(ad: AdminAd) {
    ad.status = ad.status === 'active' ? 'disabled' : 'active';
    this.adminAdHistory = [
      { id: Date.now(), adName: ad.name, action: ad.status === 'active' ? 'Enabled' : 'Disabled', details: 'Admin toggled ad delivery status.', adminUser: 'Admin', createdAt: new Date().toLocaleString() },
      ...this.adminAdHistory,
    ];
    this.recordAdminLog('Ads', `Ad ${ad.status}`, 'Admin', ad.name, ad.status === 'active' ? 'active' : 'pending');
  }

  bulkTogglePartnerAds() {
    const hasActiveAds = this.adminAds.some((ad) => ad.status === 'active');
    this.adminAds = this.adminAds.map((ad) => ({ ...ad, status: hasActiveAds ? 'disabled' : 'active' }));
    this.recordAdminLog('Ads', 'Bulk partner ads toggled', 'Admin', `${this.adminAds.length} ads`, 'pending');
    this.presentToast('Partner ads bulk status updated');
  }

  renewAdminAd(ad: AdminAd) {
    ad.status = 'active';
    ad.endDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    this.adminAdHistory = [
      { id: Date.now(), adName: ad.name, action: 'Renewed', details: `Extended until ${ad.endDate}`, adminUser: 'Admin', createdAt: new Date().toLocaleString() },
      ...this.adminAdHistory,
    ];
    this.recordAdminLog('Ads', 'Ad renewed', 'Admin', ad.name, 'active');
    this.presentToast('Ad renewed for 30 days');
  }

  deleteAdminAd(ad: AdminAd) {
    if (!window.confirm(`Delete ${ad.name}?`)) return;
    this.adminAds = this.adminAds.filter((item) => item.id !== ad.id);
    this.recordAdminLog('Ads', 'Ad deleted', 'Admin', ad.name, 'warning');
    this.presentToast('Ad deleted');
  }

  exportAdsReport() {
    const headers = [
      'Ad ID',
      'Ad Name',
      'Partner',
      'Banner Size',
      'Placement',
      'Area/State',
      'Start Date',
      'End Date',
      'Impressions',
      'Clicks',
      'CTR %',
      'Status',
    ];
    const rows = this.adminAds.map((ad) => [
      ad.id,
      ad.name,
      ad.partner,
      ad.size,
      ad.placement,
      `${ad.area}/${ad.state}`,
      ad.startDate,
      ad.endDate,
      ad.impressions,
      ad.clicks,
      ad.ctr,
      ad.status,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ads-report.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    this.recordAdminLog('Ads', 'Ads report exported', 'Admin', 'CSV report', 'active');
  }

  private recordAdminLog(type: AdminLog['type'], action: string, actor: string, target: string, priority: AdminLog['priority']) {
    const iconByType: Record<AdminLog['type'], string> = {
      Passenger: 'person-circle-outline',
      Owner: 'car-outline',
      Ride: 'map-outline',
      Security: 'lock-closed-outline',
      Ads: 'notifications-outline',
    };
    this.adminLogs = [
      {
        id: Date.now(),
        type,
        action,
        actor,
        target,
        priority,
        icon: iconByType[type],
        createdAt: new Date().toLocaleString(),
      },
      ...this.adminLogs,
    ];
  }

  approveAdminUser(user: AdminUser) {
    user.verification = 'verified';
    user.status = user.status === 'blocked' ? 'blocked' : 'active';
    user.documents = user.documents?.map((document) => ({ ...document, status: 'verified' }));
    if (user.role === 'owner') {
      this.adminVehicleCases = this.adminVehicleCases.map((vehicle) =>
        vehicle.ownerId === user.id ? { ...vehicle, status: 'verified' } : vehicle,
      );
    }
    this.pushAdminNotification(user, 'ID verification approved', `${user.name} is now verified for app usage.`);
    this.presentToast(`${user.name} verified`);
    this.syncAdminUser(user);
  }

  requestAdminUserReupload(user: AdminUser) {
    user.verification = 'reupload';
    user.documents = user.documents?.map((document) =>
      document.status === 'verified' ? document : { ...document, status: 'reupload' },
    );
    if (user.role === 'owner') {
      this.adminVehicleCases = this.adminVehicleCases.map((vehicle) =>
        vehicle.ownerId === user.id && vehicle.status !== 'verified' ? { ...vehicle, status: 'reupload' } : vehicle,
      );
    }
    this.pushAdminNotification(user, 'Document reupload required', `${user.name} must reupload verification documents.`);
    this.presentToast(`Reupload requested from ${user.name}`);
    this.syncAdminUser(user);
  }

  rejectAdminUser(user: AdminUser) {
    user.verification = 'rejected';
    user.documents = user.documents?.map((document) => ({ ...document, status: 'rejected' }));
    if (user.role === 'owner') {
      this.adminVehicleCases = this.adminVehicleCases.map((vehicle) =>
        vehicle.ownerId === user.id ? { ...vehicle, status: 'rejected' } : vehicle,
      );
    }
    this.pushAdminNotification(user, 'Verification rejected', `${user.name}'s documents were rejected by admin review.`);
    this.presentToast(`${user.name} verification rejected`);
    this.syncAdminUser(user);
  }

  blockAdminUser(user: AdminUser) {
    user.status = 'blocked';
    this.pushAdminNotification(user, 'Account blocked', `${user.name} was blocked by admin security review.`);
    this.presentToast(`${user.name} blocked`);
    this.syncAdminUser(user);
  }

  sendAdminWarning(user: AdminUser) {
    user.warningCount = Math.min(2, user.warningCount + 1);
    user.status = user.warningCount >= 2 ? 'blocked' : 'warning';
    this.pushAdminNotification(
      user,
      user.warningCount >= 2 ? 'Second warning issued' : 'Warning issued',
      user.warningCount >= 2
        ? `${user.name} received 2 warnings and is blocked until review.`
        : `${user.name} received warning ${user.warningCount}/2 for policy review.`,
    );
    this.presentToast(user.warningCount >= 2 ? `${user.name} blocked after 2 warnings` : `Warning sent to ${user.name}`);
    this.syncAdminUser(user);
  }

  adjustAdminBalance(user: AdminUser, amount: number) {
    user.balance += amount;
    this.adminTransactions = [
      {
        id: Date.now(),
        user: user.name,
        role: user.role === 'owner' ? 'Owner' : 'Passenger',
        title: amount > 0 ? 'Manual admin credit' : 'Manual admin debit',
        amount,
        status: amount > 0 ? 'Credited' : 'Adjusted',
      },
      ...this.adminTransactions,
    ];
    this.adminWalletTransactions = [
      {
        id: Date.now() + 1,
        user: user.name,
        role: user.role === 'owner' ? 'Owner' : 'Passenger',
        title: amount > 0 ? 'Manual admin wallet deposit' : 'Manual admin wallet withdraw',
        amount,
        status: amount > 0 ? 'Credited' : 'Paid',
        type: amount > 0 ? 'Deposit' : 'Withdraw',
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        method: 'Admin action',
        reference: `ADM-${Date.now()}`,
      },
      ...this.adminWalletTransactions,
    ];
    this.presentToast(`${user.name} balance updated`);
    this.syncAdminUser(user);
  }

  approveAdminVehicle(vehicle: AdminVehicleCase) {
    vehicle.status = 'verified';
    vehicle.documentItems = vehicle.documentItems?.map((document) => ({ ...document, status: 'verified' }));
    const ownerVehicle = this.vehicles.find((item) => item.plateNumber === vehicle.plate);
    if (ownerVehicle) ownerVehicle.status = 'verified';
    this.notificationCenter = [
      {
        type: 'Vehicle verification',
        title: 'Vehicle verified',
        message: `${vehicle.vehicle} is approved for public ride publishing.`,
        time: 'Now',
        unread: true,
        icon: 'car-outline',
      },
      ...this.notificationCenter,
    ];
    this.unreadCount += 1;
    this.saveRealtimeState();
    this.presentToast(`${vehicle.vehicle} verified`);
    this.http.patch(`${this.apiUrl}/admin/vehicles/${vehicle.id}/verification`, { status: 'verified' }).subscribe({ error: () => undefined });
  }

  requestVehicleReupload(vehicle: AdminVehicleCase) {
    vehicle.status = 'reupload';
    vehicle.documentItems = vehicle.documentItems?.map((document) =>
      document.status === 'verified' ? document : { ...document, status: 'reupload' },
    );
    this.notificationCenter = [
      {
        type: 'Vehicle verification',
        title: 'Vehicle reupload required',
        message: `${vehicle.owner} must reupload documents for ${vehicle.vehicle}.`,
        time: 'Now',
        unread: true,
        icon: 'cloud-upload-outline',
      },
      ...this.notificationCenter,
    ];
    this.unreadCount += 1;
    this.saveRealtimeState();
    this.presentToast('Reupload request sent');
    this.http.patch(`${this.apiUrl}/admin/vehicles/${vehicle.id}/verification`, { status: 'reupload' }).subscribe({ error: () => undefined });
  }

  deleteAdminTour(tour: AdminTour) {
    if (!window.confirm(`Archive ${tour.route}?`)) return;
    this.adminTours = this.adminTours.filter((item) => item.id !== tour.id);
    this.presentToast('Tour archived');
  }

  private pushAdminNotification(user: AdminUser, title: string, message: string) {
    this.notificationCenter = [
      {
        type: 'Admin CRM',
        title,
        message,
        time: 'Now',
        unread: true,
        icon: user.role === 'owner' ? 'car-outline' : 'person-circle-outline',
      },
      ...this.notificationCenter,
    ];
    this.unreadCount += 1;
    this.saveRealtimeState();
  }

  private syncAdminUser(user: AdminUser) {
    this.http
      .patch(`${this.apiUrl}/admin/users/${user.id}`, {
        status: user.status === 'blocked' ? 'suspended' : 'active',
        verification_status: user.verification,
        passenger_verification_status: user.verification,
        wallet_balance: user.balance,
        warning_count: user.warningCount,
      })
      .subscribe({ error: () => undefined });
  }

  cancelManagedRide() {
    this.presentToast('Ride cancellation flow opened');
  }

  rateRide() {
    this.presentToast('Rating screen opened');
  }

  onLocationFocus(field: LocationField) {
    this.activeLocationField = field;
    this.onLocationInput(field);
  }

  onLocationInput(field: LocationField) {
    const query = this.search[field].trim();
    this.activeLocationField = field;
    this.locationError[field] = '';

    if (this.locationTimers[field]) {
      clearTimeout(this.locationTimers[field]);
    }

    if (query.length < 2) {
      this.locationLoading[field] = false;
      this.locationSuggestions[field] = this.getPopularLocationSuggestions(query);
      return;
    }

    this.locationLoading[field] = true;
    this.locationTimers[field] = setTimeout(() => this.lookupLocations(field, query), 260);
  }

  selectLocation(field: LocationField, suggestion: LocationSuggestion) {
    this.search[field] = suggestion.title;
    if (field === 'from') {
      this.search.fromLat = suggestion.lat || this.search.fromLat;
      this.search.fromLng = suggestion.lng || this.search.fromLng;
    } else {
      this.search.toLat = suggestion.lat || this.search.toLat;
      this.search.toLng = suggestion.lng || this.search.toLng;
    }
    this.activeLocationField = null;
    this.locationError[field] = '';
    this.locationSuggestions[field] = [];
    this.presentToast(`${field === 'from' ? 'Pickup' : 'Drop'} set to ${suggestion.title}`);
  }

  openSearchDatePicker() {
    this.datePickerOpen = true;
  }

  onSearchDateChange(event?: CustomEvent) {
    const selectedValue = event?.detail?.value;
    const nextDate = Array.isArray(selectedValue) ? selectedValue[0] : selectedValue;
    if (typeof nextDate === 'string' && nextDate.length >= 10) {
      this.search.dateValue = nextDate.slice(0, 10);
    }
    this.search.date = this.formatSearchDateLabel(this.search.dateValue);
  }

  get minSearchDate() {
    return this.toDateInputValue(new Date());
  }

  closeLocationDropdown(field: LocationField) {
    setTimeout(() => {
      if (this.activeLocationField === field) {
        this.activeLocationField = null;
      }
    }, 160);
  }

  private lookupLocations(field: LocationField, query: string) {
    this.http
      .get<Array<Record<string, unknown>>>('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'jsonv2',
          addressdetails: '1',
          limit: '7',
        },
      })
      .subscribe({
        next: (places) => {
          this.locationLoading[field] = false;
          const mappedPlaces = places.map((place, index) => this.mapLocationSuggestion(place, index));
          this.locationSuggestions[field] = this.mergeLocationSuggestions(mappedPlaces, query);
          this.locationError[field] = '';
        },
        error: () => {
          this.locationLoading[field] = false;
          this.locationSuggestions[field] = this.getPopularLocationSuggestions(query);
          this.locationError[field] = 'Map lookup unavailable. You can still use the typed location.';
        },
      });
  }

  private mapLocationSuggestion(place: Record<string, unknown>, index: number): LocationSuggestion {
    const displayName = String(place['display_name'] || '');
    const parts = displayName.split(',').map((part) => part.trim()).filter(Boolean);
    const address = (place['address'] || {}) as Record<string, unknown>;
    const title =
      String(place['name'] || '') ||
      String(address['road'] || '') ||
      String(address['suburb'] || '') ||
      String(address['city'] || '') ||
      parts[0] ||
      'Selected location';
    const subtitleParts = [
      address['neighbourhood'],
      address['suburb'],
      address['city'] || address['town'] || address['village'],
      address['state'],
      address['country'],
    ]
      .map((part) => String(part || '').trim())
      .filter(Boolean);
    return {
      id: String(place['place_id'] || `map-${index}`),
      title,
      subtitle: subtitleParts.join(', ') || parts.slice(1, 4).join(', ') || displayName,
      lat: Number(place['lat']),
      lng: Number(place['lon']),
      source: 'map',
    };
  }

  private getPopularLocationSuggestions(query: string): LocationSuggestion[] {
    const normalizedQuery = query.trim().toLowerCase();
    const recentLocations: LocationSuggestion[] = [];
    this.recentSearches.forEach((recent, index) => {
      recentLocations.push(
        {
          id: `recent-from-${index}`,
          title: recent.from,
          subtitle: `Recent pickup · ${recent.to}`,
          source: 'recent',
        },
        {
          id: `recent-to-${index}`,
          title: recent.to,
          subtitle: `Recent drop · ${recent.from}`,
          source: 'recent',
        },
      );
    });

    const typedLocation: LocationSuggestion[] = normalizedQuery.length >= 2
      ? [
          {
            id: `typed-${normalizedQuery}`,
            title: query.trim(),
            subtitle: 'Use this exact lane, road, area, or city',
            source: 'typed',
          },
        ]
      : [];

    return [...typedLocation, ...recentLocations, ...this.popularLocations]
      .filter((location, index, locations) => {
        const isDuplicate =
          locations.findIndex((item) => item.title.toLowerCase() === location.title.toLowerCase()) !== index;
        const matchesQuery =
          location.source === 'typed' ||
          !normalizedQuery ||
          location.title.toLowerCase().includes(normalizedQuery) ||
          location.subtitle.toLowerCase().includes(normalizedQuery);
        return matchesQuery && !isDuplicate;
      })
      .slice(0, 6);
  }

  private mergeLocationSuggestions(mapLocations: LocationSuggestion[], query: string): LocationSuggestion[] {
    const typedAndSaved = this.getPopularLocationSuggestions(query);
    return [...mapLocations, ...typedAndSaved]
      .filter((location, index, locations) => {
        const title = location.title.toLowerCase();
        return locations.findIndex((item) => item.title.toLowerCase() === title) === index;
      })
      .slice(0, 6);
  }

  private buildRouteMapUrl(pickup: string, drop: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://maps.google.com/maps?output=embed&saddr=${encodeURIComponent(pickup)}&daddr=${encodeURIComponent(drop)}&dirflg=d`,
    );
  }

  get mapFallbackUrl() {
    const routeQuery = encodeURIComponent(`${this.selectedRide.pickup} to ${this.selectedRide.drop}`);
    return `https://www.google.com/maps/search/?api=1&query=${routeQuery}`;
  }

  private buildNearbyRideResults(): RideSearchResult[] {
    const from = this.formatLocationLabel(this.search.from);
    const to = this.formatLocationLabel(this.search.to);
    const baseRides = [
      {
        ...this.resultRides[1],
        route: `${from} to ${to}`,
        pickup: `${from}, nearest main road pickup`,
        drop: `${to}, central drop point`,
        liveLocation: `${from}, nearby approach road`,
        liveStatus: 'Booked ride · live driver location shared',
        lastLocationUpdate: 'Updated just now',
        departure: '07:20',
        arrival: '09:55',
        price: 'INR 360',
        priceValue: 360,
        seats: 0,
        totalSeats: 3,
        bookedSeats: 3,
        status: 'Full booked' as const,
        passengers: ['Dev Patel', 'Amina Khan', 'Joel Mathew'],
      },
      {
        ...this.resultRides[0],
        route: `${from} to ${to}`,
        pickup: `${from}, Gate 2 / landmark pickup`,
        drop: `${to}, requested destination side`,
        liveLocation: `${from}, 600 m from pickup`,
        liveStatus: 'Driver moving toward pickup',
        lastLocationUpdate: 'Updated just now',
        departure: '08:30',
        arrival: '11:05',
        price: 'INR 420',
        priceValue: 420,
        seats: 3,
        totalSeats: 4,
        bookedSeats: 1,
        status: 'Available' as const,
        passengers: ['Riya Sharma'],
      },
      {
        ...this.resultRides[2],
        route: `${from} to ${to}`,
        pickup: `${from}, service road pickup`,
        drop: `${to}, nearby lane drop`,
        liveLocation: `${from}, near service road`,
        liveStatus: 'Driver waiting near pickup',
        lastLocationUpdate: 'Updated 2 min ago',
        departure: '13:00',
        arrival: '15:35',
        price: 'INR 390',
        priceValue: 390,
        seats: 1,
        totalSeats: 4,
        bookedSeats: 3,
        status: 'Available' as const,
        passengers: ['Meera Iyer', 'Sahil Jain', 'Anu George'],
      },
    ];

    return baseRides.sort((firstRide, secondRide) => {
      if (firstRide.status !== secondRide.status) {
        return firstRide.status === 'Full booked' ? -1 : 1;
      }

      return firstRide.departure.localeCompare(secondRide.departure);
    });
  }

  private formatLocationLabel(location: string) {
    const cleaned = location.trim().replace(/\s+/g, ' ');
    return cleaned || 'Selected location';
  }

  private formatSearchDateLabel(dateValue: string) {
    const selectedDate = new Date(`${dateValue}T00:00:00`);
    const today = new Date();
    const tomorrow = new Date();
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(today.getDate() + 1);

    if (selectedDate.getTime() === today.getTime()) {
      return 'Today';
    }

    if (selectedDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }

    return selectedDate.toLocaleDateString([], {
      day: 'numeric',
      month: 'short',
      year: selectedDate.getFullYear() === today.getFullYear() ? undefined : 'numeric',
    });
  }

  private toDateInputValue(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async searchRides() {
    this.searchState = 'loading';
    this.appLoading = true;
    await this.presentToast('Searching verified rides near you');
    if (!this.search.from || !this.search.to || this.search.seats < 1) {
      this.searchState = 'error';
      this.appLoading = false;
      this.presentToast('Enter route and passengers');
      return;
    }

    const nearbyResults = this.buildNearbyRideResults();
    this.resultRides = nearbyResults;

    this.api
      .getRides({
        origin: this.search.from,
        destination: this.search.to,
        originLat: this.search.fromLat,
        originLng: this.search.fromLng,
        destinationLat: this.search.toLat,
        destinationLng: this.search.toLng,
        date: this.search.dateValue,
        instant: this.filters.find((filter) => filter.key === 'instant')?.active,
        verified: this.filters.find((filter) => filter.key === 'verified')?.active,
      })
      .subscribe({
        next: (response) => {
          this.searchState = 'ready';
          this.appLoading = false;
          if (response.data.length) {
            const backendRides = response.data.map((ride: any, index: number) => {
              const templateRide = nearbyResults[index % nearbyResults.length];
              const availableSeats = Number(ride.seats_available ?? templateRide.seats);
              const totalSeats = Number(ride.total_seats ?? templateRide.totalSeats);
              return {
                ...templateRide,
                id: ride.ride_id,
                driverId: ride.driver_id,
                departure: ride.departure_at
                  ? new Date(ride.departure_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : templateRide.departure,
                route: `${this.search.from} to ${this.search.to}`,
                price: `INR ${ride.price_per_seat || templateRide.priceValue}`,
                priceValue: Number(ride.price_per_seat || templateRide.priceValue),
                seats: availableSeats,
                totalSeats,
                bookedSeats: Math.max(0, totalSeats - availableSeats),
                status: (availableSeats < 1 ? 'Full booked' : 'Available') as RideSearchResult['status'],
                instant: Boolean(ride.instant_booking ?? templateRide.instant),
                pickup: templateRide.pickup,
                drop: templateRide.drop,
              };
            }).sort((firstRide, secondRide) => {
              if (firstRide.status !== secondRide.status) {
                return firstRide.status === 'Full booked' ? -1 : 1;
              }

              return firstRide.departure.localeCompare(secondRide.departure);
            });
            this.resultRides = backendRides.length >= 3 ? backendRides : nearbyResults;
          }
          this.goTo('/results');
        },
        error: () => {
          this.appLoading = false;
          this.searchState = this.search.to.toLowerCase().includes('nowhere') ? 'empty' : 'ready';
          if (this.searchState === 'ready') {
            this.goTo('/results');
          }
        },
      });
  }

  retrySearch() {
    this.search.to = 'Mysuru';
    this.searchRides();
  }

  increasePassengers() {
    this.search.seats = Math.min(6, this.search.seats + 1);
  }

  decreasePassengers() {
    this.search.seats = Math.max(1, this.search.seats - 1);
  }

  applyRecentSearch(recent: { from: string; to: string; date: string; passengers: number }) {
    this.search = {
      from: recent.from,
      to: recent.to,
      date: recent.date,
      dateValue: this.search.dateValue,
      seats: recent.passengers,
      fromLat: this.search.fromLat,
      fromLng: this.search.fromLng,
      toLat: this.search.toLat,
      toLng: this.search.toLng,
    };
    this.searchRides();
  }

  clearRecentSearches() {
    this.recentSearches = [];
    this.presentToast('Recent searches cleared');
  }

  private navLabel(tab: 'search' | 'publish' | 'yourRides' | 'inbox' | 'profile') {
    const labels = {
      search: 'Search',
      publish: 'Publish',
      yourRides: 'Your Rides',
      inbox: 'Inbox',
      profile: 'Profile',
    };

    return labels[tab];
  }

  publishRide() {
    this.publishStep = this.publishStep === 4 ? 1 : this.publishStep + 1;
    this.presentToast(this.publishStep === 1 ? 'Ride draft published' : `Step ${this.publishStep} ready`);
  }

  toggleDarkMode() {
    this.isDark = !this.isDark;
    document.body.classList.toggle('dark', this.isDark);
    document.body.classList.toggle('ion-palette-dark', this.isDark);
  }

  async simulateBackendFlow() {
    await this.presentToast('Backend flow queued: FCM/APNs payload prepared');
    this.status = 'Backend notification flow simulated.';
  }

  closeSuccess() {
    this.showSuccess = false;
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 1800,
      position: 'top',
      color: 'primary',
    });
    await toast.present();
  }

  async enableNotifications() {
    if (!Capacitor.isNativePlatform()) {
      this.status = 'Push registration needs a native Android or iOS build.';
      this.presentToast('Native Android/iOS build required for push tokens');
      return;
    }

    this.status = 'Requesting notification permissions...';

    const localPermission = await LocalNotifications.requestPermissions();
    if (localPermission.display !== 'granted') {
      this.status = 'Local notification permission was not granted.';
      return;
    }

    const pushPermission = await PushNotifications.requestPermissions();
    if (pushPermission.receive !== 'granted') {
      this.status = 'Push notification permission was not granted.';
      return;
    }

    await this.bindPushListeners();
    await PushNotifications.register();
    this.status = 'Push registration requested. Waiting for device token...';
  }

  async sendLocalTest() {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now() % 100000,
          title: 'Local notification works',
          body: 'This was scheduled inside the Ionic app.',
          schedule: { at: new Date(Date.now() + 1000) },
        },
      ],
    });
    this.status = 'Local notification scheduled.';
  }

  async registerToken(token: string) {
    const payload = {
      token,
      platform: this.platform,
      deviceName: this.deviceName,
    };

    this.http.post(`${this.apiUrl}/devices`, payload).subscribe({
      next: () => {
        this.status = 'Device token saved in backend.';
      },
      error: (error) => {
        this.status = `Token received, backend save failed: ${error.message}`;
      },
    });
  }

  sendBackendTest() {
    if (!this.token) {
      this.status = 'Register for push first so the backend has a token.';
      return;
    }

    this.http
      .post(`${this.apiUrl}/notifications/test`, {
        token: this.token,
        platform: this.platform,
        title: 'Backend push works',
        body: 'This push was sent by the Node.js API.',
      })
      .subscribe({
        next: () => {
          this.status = 'Backend push request sent.';
        },
        error: (error) => {
          this.status = `Backend push failed: ${error.message}`;
        },
      });
  }

  private async bindPushListeners() {
    await PushNotifications.removeAllListeners();

    await PushNotifications.addListener('registration', (token: Token) => {
      this.token = token.value;
      this.status = 'Device token received.';
      this.registerToken(token.value);
    });

    await PushNotifications.addListener('registrationError', (error) => {
      this.status = `Push registration failed: ${JSON.stringify(error)}`;
    });

    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        this.lastNotification = notification.title || notification.body || 'Push received';
      },
    );

    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        this.lastNotification = `Opened: ${action.notification.title || action.notification.body || 'notification'}`;
      },
    );
  }

}
