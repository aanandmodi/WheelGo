# WheelGo MVP System Blueprint

## 1. High-Level Product Structure

WheelGo has **4 main systems**:

-   User Mobile App (React Native)
-   Vendor Mobile App (React Native)
-   Backend API Server
-   Admin / Operations Panel

Everything revolves around the **Backend API**, which handles trust,
bookings, and payments.

    User App ────────┐
                      │
    Vendor App ───────┤ → Backend API → Database
                      │
    Admin Panel ──────┘
            │
    External services:
    Payments (Razorpay)
    Maps (Google Maps)
    Notifications (Firebase)
    KYC (DigiLocker)
    SMS (OTP)

------------------------------------------------------------------------

# 2. User App Architecture

## Total Screens (User App)

### Authentication & Onboarding

1.  Splash\
2.  Onboarding 1\
3.  Onboarding 2\
4.  Onboarding 3\
5.  Login\
6.  OTP Verification\
7.  Signup\
8.  Permission Request

**Total: 8**

------------------------------------------------------------------------

### Main App (Tabs)

Tabs: - Home - My Rides - Wallet - Profile

------------------------------------------------------------------------

### Home / Discovery

-   Home (list bikes)
-   Filter Modal
-   Bike Details

------------------------------------------------------------------------

### Verification

-   KYC Intro
-   DigiLocker Verification
-   KYC Success

------------------------------------------------------------------------

### Booking

-   Booking Form
-   Payment Summary
-   Payment Processing
-   Booking Confirmation
-   Booking Failure

------------------------------------------------------------------------

### Ride Experience

-   Active Ride Map
-   QR Scan
-   Ride Summary
-   Feedback

------------------------------------------------------------------------

### Account

-   Profile
-   Rental History
-   Wallet
-   Notifications
-   Settings
-   Help
-   Terms

------------------------------------------------------------------------

### System

-   Loading
-   Empty State
-   Error State
-   Update Required

**USER APP TOTAL: 34 Screens**

------------------------------------------------------------------------

# 3. Vendor App Architecture

## Authentication

1.  Vendor Login
2.  Vendor OTP
3.  Vendor Verification Status

------------------------------------------------------------------------

## Core Vendor Dashboard

4.  Dashboard

------------------------------------------------------------------------

## Inventory

-   Bike List
-   Add Bike
-   Edit Bike

------------------------------------------------------------------------

## Bookings

-   Booking Requests
-   Booking Details

------------------------------------------------------------------------

## Earnings

-   Earnings
-   Transaction Details

------------------------------------------------------------------------

## Vendor Profile

-   Vendor Profile
-   Vendor Notifications
-   Vendor Support

------------------------------------------------------------------------

## System

-   Loading
-   Empty State
-   Error

**Vendor App Total: 17 Screens**

------------------------------------------------------------------------

# TOTAL FRONTEND SCREENS

    User App: 34
    Vendor App: 17
    ----------------
    Total: 51 Screens

------------------------------------------------------------------------

# 4. Backend System Architecture

Backend must handle **7 core modules**.

## 1. Authentication Service

Handles: - OTP login - JWT tokens

APIs:

    POST /auth/send-otp
    POST /auth/verify-otp
    POST /auth/logout
    POST /auth/refresh-token

------------------------------------------------------------------------

## 2. User Management

Handles: - Profile - KYC status

APIs:

    GET /users/me
    PUT /users/update-profile
    POST /users/upload-photo
    GET /users/kyc-status

------------------------------------------------------------------------

## 3. Vendor Management

    GET /vendors/me
    PUT /vendors/update
    POST /vendors/upload-documents
    GET /vendors/bikes

------------------------------------------------------------------------

## 4. Bike Inventory

    POST /bikes/add
    GET /bikes/list
    GET /bikes/{id}
    PUT /bikes/{id}/update
    DELETE /bikes/{id}

------------------------------------------------------------------------

## 5. Booking Engine

Handles availability logic.

    POST /bookings/create
    GET /bookings/user
    GET /bookings/vendor
    GET /bookings/{id}
    POST /bookings/cancel
    POST /bookings/start
    POST /bookings/end

------------------------------------------------------------------------

## 6. Payment System

    POST /payments/create-order
    POST /payments/verify
    GET /payments/history

------------------------------------------------------------------------

## 7. Notification Service

    POST /notifications/send
    GET /notifications/list

------------------------------------------------------------------------

# 5. Database Schema (Core Tables)

Essential tables:

-   users
-   vendors
-   bikes
-   bookings
-   payments
-   kyc_records
-   notifications
-   ratings

### Relationships

    User → Bookings
    Vendor → Bikes
    Bike → Bookings
    Booking → Payment
    Booking → Rating

------------------------------------------------------------------------

# 6. User Journey Flow

### Full Lifecycle

1.  User opens app
2.  Login with OTP
3.  Browse nearby bikes
4.  Select bike
5.  Complete KYC
6.  Create booking
7.  Pay using UPI
8.  Receive QR code
9.  Vendor scans QR
10. Ride starts
11. Ride ends
12. User rates vendor

------------------------------------------------------------------------

# 7. Vendor Journey Flow

1.  Vendor logs in
2.  Adds bikes to inventory
3.  Receives booking request
4.  Accepts booking
5.  Scans QR at pickup
6.  Ride active
7.  Ride completed
8.  Payment credited

------------------------------------------------------------------------

# 8. User--Vendor Communication

Users and vendors **never communicate directly**.

All interactions pass through the backend.

Example flow:

    User books bike
          ↓
    Backend verifies availability
          ↓
    Vendor receives booking request
          ↓
    Vendor accepts
          ↓
    User notified

------------------------------------------------------------------------

# 9. Beta Launch Requirements

You **do NOT need everything**.

## Must Have

-   Authentication
-   Bike listing
-   Booking creation
-   Payment
-   QR verification
-   Vendor dashboard
-   Notifications

## Can Skip For Beta

-   Ratings
-   Wallet
-   Analytics
-   Advanced filtering
-   Admin automation

------------------------------------------------------------------------

# 10. MVP Development Phases

### Phase 1

Auth + Users + Vendors

### Phase 2

Bike inventory

### Phase 3

Booking engine

### Phase 4

Payments

### Phase 5

Ride tracking

### Phase 6

Notifications

------------------------------------------------------------------------

# 11. Beta Launch Target

Minimum needed:

-   10--15 vendors
-   50--100 users
-   1 city

Example launch cities: - Goa - Rishikesh - Manali

------------------------------------------------------------------------

# 12. Progress Tracking Framework (Antigravity)

## Frontend

    User screens completed / 34
    Vendor screens completed / 17

## Backend

    Auth APIs
    Bike APIs
    Booking APIs
    Payment APIs
    Notification APIs

## Infrastructure

    Database
    Payment gateway
    Maps
    OTP
    Push notifications

------------------------------------------------------------------------

# Reality Check

If UI for both apps is built:

Project completion ≈ **30--35%**

Remaining major work:

-   Backend logic
-   Payment integration
-   Security & validation
-   Infrastructure deployment
-   Testing
-   Vendor onboarding
