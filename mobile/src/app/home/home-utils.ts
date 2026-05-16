export function buildReferralCode(name: string, phone: string) {
  const initials = String(name || 'RS')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  const digits = String(phone || '').replace(/\D/g, '').slice(-4).padStart(4, '0');
  return `${initials || 'RS'}${digits}`;
}

export function normalizeReferralCode(value: string) {
  return String(value || '').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 12);
}

export function calculateAgeFromBirthDate(value: string) {
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

export function mapAdminUserStatus(status: string, warningCount: number): 'active' | 'blocked' | 'warning' {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'suspended' || normalized === 'blocked' || normalized === 'inactive') return 'blocked';
  if (warningCount > 0) return 'warning';
  return 'active';
}

export function mapVerificationStatus(status: string): 'pending' | 'verified' | 'reupload' | 'rejected' {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'verified') return 'verified';
  if (normalized === 'reupload') return 'reupload';
  if (normalized === 'rejected') return 'rejected';
  return 'pending';
}

export function mapAdminLogType(value: string): 'Passenger' | 'Owner' | 'Ride' | 'Security' | 'Ads' {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('passenger')) return 'Passenger';
  if (normalized.includes('ride')) return 'Ride';
  if (normalized.includes('security')) return 'Security';
  if (normalized.includes('ads')) return 'Ads';
  return 'Owner';
}

export function mapAdminLogPriority(action: string, newValues: any): 'active' | 'pending' | 'warning' | 'blocked' {
  const text = `${action || ''} ${JSON.stringify(newValues || {})}`.toLowerCase();
  if (text.includes('rejected') || text.includes('blocked') || text.includes('suspended')) return 'blocked';
  if (text.includes('pending') || text.includes('reupload')) return 'pending';
  if (text.includes('warning') || text.includes('failed')) return 'warning';
  return 'active';
}

export function adminLogIcon(type: 'Passenger' | 'Owner' | 'Ride' | 'Security' | 'Ads') {
  const iconByType: Record<'Passenger' | 'Owner' | 'Ride' | 'Security' | 'Ads', string> = {
    Passenger: 'person-circle-outline',
    Owner: 'car-outline',
    Ride: 'map-outline',
    Security: 'lock-closed-outline',
    Ads: 'notifications-outline',
  };
  return iconByType[type];
}

export function adminRoleLabel(role: string) {
  if (role === 'driver') return 'Owner';
  if (role === 'admin') return 'Admin';
  return 'Passenger';
}

export function mapAdStatus(status: string): 'active' | 'disabled' | 'expired' {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'expired') return 'expired';
  if (normalized === 'disabled') return 'disabled';
  return 'active';
}

export function mapInvoiceStatus(status: string): 'Pending' | 'Paid' | 'Failed' | 'Refunded' | 'Partial Payment' {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'paid') return 'Paid';
  if (normalized === 'failed') return 'Failed';
  if (normalized === 'refunded') return 'Refunded';
  if (normalized === 'partial_payment') return 'Partial Payment';
  return 'Pending';
}

export function formatPriorityLabel(priority: string): 'High' | 'Medium' | 'Low' {
  const normalized = String(priority || '').toLowerCase();
  if (normalized === 'high') return 'High';
  if (normalized === 'low') return 'Low';
  return 'Medium';
}

export function formatAdminLabel(value: string) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatAdminDate(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatAdminTime(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function formatAdminDateTime(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPaymentStatus(status: string) {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return 'Pending';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatPaymentTimestamp(value: string) {
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

export function buildPaymentTransactionId(payment: any) {
  const backendId = String(payment.transaction_id || '').replace(/\D/g, '');
  if (backendId) {
    return backendId.slice(-10).padStart(10, '0');
  }
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

export function buildTimestampTransactionId(value: string) {
  const date = new Date(value);
  const millis = Number.isNaN(date.getTime()) ? Date.now() : date.getTime();
  return String(millis).slice(-10);
}

export function normalizedVehicleStatus(vehicle: {
  status?: string;
  rcDocumentUrl?: string;
  frontPhotoUrl?: string;
  backPhotoUrl?: string;
}) {
  const status = String(vehicle.status || 'pending');
  const hasMandatoryImages = Boolean(vehicle.rcDocumentUrl && vehicle.frontPhotoUrl && vehicle.backPhotoUrl);
  if (status.toLowerCase() === 'verified' && !hasMandatoryImages) {
    return 'reupload';
  }

  return status;
}

export function mapAdminUser(args: {
  user: any;
  role: 'owner' | 'passenger';
  rides: any[];
  bookings: any[];
  mapAdminUserDocuments: (user: any, role: 'owner' | 'passenger') => any[];
}) {
  const { user, role, rides, bookings, mapAdminUserDocuments } = args;
  const rideCount =
    role === 'owner'
      ? rides.filter((ride: any) => Number(ride.driver_id) === Number(user.user_id)).length
      : bookings.filter((booking: any) => Number(booking.passenger_id) === Number(user.user_id)).length;

  return {
    id: Number(user.user_id),
    name: user.full_name || 'User',
    role,
    photo: user.photo_url || '',
    phone: user.phone || '',
    email: user.email || '',
    status: mapAdminUserStatus(user.status, Number(user.warning_count || 0)),
    verification: mapVerificationStatus(role === 'owner' ? user.verification_status : user.passenger_verification_status),
    rides: rideCount,
    balance: Number(user.wallet_balance || 0),
    warningCount: Number(user.warning_count || 0),
    govIdNumber: user.gov_id_number || '',
    documents: mapAdminUserDocuments(user, role),
  };
}

export function mapAdminUserDocuments(user: any, role: 'owner' | 'passenger') {
  const status = mapVerificationStatus(role === 'owner' ? user.verification_status : user.passenger_verification_status);
  return [
    {
      label: role === 'owner' ? 'Owner Gov ID front' : 'Passenger Gov ID front',
      value: user.gov_id_front_url ? 'Uploaded' : 'Not uploaded',
      status,
      previewUrl: user.gov_id_front_url || undefined,
    },
    {
      label: role === 'owner' ? 'Owner Gov ID back' : 'Passenger Gov ID back',
      value: user.gov_id_back_url ? 'Uploaded' : 'Not uploaded',
      status,
      previewUrl: user.gov_id_back_url || undefined,
    },
  ];
}

export function mapAdminVehicle(vehicle: any, users: any[]) {
  const owner = users.find((user: any) => Number(user.user_id) === Number(vehicle.owner_id));
  const status = mapVerificationStatus(vehicle.status);
  return {
    id: Number(vehicle.vehicle_id),
    ownerId: Number(vehicle.owner_id),
    owner: owner?.full_name || 'Owner',
    vehicle: `${vehicle.make || ''} ${vehicle.model || ''}`.trim(),
    plate: vehicle.plate_number || '',
    documents: [vehicle.rc_document_url, vehicle.front_photo_url, vehicle.back_photo_url].filter(Boolean).length
      ? 'Uploaded documents available'
      : 'Documents pending',
    status,
    color: vehicle.color || '',
    seats: Number(vehicle.seats || 4),
    documentItems: [
      { label: 'RC book', value: vehicle.plate_number || 'Not uploaded', status, previewUrl: vehicle.rc_document_url || undefined },
      { label: 'Vehicle front photo', value: vehicle.front_photo_url ? 'Uploaded' : 'Not uploaded', status, previewUrl: vehicle.front_photo_url || undefined },
      { label: 'Vehicle back photo', value: vehicle.back_photo_url ? 'Uploaded' : 'Not uploaded', status, previewUrl: vehicle.back_photo_url || undefined },
      { label: 'Insurance', value: vehicle.insurance_document_url ? 'Uploaded' : 'Not uploaded', status, previewUrl: vehicle.insurance_document_url || undefined },
    ],
  };
}

export function mapAdminTours(rides: any[], bookings: any[], users: any[], vehicles: any[]) {
  const driverTours = rides.map((ride: any) => {
    const owner = users.find((user: any) => Number(user.user_id) === Number(ride.driver_id));
    const vehicle = vehicles.find((item: any) => Number(item.vehicle_id) === Number(ride.vehicle_id));
    return {
      id: Number(ride.ride_id),
      type: 'Vehicle tour' as const,
      route: `${ride.origin || ''} to ${ride.destination || ''}`.trim(),
      user: owner?.full_name || 'Owner',
      vehicle: `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim() || 'Vehicle',
      status: formatAdminLabel(ride.status || 'published'),
      amount: Number(ride.price_per_seat || 0) * Math.max(1, Number(ride.total_seats || 1)),
    };
  });
  const passengerTours = bookings.map((booking: any) => {
    const passenger = users.find((user: any) => Number(user.user_id) === Number(booking.passenger_id));
    const ride = rides.find((item: any) => Number(item.ride_id) === Number(booking.ride_id));
    const vehicle = vehicles.find((item: any) => Number(item.vehicle_id) === Number(ride?.vehicle_id));
    return {
      id: Number(`9${booking.booking_id}`),
      type: 'Passenger tour' as const,
      route: `${ride?.origin || ''} to ${ride?.destination || ''}`.trim(),
      user: passenger?.full_name || 'Passenger',
      vehicle: `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim() || 'Vehicle',
      status: formatAdminLabel(booking.status || 'requested'),
      amount: Number(booking.amount || ride?.price_per_seat || 0) * Math.max(1, Number(booking.seats_booked || 1)),
    };
  });
  return [...driverTours, ...passengerTours].sort((first, second) => second.id - first.id);
}

export function mapAdminTransactions(transactions: any[], users: any[], rides: any[]) {
  return transactions.map((item: any, index: number) => {
    if (item.source === 'payment') {
      const user = users.find((entry: any) => Number(entry.user_id) === Number(item.payer_id));
      return {
        id: Number(item.payment_id || index + 1),
        user: user?.full_name || 'User',
        role: adminRoleLabel(user?.role),
        title: item.provider === 'razorpay' ? 'Wallet top-up' : 'Payment transaction',
        amount: Number(item.amount || 0),
        status: formatAdminLabel(item.status || 'pending'),
      };
    }
    const bookingUser = users.find((entry: any) => Number(entry.user_id) === Number(item.passenger_id));
    const ride = rides.find((entry: any) => Number(entry.ride_id) === Number(item.ride_id));
    return {
      id: Number(item.booking_id || index + 1),
      user: bookingUser?.full_name || 'Passenger',
      role: adminRoleLabel(bookingUser?.role),
      title: `${formatAdminLabel(item.status || 'requested')} booking`,
      amount: Number(item.amount || ride?.price_per_seat || 0) * Math.max(1, Number(item.seats_booked || 1)),
      status: formatAdminLabel(item.status || 'requested'),
    };
  });
}

export function mapAdminWalletTransactions(payments: any[], users: any[]) {
  return payments
    .map((payment: any) => {
      const user = users.find((entry: any) => Number(entry.user_id) === Number(payment.payer_id));
      const status = formatAdminLabel(payment.status || 'pending');
      const amount = String(payment.status || '').toLowerCase() === 'paid' ? Number(payment.amount || 0) : 0;
      const type: 'Deposit' | 'Failed' | 'Adjustment' =
        amount > 0 ? 'Deposit' : status === 'Failed' ? 'Failed' : 'Adjustment';
      return {
        id: Number(payment.payment_id || Date.now()),
        user: user?.full_name || 'User',
        role: adminRoleLabel(user?.role),
        title: payment.provider === 'razorpay' ? 'Wallet money added' : 'Wallet transaction',
        amount,
        status,
        type,
        date: formatAdminDate(payment.updated_at || payment.created_at),
        time: formatAdminTime(payment.updated_at || payment.created_at),
        method: payment.provider || 'Wallet',
        reference: buildPaymentTransactionId(payment),
      };
    })
    .sort((first, second) => second.id - first.id);
}

export function mapAdminLogs(logs: any[], currentUserId?: number) {
  return logs.map((log: any) => {
    const type = mapAdminLogType(log.activity_type);
    return {
      id: Number(log.log_id),
      type,
      action: log.action || formatAdminLabel(log.activity_type || 'activity'),
      actor: Number(log.actor_user_id) === Number(currentUserId) ? 'Admin' : `User #${log.actor_user_id || ''}`.trim(),
      target: [log.target_type, log.target_id].filter(Boolean).join(' '),
      priority: mapAdminLogPriority(log.action, log.new_values),
      icon: adminLogIcon(type),
      createdAt: formatAdminDateTime(log.created_at),
    };
  });
}

export function mapAdPartner(partner: any) {
  return {
    id: Number(partner.partner_id),
    partnerName: partner.partner_name || 'Partner',
    companyName: partner.company_name || '',
    contactPerson: partner.contact_person || '',
    mobile: partner.mobile || '',
    email: partner.email || '',
    address: partner.address || '',
    gstNumber: partner.gst_number || '',
    type: formatAdminLabel(partner.partner_type || 'partner'),
    priority: formatPriorityLabel(partner.priority),
    status: (String(partner.status || 'active').toLowerCase() === 'active' ? 'active' : 'disabled') as 'active' | 'disabled',
    startDate: partner.agreement_start || partner.start_date || '',
    endDate: partner.agreement_end || partner.end_date || '',
  };
}

export function mapAdminAd(ad: any, partners: any[]) {
  const partner = partners.find((entry: any) => Number(entry.partner_id) === Number(ad.partner_id));
  const impressions = Number(ad.impressions || 0);
  const clicks = Number(ad.clicks || 0);
  return {
    id: Number(ad.ad_id),
    name: ad.ad_name || 'Ad',
    type: formatAdminLabel(ad.ad_type || 'banner'),
    partner: partner?.partner_name || 'Partner',
    size: ad.size || '',
    placement: formatAdminLabel(ad.placement || 'search'),
    area: ad.area || 'All India',
    state: ad.state || 'All India',
    startDate: ad.start_date || '',
    endDate: ad.end_date || '',
    impressions,
    clicks,
    ctr: impressions ? Number(((clicks / impressions) * 100).toFixed(1)) : 0,
    status: mapAdStatus(ad.status),
  };
}

export function mapAdInvoice(invoice: any, ads: any[], partners: any[]) {
  const ad = ads.find((entry: any) => Number(entry.ad_id) === Number(invoice.ad_id));
  const partner = partners.find((entry: any) => Number(entry.partner_id) === Number(invoice.partner_id));
  return {
    invoiceNumber: invoice.invoice_number || '',
    partnerName: partner?.partner_name || 'Partner',
    adName: ad?.ad_name || 'Ad',
    placement: formatAdminLabel(ad?.placement || 'search'),
    runningDays: Number(invoice.running_days || 0),
    baseAmount: Number(invoice.base_amount || 0),
    gst: Number(invoice.gst_amount || 0),
    finalAmount: Number(invoice.final_amount || 0),
    paymentStatus: mapInvoiceStatus(invoice.payment_status),
    paymentMode: formatAdminLabel(invoice.payment_mode || 'wallet'),
    transactionRef: invoice.transaction_reference || 'Awaiting',
  };
}

export function mapAdHistory(logs: any[], ads: any[], currentUserId?: number) {
  return logs
    .filter((log: any) => String(log.activity_type || '').toLowerCase() === 'ads')
    .map((log: any) => {
      const ad = ads.find((entry: any) => Number(entry.ad_id) === Number(log.target_id));
      return {
        id: Number(log.log_id),
        adName: ad?.ad_name || `Ad #${log.target_id || ''}`.trim(),
        action: log.action || 'Updated',
        details: JSON.stringify(log.new_values || log.old_values || {}),
        adminUser: Number(log.actor_user_id) === Number(currentUserId) ? 'Admin' : `User #${log.actor_user_id || ''}`.trim(),
        createdAt: formatAdminDateTime(log.created_at),
      };
    });
}
