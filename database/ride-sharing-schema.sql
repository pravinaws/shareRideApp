CREATE DATABASE IF NOT EXISTS fastforward CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fastforward;

CREATE TABLE users (
  user_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  phone VARCHAR(30) UNIQUE,
  age TINYINT UNSIGNED,
  photo_url TEXT,
  bio TEXT,
  travel_preferences JSON,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  verification_status ENUM('pending','phone_verified','verified','rejected') NOT NULL DEFAULT 'pending',
  passenger_verification_status ENUM('pending','verified','rejected','reupload') NOT NULL DEFAULT 'pending',
  gov_id_number VARCHAR(80),
  gov_id_front_url TEXT,
  gov_id_back_url TEXT,
  wallet_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  warning_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
  role ENUM('passenger','driver','admin') NOT NULL DEFAULT 'passenger',
  status ENUM('active','suspended','closed') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_status (status),
  INDEX idx_users_role (role)
);

CREATE TABLE auth_otps (
  otp_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(30) NOT NULL,
  channel ENUM('whatsapp','sms') NOT NULL DEFAULT 'whatsapp',
  provider ENUM('twilio','local') NOT NULL DEFAULT 'twilio',
  provider_sid VARCHAR(80),
  status ENUM('pending','approved','expired','failed','max_attempts') NOT NULL DEFAULT 'pending',
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_auth_otps_phone_status (phone, status, created_at),
  INDEX idx_auth_otps_provider_sid (provider_sid)
);

CREATE TABLE vehicles (
  vehicle_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_id BIGINT UNSIGNED NOT NULL,
  make VARCHAR(80) NOT NULL,
  model VARCHAR(80) NOT NULL,
  color VARCHAR(40),
  plate_number VARCHAR(40) NOT NULL UNIQUE,
  seats TINYINT UNSIGNED NOT NULL,
  rc_document_url TEXT NOT NULL,
  insurance_document_url TEXT,
  front_photo_url TEXT NOT NULL,
  back_photo_url TEXT NOT NULL,
  status ENUM('pending','reupload','rejected','verified') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehicles_owner FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_vehicles_owner (owner_id)
);

CREATE TABLE rides (
  ride_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  driver_id BIGINT UNSIGNED NOT NULL,
  vehicle_id BIGINT UNSIGNED NOT NULL,
  origin VARCHAR(180) NOT NULL,
  destination VARCHAR(180) NOT NULL,
  pickup_point VARCHAR(220),
  drop_point VARCHAR(220),
  departure_at DATETIME NOT NULL,
  arrival_estimate_at DATETIME,
  price_per_seat DECIMAL(10,2) NOT NULL,
  total_seats TINYINT UNSIGNED NOT NULL,
  seats_available TINYINT UNSIGNED NOT NULL,
  instant_booking BOOLEAN NOT NULL DEFAULT FALSE,
  luggage_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  smoking_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  pets_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  music_preference VARCHAR(60),
  chat_preference VARCHAR(60),
  status ENUM('draft','published','full','started','completed','canceled','archived') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rides_driver FOREIGN KEY (driver_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_rides_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
  INDEX idx_rides_route_time (origin, destination, departure_at),
  INDEX idx_rides_driver_status (driver_id, status),
  INDEX idx_rides_status (status)
);

CREATE TABLE bookings (
  booking_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  ride_id BIGINT UNSIGNED NOT NULL,
  passenger_id BIGINT UNSIGNED NOT NULL,
  seats_booked TINYINT UNSIGNED NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status ENUM('requested','accepted','confirmed','canceled','completed','refunded') NOT NULL DEFAULT 'requested',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_ride FOREIGN KEY (ride_id) REFERENCES rides(ride_id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_passenger FOREIGN KEY (passenger_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE KEY uq_booking_passenger_ride (ride_id, passenger_id),
  INDEX idx_bookings_passenger_status (passenger_id, status),
  INDEX idx_bookings_ride_status (ride_id, status)
);

CREATE TABLE messages (
  message_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  ride_id BIGINT UNSIGNED NOT NULL,
  booking_id BIGINT UNSIGNED,
  sender_id BIGINT UNSIGNED NOT NULL,
  receiver_id BIGINT UNSIGNED NOT NULL,
  message TEXT NOT NULL,
  is_seen BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_ride FOREIGN KEY (ride_id) REFERENCES rides(ride_id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_messages_conversation (ride_id, sender_id, receiver_id, created_at),
  INDEX idx_messages_receiver_seen (receiver_id, is_seen)
);

CREATE TABLE notifications (
  notification_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type ENUM('ride_booked','ride_canceled','payment_success','refund_initiated','message_received','rating_reminder','driver_accepted','ride_reminder','payment_credited','low_rating_alert','new_passenger_booking','vehicle_verification','admin_warning') NOT NULL,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  metadata JSON,
  channel ENUM('in_app','push','email','sms','socket') NOT NULL DEFAULT 'in_app',
  priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_notifications_user_read (user_id, is_read, created_at),
  INDEX idx_notifications_type (type)
);

CREATE TABLE payments (
  payment_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL,
  payer_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  provider VARCHAR(60) NOT NULL,
  provider_reference VARCHAR(160),
  status ENUM('pending','authorized','paid','failed','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
  refund_status ENUM('none','initiated','processed','failed') NOT NULL DEFAULT 'none',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_payer FOREIGN KEY (payer_id) REFERENCES users(user_id),
  INDEX idx_payments_booking (booking_id),
  INDEX idx_payments_payer_status (payer_id, status)
);

CREATE TABLE reviews (
  review_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  ride_id BIGINT UNSIGNED NOT NULL,
  booking_id BIGINT UNSIGNED NOT NULL,
  reviewer_id BIGINT UNSIGNED NOT NULL,
  reviewee_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_ride FOREIGN KEY (ride_id) REFERENCES rides(ride_id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_reviewee FOREIGN KEY (reviewee_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CHECK (rating BETWEEN 1 AND 5),
  UNIQUE KEY uq_review_booking_reviewer (booking_id, reviewer_id),
  INDEX idx_reviews_reviewee (reviewee_id)
);

CREATE TABLE saved_passengers (
  saved_passenger_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  driver_id BIGINT UNSIGNED NOT NULL,
  passenger_id BIGINT UNSIGNED NOT NULL,
  note VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_saved_driver FOREIGN KEY (driver_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_passenger FOREIGN KEY (passenger_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE KEY uq_saved_driver_passenger (driver_id, passenger_id)
);

CREATE TABLE admin_activity_logs (
  log_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  actor_user_id BIGINT UNSIGNED,
  activity_type ENUM('Passenger','Owner','Ride','Security','Ads','Billing','Notification','Message') NOT NULL,
  action VARCHAR(160) NOT NULL,
  target_type VARCHAR(80) NOT NULL,
  target_id BIGINT UNSIGNED,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(80),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_logs_actor FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_admin_logs_type_time (activity_type, created_at),
  INDEX idx_admin_logs_target (target_type, target_id)
);

CREATE TABLE ad_partners (
  partner_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  partner_name VARCHAR(140) NOT NULL,
  company_name VARCHAR(180) NOT NULL,
  contact_person VARCHAR(140) NOT NULL,
  mobile VARCHAR(30) NOT NULL,
  email VARCHAR(180) NOT NULL,
  address TEXT,
  gst_number VARCHAR(30),
  partner_type ENUM('paid','free','script','internal') NOT NULL DEFAULT 'paid',
  priority ENUM('high','medium','low') NOT NULL DEFAULT 'medium',
  status ENUM('active','disabled','blocked') NOT NULL DEFAULT 'active',
  agreement_start DATE,
  agreement_end DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ad_partners_status_priority (status, priority)
);

CREATE TABLE ads (
  ad_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  partner_id BIGINT UNSIGNED NOT NULL,
  ad_name VARCHAR(180) NOT NULL,
  ad_type ENUM('banner','javascript','html','iframe','internal') NOT NULL,
  banner_url TEXT,
  redirect_url TEXT,
  script_content MEDIUMTEXT,
  placement ENUM('search','publish','your_rides','profile','dashboard','future') NOT NULL,
  area VARCHAR(120) DEFAULT 'All India',
  state VARCHAR(120) DEFAULT 'All India',
  size ENUM('300x250','320x50','320x100','320x180','300x600') NOT NULL,
  priority ENUM('high','medium','low') NOT NULL DEFAULT 'medium',
  device_type ENUM('android','ios','web','all') NOT NULL DEFAULT 'all',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('draft','active','disabled','expired','rejected') NOT NULL DEFAULT 'draft',
  impressions BIGINT UNSIGNED NOT NULL DEFAULT 0,
  clicks BIGINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ads_partner FOREIGN KEY (partner_id) REFERENCES ad_partners(partner_id) ON DELETE CASCADE,
  INDEX idx_ads_delivery (placement, area, state, status, start_date, end_date),
  INDEX idx_ads_partner_status (partner_id, status)
);

CREATE TABLE ad_invoices (
  invoice_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(60) NOT NULL UNIQUE,
  partner_id BIGINT UNSIGNED NOT NULL,
  ad_id BIGINT UNSIGNED NOT NULL,
  running_days INT UNSIGNED NOT NULL,
  base_amount DECIMAL(12,2) NOT NULL,
  gst_amount DECIMAL(12,2) NOT NULL,
  final_amount DECIMAL(12,2) NOT NULL,
  payment_status ENUM('pending','paid','failed','refunded','partial_payment') NOT NULL DEFAULT 'pending',
  payment_mode VARCHAR(60),
  transaction_reference VARCHAR(160),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ad_invoice_partner FOREIGN KEY (partner_id) REFERENCES ad_partners(partner_id),
  CONSTRAINT fk_ad_invoice_ad FOREIGN KEY (ad_id) REFERENCES ads(ad_id),
  INDEX idx_ad_invoices_status_date (payment_status, created_at)
);

CREATE TABLE ad_history (
  history_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  ad_id BIGINT UNSIGNED NOT NULL,
  admin_user_id BIGINT UNSIGNED,
  action_type VARCHAR(80) NOT NULL,
  old_values JSON,
  new_values JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ad_history_ad FOREIGN KEY (ad_id) REFERENCES ads(ad_id) ON DELETE CASCADE,
  CONSTRAINT fk_ad_history_admin FOREIGN KEY (admin_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_ad_history_ad_time (ad_id, created_at)
);
