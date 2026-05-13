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


## Local project paths (Windows example)

If your local workspace is:

`C:\Users\Harshala-Pravin\Documents\Codex\2026-05-07\`

use this layout:

- `...\shareRideApp\mobile` → Angular/Ionic UI project
- `...\shareRideApp\api` → Backend API project
- `...\shareRideApp\database` → DB schema and seed scripts

### Start UI (Angular/Ionic) locally

```bash
cd mobile
npm install
npm start
```

Then open `http://localhost:8100` in your browser.

### Start Backend API locally

```bash
cd api
copy .env.example .env
npm install
npm run dev
```

Then open `http://localhost:3000/health` (or your configured API port).

### Start MySQL DB locally

```bash
mysql -u root -p < database/ride-sharing-schema.sql
```

Set API DB values in `api/.env` (host, port, user, password, database) to match your local MySQL instance.

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
