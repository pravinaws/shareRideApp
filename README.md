# FastForward Ionic + Node + MySQL Starter

## Structure

- `mobile`: Ionic Angular app with Capacitor Android/iOS projects.
- `api`: Node.js Express API with MySQL token storage and push notification send endpoints.

## Mobile

```bash
cd mobile
npm start
npm run build
npx cap sync
npx cap open android
npx cap open ios
```

The app includes local notification testing, push permission registration, backend token registration, and a backend push test button.

## API

```bash
cd api
copy .env.example .env
npm install
npm run dev
```

Create the MySQL schema:

```bash
mysql -u root -p < schema.sql
```

## Push Credentials

Android push needs Firebase Cloud Messaging:

1. Create a Firebase app using package `com.fastforward.notifications`.
2. Add `google-services.json` to `mobile/android/app/google-services.json`.
3. Put the Firebase service account JSON at `api/secrets/firebase-service-account.json`.

iOS push needs Apple Push Notification service:

1. Use bundle id `com.fastforward.notifications`.
2. Enable Push Notifications and Background Modes in Xcode.
3. Put your APNs `.p8` key under `api/secrets`.
4. Fill `APNS_KEY_ID`, `APNS_TEAM_ID`, and `APNS_BUNDLE_ID` in `api/.env`.

iOS builds require macOS with Xcode. Android builds require Android Studio/JDK.
