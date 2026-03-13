# WheelGo System Architecture

## Table of Contents
- [System Overview](#system-overview)
- [High-Level Architecture](#high-level-architecture)
- [Component Details](#component-details)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [User Flows](#user-flows)
- [Database Schema](#database-schema)

---

## System Overview

WheelGo is a **bike rental platform** that connects customers with vendors who offer bikes for rent. The system consists of three main components:

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Backend** | Django REST Framework | API server, business logic, data persistence |
| **Customer App** | React Native (Expo) | Customer-facing mobile app |
| **Vendor App** | React Native (Expo) | Vendor-facing mobile app |

---

## High-Level Architecture

```mermaid
flowchart TB
    subgraph "Mobile Apps"
        CA["📱 Customer App<br/>(React Native/Expo)"]
        VA["📱 Vendor App<br/>(React Native/Expo)"]
    end
    
    subgraph "Backend Services"
        API["🌐 Django REST API"]
        AUTH["🔐 JWT Auth<br/>(Simple JWT)"]
        PAY["💳 Razorpay<br/>Integration"]
        KYC["📋 DigiLocker<br/>KYC Service"]
    end
    
    subgraph "Data Layer"
        DB[(🗄️ SQLite Database)]
        MEDIA["📁 Media Storage<br/>(Images, QR Codes)"]
    end
    
    CA --> |"HTTPS/REST"| API
    VA --> |"HTTPS/REST"| API
    API --> AUTH
    API --> PAY
    API --> KYC
    API --> DB
    API --> MEDIA
```

---

## Component Details

### Backend Architecture

```mermaid
flowchart LR
    subgraph "Django Backend"
        direction TB
        
        subgraph "Apps"
            USERS["👤 users<br/>Authentication"]
            VENDORS["🏪 vendors<br/>Vendor Management"]
            CUSTOMERS["🛒 customers<br/>Customer Features"]
            INVENTORY["🚲 inventory<br/>Bikes & Categories"]
            BOOKINGS["📅 bookings<br/>Booking Workflow"]
            PAYMENTS["💰 payments<br/>Payment Processing"]
        end
        
        subgraph "Core"
            CONFIG["⚙️ config<br/>Settings & URLs"]
            COMMON["🔧 common<br/>Utilities"]
        end
    end
```

### Frontend Apps Structure

```mermaid
flowchart TB
    subgraph "Customer App"
        direction LR
        C_AUTH["Auth<br/>(Login/OTP)"]
        C_HOME["Home<br/>(Browse Bikes)"]
        C_SEARCH["Search<br/>(Filters)"]
        C_BOOK["Booking<br/>(Reserve/Pay)"]
        C_TRIPS["My Trips<br/>(History)"]
        C_PROFILE["Profile<br/>(Settings)"]
    end
    
    subgraph "Vendor App"
        direction LR
        V_AUTH["Auth<br/>(Login/Register)"]
        V_HOME["Dashboard<br/>(Overview)"]
        V_BIKES["My Bikes<br/>(Inventory)"]
        V_BOOKINGS["Bookings<br/>(Manage)"]
        V_EARNINGS["Earnings<br/>(Revenue)"]
        V_SCAN["QR Scanner<br/>(Start Rides)"]
    end
```

---

## Data Models

### Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o| VENDOR : "has profile"
    USER ||--o| CUSTOMER_PROFILE : "has profile"
    USER ||--o{ BOOKING : "makes"
    USER ||--o{ FAVORITE : "saves"
    USER ||--o{ REVIEW : "writes"
    USER ||--o{ NOTIFICATION : "receives"
    
    VENDOR ||--o{ BIKE : "owns"
    VENDOR ||--o| BANK_DETAILS : "has"
    VENDOR ||--o{ EARNING : "receives"
    VENDOR ||--o{ PAYOUT : "requests"
    
    CATEGORY ||--o{ BIKE : "contains"
    
    BIKE ||--o{ BOOKING : "booked via"
    BIKE ||--o{ FAVORITE : "favorited"
    BIKE ||--o{ REVIEW : "reviewed"
    
    BOOKING ||--o{ PAYMENT : "paid via"
    BOOKING ||--|| EARNING : "generates"
    BOOKING ||--o| REVIEW : "reviewed"
    
    USER {
        string phone_number PK
        string full_name
        string role "customer/vendor/admin"
        boolean is_active
        datetime date_joined
    }
    
    VENDOR {
        int id PK
        int user_id FK
        string shop_name
        text address
        float latitude
        float longitude
        boolean is_verified
    }
    
    BIKE {
        int id PK
        int vendor_id FK
        int category_id FK
        string brand
        string model
        string number_plate UK
        decimal price_per_hour
        string status "available/reserved/active/maintenance"
        decimal average_rating
    }
    
    BOOKING {
        int id PK
        int user_id FK
        int bike_id FK
        datetime start_time
        datetime end_time
        decimal total_amount
        string status "pending/confirmed/active/completed/cancelled"
        string payment_status "pending/paid/failed"
        string qr_code_data UK
    }
    
    PAYMENT {
        int id PK
        int booking_id FK
        decimal amount
        string provider
        string transaction_id UK
        string status "pending/success/failed"
    }
```

### Model Details

| Model | App | Key Fields | Purpose |
|-------|-----|------------|---------|
| `User` | users | phone_number, role, full_name | Base authentication |
| `PhoneOTP` | users | phone_number, otp, verified | OTP verification |
| `Vendor` | vendors | shop_name, address, location, is_verified | Vendor business profile |
| `VendorBankDetails` | vendors | account_number, ifsc_code | Payout bank info |
| `Earning` | vendors | gross_amount, platform_fee (15%), net_amount | Per-booking earnings |
| `Payout` | vendors | amount, status, utr | Payout requests |
| `CustomerProfile` | customers | avatar, email, saved_address, is_kyc_verified | Extended customer info |
| `Favorite` | customers | user, bike | Saved bikes |
| `Review` | customers | rating (1-5), comment | Post-ride reviews |
| `CustomerNotification` | customers | type, title, message, is_read | Push notifications |
| `Category` | inventory | name, description, image | Bike categories |
| `Bike` | inventory | brand, model, number_plate, price_per_hour, status | Vehicle inventory |
| `Booking` | bookings | start_time, end_time, status, qr_code | Rental bookings |
| `Payment` | payments | amount, transaction_id, status | Payment records |

---

## API Endpoints

### Authentication (`/api/users/`)

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant API as Backend API
    participant DB as Database
    
    Note over App,DB: OTP Login Flow
    
    App->>API: POST /send-otp/<br/>{phone_number}
    API->>DB: Create/Update PhoneOTP
    API-->>App: {otp: "123456"}
    
    App->>API: POST /verify-otp/<br/>{phone_number, otp}
    API->>DB: Verify OTP & Get/Create User
    API-->>App: {access, refresh, user, new_user}
```

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/send-otp/` | POST | ❌ | Send OTP to phone number |
| `/verify-otp/` | POST | ❌ | Verify OTP & get JWT tokens |
| `/check-user/` | POST | ❌ | Check if user exists |

---

### Inventory (`/api/inventory/`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/categories/` | GET | ❌ | List all bike categories |
| `/bikes/` | GET | ❌ | List bikes (with filters) |
| `/bikes/` | POST | ✅ Vendor | Add new bike |
| `/bikes/{id}/` | GET | ❌ | Get bike details |
| `/bikes/{id}/` | PUT/PATCH | ✅ Vendor | Update bike |
| `/bikes/{id}/toggle-availability/` | POST | ✅ Vendor | Toggle bike status |

**Bike Query Parameters:**
- `category`, `category_name` - Filter by category
- `status` - Filter by availability
- `min_price`, `max_price` - Price range
- `min_rating` - Minimum rating filter
- `lat`, `lng`, `radius` - Location-based search
- `search` - Text search (brand/model)
- `sort_by` - price_low, price_high, rating, newest

---

### Bookings (`/api/bookings/`)

```mermaid
stateDiagram-v2
    [*] --> Pending: Customer creates booking
    Pending --> Confirmed: Vendor accepts
    Pending --> Cancelled: Vendor rejects
    Pending --> Cancelled: Customer cancels
    Confirmed --> Active: Vendor scans QR
    Confirmed --> Cancelled: Customer/Vendor cancels
    Active --> Completed: Vendor ends ride
    Completed --> [*]
    Cancelled --> [*]
```

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | ✅ | List bookings (filtered by role) |
| `/` | POST | ✅ Customer | Create new booking |
| `/{id}/` | GET | ✅ | Get booking details |
| `/{id}/accept/` | POST | ✅ Vendor | Accept pending booking |
| `/{id}/reject/` | POST | ✅ Vendor | Reject booking with reason |
| `/{id}/cancel/` | POST | ✅ | Cancel booking |
| `/{id}/complete/` | POST | ✅ Vendor | End active ride |
| `/{id}/qr-code/` | GET | ✅ Customer | Get QR code image |
| `/scan-qr/` | POST | ✅ Vendor | Scan QR to start ride |

---

### Payments (`/api/payments/`)

```mermaid
sequenceDiagram
    participant Customer
    participant App as Customer App
    participant API as Backend
    participant Razorpay
    
    Customer->>App: Confirm booking
    App->>API: POST /create-order/<br/>{booking_id}
    API->>Razorpay: Create order
    Razorpay-->>API: {order_id, amount}
    API-->>App: {order_id, key}
    
    App->>Razorpay: Open payment sheet
    Customer->>Razorpay: Complete payment
    Razorpay-->>App: {payment_id, signature}
    
    App->>API: POST /verify-payment/<br/>{order_id, payment_id, signature}
    API->>Razorpay: Verify signature
    API->>API: Update booking status
    API-->>App: {success}
```

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/create-order/` | POST | ✅ | Create Razorpay order |
| `/verify-payment/` | POST | ✅ | Verify payment signature |

---

### Vendors (`/api/vendors/`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/profile/` | GET | ✅ | Get vendor profile |
| `/profile/` | POST | ✅ | Create/update vendor profile |
| `/bank-details/` | GET | ✅ | Get bank account info |
| `/bank-details/` | POST | ✅ | Add/update bank details |
| `/earnings/` | GET | ✅ | List all earnings |
| `/earnings/summary/` | GET | ✅ | Get earnings totals |
| `/payouts/` | GET | ✅ | List payout history |
| `/payouts/request/` | POST | ✅ | Request new payout |
| `/kyc/initiate/` | POST | ✅ | Start DigiLocker KYC |
| `/kyc/check-status/` | POST | ✅ | Check KYC status |

---

### Customers (`/api/customers/`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/profile/` | GET/POST | ✅ | Get/update customer profile |
| `/dashboard/` | GET | ✅ | Dashboard with stats |
| `/favorites/` | GET | ✅ | List favorite bikes |
| `/favorites/` | POST | ✅ | Add to favorites |
| `/favorites/{bike_id}/` | DELETE | ✅ | Remove from favorites |
| `/reviews/` | GET | ✅ | List user's reviews |
| `/reviews/` | POST | ✅ | Submit review |
| `/reviews/bike/{bike_id}/` | GET | ✅ | Reviews for a bike |
| `/notifications/` | GET | ✅ | List notifications |
| `/notifications/{id}/read/` | POST | ✅ | Mark as read |
| `/notifications/read-all/` | POST | ✅ | Mark all as read |

---

## User Flows

### Customer Booking Flow

```mermaid
flowchart TD
    A["👤 Customer opens app"] --> B["🔐 Login with OTP"]
    B --> C["🏠 Browse bikes on home"]
    C --> D{"🔍 Search/Filter?"}
    D -->|Yes| E["Apply filters<br/>(location, price, rating)"]
    E --> F["View search results"]
    D -->|No| F
    F --> G["📱 View bike details"]
    G --> H{"❤️ Add to favorites?"}
    H -->|Yes| I["Save to favorites"]
    H -->|No| J["Select dates & times"]
    I --> J
    J --> K["💳 Proceed to payment"]
    K --> L["Complete Razorpay payment"]
    L --> M["⏳ Booking PENDING"]
    M --> N{"Vendor response?"}
    N -->|Accept| O["✅ Booking CONFIRMED<br/>QR Code generated"]
    N -->|Reject| P["❌ Booking CANCELLED<br/>Refund initiated"]
    O --> Q["📱 Show QR to vendor"]
    Q --> R["🚲 Ride ACTIVE"]
    R --> S["Vendor ends ride"]
    S --> T["🏁 Ride COMPLETED"]
    T --> U["⭐ Submit review"]
```

### Vendor Workflow

```mermaid
flowchart TD
    A["🏪 Vendor opens app"] --> B["🔐 Login with OTP"]
    B --> C{"Has profile?"}
    C -->|No| D["📝 Create vendor profile<br/>(shop name, address, location)"]
    D --> E["📋 Complete KYC<br/>(DigiLocker)"]
    C -->|Yes| F["🏠 View dashboard"]
    E --> F
    
    F --> G["📊 Dashboard shows:<br/>• Today's bookings<br/>• Pending requests<br/>• Active rides<br/>• Earnings"]
    
    G --> H{"Action?"}
    
    H -->|"Add Bike"| I["🚲 Add new vehicle<br/>(brand, model, plate, price, photo)"]
    I --> F
    
    H -->|"Manage Booking"| J["📋 View pending requests"]
    J --> K{"Accept/Reject?"}
    K -->|Accept| L["✅ Confirm booking"]
    K -->|Reject| M["❌ Reject with reason"]
    L --> F
    M --> F
    
    H -->|"Start Ride"| N["📷 Scan customer QR code"]
    N --> O["🚲 Ride started<br/>(bike status: ACTIVE)"]
    O --> F
    
    H -->|"End Ride"| P["🏁 Complete active ride"]
    P --> Q["💰 Earning recorded<br/>(minus 15% platform fee)"]
    Q --> F
    
    H -->|"View Earnings"| R["📊 Earnings summary<br/>• Total earnings<br/>• Available balance<br/>• Paid out"]
    R --> S{"Request payout?"}
    S -->|Yes| T["💸 Submit payout request"]
    T --> F
    S -->|No| F
```

### Data Flow: Complete Booking Lifecycle

```mermaid
sequenceDiagram
    participant C as Customer App
    participant API as Backend API
    participant V as Vendor App
    participant DB as Database
    participant Pay as Razorpay
    
    Note over C,Pay: 1. BOOKING CREATION
    C->>API: POST /bookings/<br/>{bike_id, dates, amount}
    API->>DB: Create Booking (pending)
    API->>DB: Set Bike status = "reserved"
    API-->>C: Booking created
    
    Note over C,Pay: 2. PAYMENT
    C->>API: POST /payments/create-order/
    API->>Pay: Create order
    Pay-->>API: Order details
    API->>DB: Create Payment (pending)
    API-->>C: Order info
    C->>Pay: Complete payment
    Pay-->>C: Payment success
    C->>API: POST /payments/verify-payment/
    API->>DB: Update Payment (success)
    API->>DB: Update Booking (payment_status=paid)
    
    Note over C,Pay: 3. VENDOR REVIEW
    V->>API: GET /bookings/?status=pending
    API-->>V: List pending bookings
    V->>API: POST /bookings/{id}/accept/
    API->>DB: Update Booking (confirmed)
    API->>DB: Generate QR code
    API->>DB: Create CustomerNotification
    API-->>V: Success
    
    Note over C,Pay: 4. RIDE START
    C->>API: GET /bookings/{id}/qr-code/
    API-->>C: QR code image
    V->>API: POST /bookings/scan-qr/<br/>{qr_code_data}
    API->>DB: Update Booking (active)
    API->>DB: Update Bike status = "active"
    API->>DB: Create CustomerNotification
    API-->>V: Ride started
    
    Note over C,Pay: 5. RIDE COMPLETION
    V->>API: POST /bookings/{id}/complete/
    API->>DB: Update Booking (completed)
    API->>DB: Update Bike status = "available"
    API->>DB: Create Earning (15% fee calculated)
    API->>DB: Create CustomerNotification
    API-->>V: Ride completed
    
    Note over C,Pay: 6. REVIEW (Optional)
    C->>API: POST /customers/reviews/<br/>{booking_id, rating, comment}
    API->>DB: Create Review
    API->>DB: Update Bike average_rating
```

---

## Database Schema

### Tables Overview

```mermaid
flowchart LR
    subgraph "Authentication"
        users_user["users_user"]
        users_phoneotp["users_phoneotp"]
    end
    
    subgraph "Vendors"
        vendors_vendor["vendors_vendor"]
        vendors_vendorbankdetails["vendors_vendorbankdetails"]
        vendors_earning["vendors_earning"]
        vendors_payout["vendors_payout"]
    end
    
    subgraph "Customers"
        customers_customerprofile["customers_customerprofile"]
        customers_favorite["customers_favorite"]
        customers_review["customers_review"]
        customers_customernotification["customers_customernotification"]
    end
    
    subgraph "Inventory"
        inventory_category["inventory_category"]
        inventory_bike["inventory_bike"]
    end
    
    subgraph "Bookings & Payments"
        bookings_booking["bookings_booking"]
        payments_payment["payments_payment"]
    end
    
    users_user --> vendors_vendor
    users_user --> customers_customerprofile
    users_user --> bookings_booking
    users_user --> customers_favorite
    users_user --> customers_review
    
    vendors_vendor --> vendors_vendorbankdetails
    vendors_vendor --> vendors_earning
    vendors_vendor --> vendors_payout
    vendors_vendor --> inventory_bike
    
    inventory_category --> inventory_bike
    inventory_bike --> bookings_booking
    inventory_bike --> customers_favorite
    inventory_bike --> customers_review
    
    bookings_booking --> payments_payment
    bookings_booking --> vendors_earning
    bookings_booking --> customers_review
```

### Key Relationships

| From | To | Relationship | Description |
|------|-----|--------------|-------------|
| User | Vendor | OneToOne | User with role='vendor' has vendor profile |
| User | CustomerProfile | OneToOne | Extended customer info |
| Vendor | Bike | OneToMany | Vendor owns multiple bikes |
| Vendor | VendorBankDetails | OneToOne | Bank account for payouts |
| Vendor | Earning | OneToMany | Earnings from completed bookings |
| Category | Bike | OneToMany | Bikes belong to categories |
| User | Booking | OneToMany | Customer makes bookings |
| Bike | Booking | OneToMany | Bike can have multiple bookings |
| Booking | Payment | OneToMany | Booking has payment records |
| Booking | Earning | OneToOne | Completed booking generates earning |
| Booking | Review | OneToOne | Customer can review after completion |
| User | Favorite | OneToMany | Customer saves favorite bikes |
| Bike | Review | OneToMany | Bike accumulates reviews |

---

## Platform Commission

The platform takes a **15% commission** on each completed booking:

```
Gross Amount = Total booking amount paid by customer
Platform Fee = Gross Amount × 0.15
Net Amount = Gross Amount - Platform Fee (Goes to vendor)
```

Example:
- Customer pays: ₹1,000
- Platform fee: ₹150
- Vendor receives: ₹850

---

## Technology Stack Summary

| Layer | Technology | Version/Notes |
|-------|------------|---------------|
| **Backend Framework** | Django | 6.0+ |
| **REST API** | Django REST Framework | - |
| **Authentication** | Simple JWT | Phone OTP + JWT tokens |
| **Database** | SQLite | Development (PostgreSQL for prod) |
| **Payment Gateway** | Razorpay | Test mode |
| **KYC Verification** | DigiLocker | Mock implementation |
| **Mobile Framework** | React Native | Via Expo |
| **Navigation** | Expo Router | File-based routing |
| **Styling** | NativeWind | Tailwind for React Native |
| **State Management** | React Context | AuthContext |

---

## Security Considerations

1. **Authentication**: JWT tokens with refresh mechanism
2. **Authorization**: Role-based (customer, vendor, admin)
3. **API Protection**: IsAuthenticated permission for sensitive endpoints
4. **Payment Security**: Razorpay signature verification
5. **Data Validation**: Django serializers with validators

---

*Document generated: January 2026*
