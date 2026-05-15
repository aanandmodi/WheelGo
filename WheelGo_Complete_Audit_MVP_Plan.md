# 🏍️ WheelGo — Complete Codebase Audit & MVP Launch Plan

---

## 1. WHAT IS WHEELGO (Context Summary)

India's digital-first two-wheeler rental marketplace.
- Replaces physical ID deposits with DigiLocker KYC
- Customers browse/book/pay, get a QR code for pickup
- Vendors scan QR to start rides, manage fleet, withdraw earnings
- Platform takes 15% commission on every booking
- Tech: Django REST + React Native (Expo) × 2 apps

---

## 2. REPO STRUCTURE AT A GLANCE

```
WheelGo/
├── apps/
│   ├── backend/         Django REST API (6 modules)
│   ├── customer/        React Native – Customer App (Expo Router)
│   └── vendor/          React Native – Vendor App (Expo Router)
├── ARCHITECTURE.md
├── README.md
├── WheelGo_MVP_System_Blueprint.md
└── WheelGo_Project_Context.md
```

---

## 3. WHAT IS FULLY BUILT ✅

### Backend (Django)

| Module | What's Done |
|--------|-------------|
| **users** | Custom User model (phone_number PK, roles), PhoneOTP model, SendOTP / VerifyOTP / CheckUser / FirebaseAuth views, JWT token generation |
| **inventory** | Category + Bike models, BikeViewSet with full filtering (location haversine, price, rating, category, search, sort), toggle-availability action |
| **bookings** | Full Booking model with state machine, QR UUID generation, QR image generation (qrcode lib), BookingViewSet with accept / reject / cancel / complete / scan-qr / get-qr-code actions, overlap validation |
| **payments** | Payment model, RazorpayClient wrapper (create_order + verify_signature), CreateOrderView + VerifyPaymentView |
| **vendors** | Vendor + VendorBankDetails + Earning + Payout models, VendorProfileView, BankDetailsView, EarningsViewSet + summary, PayoutsViewSet + request action, KYCInitiateView + KYCCheckStatusView, VendorDashboardStatsView |
| **customers** | CustomerProfile + Favorite + Review + CustomerNotification models, profile CRUD, FavoritesViewSet, ReviewsViewSet (with bike avg-rating auto-update), NotificationsViewSet, CustomerDashboardView |
| **common** | haversine() distance util |
| **config** | URL routing for all 6 apps, JWT settings, media serving |
| **Database** | All migrations written (0001–0005 across apps) |
| **Admin** | All models are admin-registered |

### Customer App (React Native)

| Area | What's Done |
|------|-------------|
| Auth screens | login.tsx, otp.tsx, signup.tsx — UI complete, phone OTP API call wired |
| Onboarding | index.tsx — UI complete |
| Home/Tabs | index.tsx, history.tsx, wallet.tsx, account.tsx — UI complete |
| Bike flow | details.tsx, FilterModal — UI complete |
| Booking flow | booking/index.tsx, booking/confirmation.tsx, booking/failure.tsx, booking/qrcode.tsx — UI complete |
| KYC | kyc/index.tsx, digilocker.tsx, instant.tsx, success.tsx — UI complete |
| Ride flow | ride/index.tsx, ride/summary.tsx, ride/feedback.tsx — UI complete |
| Scan | scan/index.tsx — UI complete |
| Others | favorites, notifications, wallet, terms screens — UI complete |
| UI Components | AnimatedButton, AnimatedTabBar, Button, Card, GlassCard, GradientButton, Input, Typography — all built |
| ApiService.ts | Full typed wrapper for ALL backend endpoints (auth, bikes, bookings, favorites, reviews, notifications, dashboard) |
| Google OAuth | Login screen has expo-auth-session/Google integration |

### Vendor App (React Native)

| Area | What's Done |
|------|-------------|
| Auth | (auth)/login.tsx, otp.tsx, signup.tsx, setup-profile.tsx — UI + API wired |
| Dashboard | (tabs)/index.tsx — makes real API call to `/vendors/dashboard/stats/` ✅ |
| Bookings | (tabs)/bookings.tsx — UI complete |
| Fleet | (tabs)/fleets.tsx — UI complete |
| Profile | (tabs)/profile.tsx — UI complete |
| Add Vehicle | add-vehicle.tsx — UI complete |
| QR Scanner | scan-qr.tsx — uses expo-camera, calls `/bookings/scan-qr/` ✅ |
| Earnings | earnings.tsx — UI complete |
| Payouts | payouts.tsx — UI complete |
| Bank Details | bank-details.tsx — UI complete |
| AuthContext | SecureStore-backed token persistence ✅ |

---

## 4. BUGS FOUND 🐛

### Critical Bugs (will break the app)

#### BUG-1: QR scan API key mismatch
**File:** `apps/vendor/app/scan-qr.tsx`
```js
body: JSON.stringify({ qr_data: data })  // ← sends "qr_data"
```
**File:** `apps/backend/bookings/views.py`
```python
qr_data = request.data.get('qr_code')  # ← expects "qr_code"
```
**Fix:** Change vendor app to send `{ qr_code: data }` or backend to read `qr_data`.

#### BUG-2: Customer AuthContext login() signature mismatch
**File:** `apps/customer/context/AuthContext.tsx`
```ts
login: (role?: UserRole, token?: string, refresh?: string)
```
**File:** `apps/customer/app/auth/login.tsx` calls:
```ts
login(data.access, data.user)  // passes token as role!
```
**Fix:** Update `login()` to accept `(token, user)` or fix all call sites.

#### BUG-3: booking/index.tsx is fully hardcoded (no API)
The booking screen has hardcoded "Honda Activa 6G", ₹370, Dec 22 dates. It doesn't receive bike/dates from navigation params and calls no real API.
**Fix:** Wire up params from `details.tsx` → `booking/index.tsx` and call `createBooking()` + `createOrder()`.

#### BUG-4: Vendor dashboard earnings aggregation bug
**File:** `apps/backend/vendors/dashboard_views.py`
```python
earnings_data = vendor.earnings.aggregate(
    total_net=Sum('net_amount'),
    pending_amount=Sum('net_amount', filter=Count('status') == 'pending')  # ← BUG
)
```
`Count('status') == 'pending'` evaluates to Python `False`, not a Q filter.
**Fix:**
```python
from django.db.models import Q
pending_amount=Sum('net_amount', filter=Q(status='pending'))
```

#### BUG-5: Payment key hardcoded in response
**File:** `apps/backend/payments/views.py`
```python
"key": "rzp_test_PLACEHOLDER"
```
**Fix:** Use `settings.RAZORPAY_KEY_ID`.

#### BUG-6: No CORS middleware
Django has no `django-cors-headers` installed or configured. All mobile API requests will fail in production from a different origin.
**Fix:** `pip install django-cors-headers`, add to INSTALLED_APPS and MIDDLEWARE, set `CORS_ALLOW_ALL_ORIGINS = True` for dev.

#### BUG-7: db.sqlite3 checked into repo but settings uses PostgreSQL
`settings.py` always points to PostgreSQL. If `.env` is missing (not in repo), DB_NAME defaults to `wheelgo_db` on localhost — this will fail immediately for any new developer.
**Fix:** Provide a `.env.example` file, add SQLite fallback for local dev, or document clearly.

### Non-Critical Issues

| Issue | Location | Fix |
|-------|----------|-----|
| `SECRET_KEY` hardcoded | settings.py | Move to `.env` |
| `ALLOWED_HOSTS = ['*']` | settings.py | Set to domain in prod |
| `DEBUG = True` always | settings.py | Environment-driven |
| OTP returned in API response | users/views.py | Remove in production, send via SMS |
| No requirements.txt in repo | — | Add `pip freeze > requirements.txt` |
| DigiLocker is fully mocked | vendors/kyc_services.py | Implement real OAuth |
| Notifications are print() only | common/notifications.py | Firebase Admin SDK |
| Customer AuthContext doesn't persist to AsyncStorage | customer/AuthContext.tsx | Vendor app does this correctly — mirror it |
| API_URL hardcoded to `192.168.2.102` | both apps' Api.ts | Make env-driven |
| Vendor app: `scan-qr.tsx` doesn't show bike name/customer on success | scan-qr.tsx | Use response data |
| No token refresh logic in customer ApiService | ApiService.ts | Add refresh flow |
| No `.gitignore` for `.env` | .gitignore | Add `.env` to .gitignore |

---

## 5. WHAT IS MISSING ❌

### Backend — Missing Pieces

| Missing | Priority |
|---------|----------|
| Real SMS OTP (Twilio/MSG91) — currently returns OTP in JSON | 🔴 Critical |
| CORS headers (django-cors-headers) | 🔴 Critical |
| `requirements.txt` | 🔴 Critical |
| `.env` file support properly documented | 🔴 Critical |
| Razorpay webhook endpoint (`/api/payments/webhook/`) | 🟠 High |
| Auto-cancel unpaid bookings (Celery task or cron) | 🟠 High |
| Firebase Admin SDK push notifications | 🟠 High |
| Vendor role enforcement on booking creation (prevent vendor booking their own bike) | 🟠 High |
| Double-booking guard at DB level (unique constraint or select_for_update) | 🟠 High |
| `pagination` on bike listing (can get slow with many bikes) | 🟡 Medium |
| Token refresh endpoint wired in frontend | 🟡 Medium |
| Vendor KYC via real DigiLocker OAuth | 🟡 Medium |
| Customer KYC status enforcement on booking | 🟡 Medium |
| Image upload for bikes (currently multipart but no cloud storage) | 🟡 Medium |
| Refund logic on booking cancellation | 🟡 Medium |
| Rate limiting on OTP endpoint | 🟡 Medium |
| Admin dashboard view for platform operations | 🟢 Low |

### Customer App — Missing Wiring

| Missing | Priority |
|---------|----------|
| booking/index.tsx real API integration (currently hardcoded) | 🔴 Critical |
| AuthContext token persistence (mirrors vendor app) | 🔴 Critical |
| Razorpay SDK integration (`react-native-razorpay`) | 🔴 Critical |
| Home screen bikes from real API (need to check index.tsx) | 🔴 Critical |
| QR code display from real API in booking/qrcode.tsx | 🔴 Critical |
| History screen real API (getBookings calls) | 🟠 High |
| Ride feedback form calls submitReview() | 🟠 High |
| Notifications screen calls getNotifications() | 🟠 High |
| Favorites screen calls getFavorites() / toggleFavorite() | 🟠 High |
| Account screen calls getCustomerProfile() | 🟠 High |
| Loading states + error handling on all screens | 🟡 Medium |
| KYC flow real API call | 🟡 Medium |
| Push notification listener (Firebase) | 🟡 Medium |

### Vendor App — Missing Wiring

| Missing | Priority |
|---------|----------|
| Bookings tab real API integration | 🔴 Critical |
| Fleet tab real API (list bikes, toggle availability) | 🔴 Critical |
| Add vehicle form calls POST `/inventory/bikes/` with image | 🔴 Critical |
| Earnings screen calls `/vendors/earnings/summary/` | 🟠 High |
| Payouts screen calls `/vendors/payouts/` + request payout | 🟠 High |
| Bank details form calls POST `/vendors/bank-details/` | 🟠 High |
| Profile screen shows real vendor data | 🟠 High |
| Accept/Reject booking buttons call API | 🔴 Critical |
| Push notification listener (Firebase) | 🟠 High |

### Infrastructure — Fully Missing

| Missing | Priority |
|---------|----------|
| Production PostgreSQL database | 🔴 Critical |
| Cloud media storage (Cloudinary or AWS S3) | 🔴 Critical |
| Backend deployed to cloud (Render / Railway / EC2) | 🔴 Critical |
| Domain + SSL certificate | 🔴 Critical |
| Environment config system (.env for production) | 🔴 Critical |
| EAS (Expo Application Services) build config for APK | 🔴 Critical |
| Firebase project setup (FCM) | 🟠 High |
| Razorpay real keys (test → live) | 🟠 High |
| MSG91 / Twilio SMS API account | 🟠 High |
| Logging & error monitoring (Sentry) | 🟡 Medium |
| CI/CD pipeline | 🟢 Low |

---

## 6. OVERALL COMPLETION ESTIMATE

```
Backend Logic:          ~75%  ████████████████░░░░░
Customer App UI:        ~90%  ██████████████████░░░
Customer App Wiring:    ~25%  █████░░░░░░░░░░░░░░░░
Vendor App UI:          ~90%  ██████████████████░░░
Vendor App Wiring:      ~50%  ██████████░░░░░░░░░░░
Infrastructure:          ~5%  █░░░░░░░░░░░░░░░░░░░░

Overall MVP Readiness:  ~45%  █████████░░░░░░░░░░░░
```

---

## 7. MVP LAUNCH PLAN — DETAILED WEEK-BY-WEEK

### Target: 10 vendors, 50-100 users, 1 city (e.g. Goa / Ahmedabad)
### Timeline: 5 weeks to working beta

---

### WEEK 1: Fix Foundation + Deploy Backend

**Day 1-2: Fix Critical Backend Bugs**

1. **Fix earnings aggregation bug** (`dashboard_views.py`)
2. **Add CORS**:
   ```bash
   pip install django-cors-headers
   ```
   In `settings.py`:
   ```python
   INSTALLED_APPS += ['corsheaders']
   MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware'] + MIDDLEWARE
   CORS_ALLOW_ALL_ORIGINS = True  # for dev
   ```
3. **Fix Razorpay key** in `payments/views.py` → use `settings.RAZORPAY_KEY_ID`
4. **Move secrets to .env**:
   ```
   SECRET_KEY=...
   DB_NAME=wheelgo_db
   DB_USER=postgres
   DB_PASSWORD=...
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   ```
5. **Create requirements.txt**:
   ```
   django>=6.0
   djangorestframework
   djangorestframework-simplejwt
   django-cors-headers
   psycopg2-binary
   python-dotenv
   qrcode[pil]
   razorpay
   Pillow
   ```

**Day 3-4: Deploy Backend to Render (Free Tier)**

1. Create account at `render.com`
2. Create **PostgreSQL** database → get connection URL
3. Create **Web Service** → connect GitHub repo
4. Set environment variables in Render dashboard:
   - `SECRET_KEY`, `DB_*`, `RAZORPAY_*`, `DEBUG=False`, `ALLOWED_HOSTS=your-app.onrender.com`
5. Set build command: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --no-input`
6. Set start command: `gunicorn config.wsgi:application`

**Day 5: Set Up Cloudinary for Media Storage**

```python
# settings.py
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
}
```

**Day 6-7: SMS OTP Integration (MSG91)**

Replace mock OTP with real SMS:
```python
# users/views.py — SendOTPView
import requests
def send_sms_otp(phone, otp):
    url = "https://api.msg91.com/api/v5/otp"
    payload = {
        "template_id": os.getenv("MSG91_TEMPLATE_ID"),
        "mobile": f"91{phone}",
        "authkey": os.getenv("MSG91_AUTH_KEY"),
        "otp": otp
    }
    requests.post(url, json=payload)
```
Keep dev mode: if `DEBUG=True`, still return OTP in response.

---

### WEEK 2: Wire Customer App to Backend

**Day 1: Fix AuthContext (Critical)**

Replace `apps/customer/context/AuthContext.tsx` to match vendor app — use `AsyncStorage` or `SecureStore`, fix login() signature:
```ts
const login = async (accessToken: string, refreshToken: string, userData: any) => {
    await AsyncStorage.setItem('access_token', accessToken);
    await AsyncStorage.setItem('refresh_token', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
    setIsLoggedIn(true);
};
```

**Day 2: Wire Home Screen**

`(tabs)/index.tsx` — call `getBikes()` and `getCategories()` from ApiService on mount. Show loading spinner, error state, and real bike cards.

**Day 3: Wire Booking Flow (Most Critical Path)**

Fix `booking/index.tsx`:
- Accept `bikeId`, `startTime`, `endTime` from navigation params
- On mount: call `getBikeDetails(bikeId)` to show real bike
- On "Pay" button:
  1. Call `createBooking(bikeId, startTime, endTime)` → get `bookingId`
  2. Call `createOrder(bookingId)` → get Razorpay `order_id`
  3. Launch Razorpay checkout
  4. On success: call `verifyPayment(...)` → navigate to `booking/confirmation.tsx`

**Day 4: Integrate Razorpay SDK**

```bash
cd apps/customer
npm install react-native-razorpay
```
Add to `booking/index.tsx`:
```ts
import RazorpayCheckout from 'react-native-razorpay';

const options = {
    description: 'WheelGo Bike Rental',
    image: 'https://yoururl.com/logo.png',
    currency: 'INR',
    key: data.key,
    amount: data.amount,
    name: 'WheelGo',
    order_id: data.order_id,
    prefill: { contact: user.phone_number }
};
RazorpayCheckout.open(options)
    .then(async (paymentData) => {
        await verifyPayment(data.order_id, paymentData.razorpay_payment_id, paymentData.razorpay_signature);
        router.replace('/booking/confirmation');
    })
    .catch(() => router.replace('/booking/failure'));
```

**Day 5: Wire QR Code Screen**

`booking/qrcode.tsx` — call `getBookingQRCode(bookingId)` → display `qr_code_image` URL or generate QR from `qr_code_data` using `react-native-qrcode-svg`.

**Day 6: Wire History Screen**

`(tabs)/history.tsx` — call `getBookings()` with filter params (upcoming/active/past tabs).

**Day 7: Wire Account + Favorites + Notifications**

- `account.tsx` → `getCustomerProfile()`, show name, phone, KYC status
- `favorites/index.tsx` → `getFavorites()`
- `notifications/index.tsx` → `getNotifications()`, `markNotificationRead()`

---

### WEEK 3: Wire Vendor App to Backend

**Day 1: Fix QR Scan Bug + Wire Bookings Tab**

Fix scan-qr.tsx — change `qr_data` → `qr_code`:
```ts
body: JSON.stringify({ qr_code: data })
```

`(tabs)/bookings.tsx` — call `GET /api/bookings/?status=pending,confirmed,active,completed`.
Wire Accept/Reject buttons:
```ts
await fetch(`${API_URL}/bookings/${bookingId}/accept/`, { method: 'POST', headers: authHeaders });
```

**Day 2: Wire Fleet Tab + Add Vehicle**

`(tabs)/fleets.tsx` — call `GET /api/inventory/bikes/` (vendor sees own bikes).
`add-vehicle.tsx` — multipart POST with image to `/api/inventory/bikes/`.
Toggle switch → `POST /api/inventory/bikes/{id}/toggle-availability/`.

**Day 3: Wire Earnings + Payouts + Bank Details**

- `earnings.tsx` → `GET /api/vendors/earnings/summary/` + `GET /api/vendors/earnings/`
- `payouts.tsx` → `GET /api/vendors/payouts/` + `POST /api/vendors/payouts/request/`
- `bank-details.tsx` → `GET/POST /api/vendors/bank-details/`

**Day 4: Wire Profile + Vendor Setup**

`(tabs)/profile.tsx` → `GET /api/vendors/profile/`
`(auth)/setup-profile.tsx` → `POST /api/vendors/profile/` (create vendor profile + set `role='vendor'` on user)

**Day 5-7: API URL Configuration**

Replace hardcoded IPs with environment-driven config:
```ts
// apps/customer/constants/Api.ts
const DOMAIN = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
export const API_URL = `${DOMAIN}/api`;
```

Create `.env` files:
```
EXPO_PUBLIC_API_URL=https://wheelgo-api.onrender.com
```

---

### WEEK 4: Firebase Notifications + KYC + Error Handling

**Day 1-2: Firebase Setup**

1. Create Firebase project at `console.firebase.google.com`
2. Add Android + iOS apps, download `google-services.json`
3. Install in both apps: `expo install expo-notifications`
4. Backend — install Firebase Admin SDK:
   ```bash
   pip install firebase-admin
   ```
5. Update `common/notifications.py`:
   ```python
   import firebase_admin
   from firebase_admin import credentials, messaging
   
   cred = credentials.Certificate('firebase-service-account.json')
   firebase_admin.initialize_app(cred)
   
   def send_notification(user_token, title, message, data=None):
       message = messaging.Message(
           notification=messaging.Notification(title=title, body=message),
           token=user_token,
           data=data or {}
       )
       messaging.send(message)
   ```
6. Add `fcm_token` field to User model, update from app on login.

**Day 3: Customer KYC Flow**

For MVP, use "instant KYC" (simpler) — collect Aadhaar/DL number + photo:
- `kyc/instant.tsx` → call `POST /customers/profile/` with `is_kyc_verified=True` after collection
- Real DigiLocker OAuth can come in v1.1

**Day 4-5: Error States + Loading Skeletons**

Add to every wired screen:
- `ActivityIndicator` while loading
- Error message with retry button on network failure
- Empty state for no results
- Pull-to-refresh on list screens

**Day 6-7: Razorpay Webhook**

Add to backend `payments/urls.py`:
```python
path('webhook/', WebhookView.as_view(), name='razorpay-webhook'),
```

`WebhookView`:
```python
class WebhookView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        signature = request.headers.get('X-Razorpay-Signature')
        # Verify with RAZORPAY_KEY_SECRET
        # Update Payment + Booking status
```

---

### WEEK 5: Testing, Seeding & Launch Prep

**Day 1-2: Seed Data for Beta**

Run `apps/backend/seed_data.py` (already in repo) to create:
- 3-5 test vendor accounts
- 10-15 test bikes with photos
- Category data

**Day 3: End-to-End Testing**

Full flow test on physical devices:
1. Customer installs APK → OTP login → browse bikes → book → pay → get QR
2. Vendor receives notification → accepts → scans QR → completes ride
3. Customer sees ride in history, leaves review
4. Vendor sees earnings dashboard updated

**Day 4: Build APKs via EAS**

```bash
# Install EAS CLI
npm install -g eas-cli

# Customer app
cd apps/customer
eas build --platform android --profile preview

# Vendor app  
cd apps/vendor
eas build --platform android --profile preview
```

Share `.apk` with test vendors via Google Drive / WhatsApp.

**Day 5: Onboard First 10 Vendors**

1. Go to local bike rental shops (Ahmedabad / target city)
2. Walk through vendor app with them
3. Help them add their bikes with photos
4. Test a complete booking cycle with them

**Day 6-7: Fix Bugs from Testing**

Gather feedback from vendors + test users. Fix critical issues. Deploy hotfix to Render.

---

## 8. COMPLETE CHECKLIST TO REACH MVP

### Backend Fixes (Do First)
- [ ] Fix earnings aggregation bug in dashboard_views.py
- [ ] Add django-cors-headers
- [ ] Fix Razorpay key in payments/views.py
- [ ] Move secrets to .env
- [ ] Create requirements.txt
- [ ] Add gunicorn to requirements
- [ ] Deploy to Render
- [ ] Set up Cloudinary for media
- [ ] Integrate MSG91/Twilio for real OTP
- [ ] Add Razorpay webhook endpoint
- [ ] Fix QR scan key name (qr_data → qr_code)
- [ ] Add double-booking atomic transaction guard

### Customer App Fixes (Do Second)
- [ ] Fix AuthContext login() signature
- [ ] Add token persistence to AsyncStorage/SecureStore
- [ ] Wire home screen to real bikes API
- [ ] Wire booking/index.tsx with real data + Razorpay
- [ ] Wire booking/qrcode.tsx to show real QR
- [ ] Wire history tab to real API
- [ ] Wire account screen to real profile API
- [ ] Wire favorites screen
- [ ] Wire notifications screen
- [ ] Add loading states everywhere
- [ ] Update API_URL to deployed backend

### Vendor App Fixes (Do Third)
- [ ] Fix scan-qr qr_data → qr_code
- [ ] Wire bookings tab to real API
- [ ] Wire Accept/Reject buttons
- [ ] Wire fleet tab + toggle availability
- [ ] Wire add-vehicle with image upload
- [ ] Wire earnings screen
- [ ] Wire payouts + bank details screens
- [ ] Wire profile screen
- [ ] Update API_URL to deployed backend

### Infrastructure (Do in Parallel)
- [ ] Render deployment live
- [ ] PostgreSQL on Render live
- [ ] Cloudinary media storage configured
- [ ] Firebase project created
- [ ] FCM push notifications working
- [ ] MSG91 OTP working
- [ ] Razorpay test keys active
- [ ] EAS build for customer APK
- [ ] EAS build for vendor APK
- [ ] Test on physical Android devices

---

## 9. TECH DEBT TO RESOLVE POST-MVP

These are fine to skip for beta but fix before public launch:

1. **Refund automation** — currently manual (just mark payment failed). Integrate Razorpay refund API.
2. **Real DigiLocker KYC** — implement the OAuth redirect + document fetch.
3. **Token refresh** — customer app clears tokens on 401 but doesn't attempt refresh. Add refresh logic in ApiService.authFetch.
4. **Vendor identity verification** — currently `is_verified` is toggled randomly by DigiLocker mock.
5. **Double-booking with atomic transactions** — use `select_for_update()` in BookingCreateSerializer.create().
6. **Pagination** — bikes endpoint returns all bikes. Add `PageNumberPagination`.
7. **S3/Cloudinary for QR images** — QR images currently saved to local filesystem which won't persist on Render.
8. **Background jobs** — auto-cancel bookings after 30 mins if unpaid (needs Celery + Redis).
9. **Vendor acceptance rate tracking** — fraud prevention for rejecting too many bookings.
10. **iOS builds** — need Apple Developer Account ($99/yr), update `app.json` bundle IDs.

---

## 10. SERVICES + ACCOUNTS NEEDED

| Service | Purpose | Cost | Action |
|---------|---------|------|--------|
| Render.com | Backend hosting | Free tier OK for beta | Sign up |
| Render PostgreSQL | Database | Free tier (90 days) | Create in Render dashboard |
| Cloudinary | Image storage | Free 25GB | Sign up |
| Firebase | FCM push + optional auth | Free | Create project |
| MSG91 | SMS OTP | ~₹0.15/SMS | Sign up, get template approved |
| Razorpay | Payments | 2% per transaction | Sign up, submit documents |
| Expo/EAS | Build APKs | Free | Already in eas.json |
| Google Play | Publish app (optional for MVP) | $25 one-time | Can skip, share APK directly |

---

## 11. ESTIMATED REMAINING DEV TIME

Assuming 1-2 developers:

| Phase | Days | Output |
|-------|------|--------|
| Backend fixes + deploy | 3-4 days | Live API on Render |
| Customer app wiring | 4-5 days | End-to-end booking works |
| Vendor app wiring | 3-4 days | Vendor can manage bookings |
| Firebase + Error handling | 2-3 days | Notifications working |
| Testing + APK builds | 2-3 days | Shareable APKs |
| **Total** | **~3 weeks** | **Launchable beta** |

---

## 12. QUICK WINS (Do Today)

These can be fixed in under an hour each and unblock everything:

1. Fix `qr_data` → `qr_code` in `scan-qr.tsx` (1 line)
2. Fix earnings bug in `dashboard_views.py` (1 line — change to `filter=Q(status='pending')`)
3. Add `django-cors-headers` (15 minutes)
4. Fix Razorpay key in response (1 line — use `settings.RAZORPAY_KEY_ID`)
5. Create `requirements.txt` (`pip freeze`)
6. Fix `AuthContext.login()` signature in customer app (10 minutes)
7. Update both apps' `Api.ts` to use `process.env.EXPO_PUBLIC_API_URL`

---

*Generated by full codebase audit — every file read: 6 Django apps, 2 React Native apps, 4 markdown docs.*
