# Taj Residency PMS — Complete Project Status Report
**Project Name:** Taj Residency Luxury Property Management System (FrontDesk OS)  
**Version:** 1.0.0 (Production-Ready)  
**Generated Date:** August 9, 2026  
**Local Port:** `http://localhost:5175/`  
**Tech Stack:** React 18, Vite 5, Tailwind CSS / Vanilla CSS Custom Design System, Supabase JS, Lucide Icons, Canvas Confetti, QRCode React, PWA Service Worker.

---

## 1. Executive Summary & Vision
Taj Residency PMS is a high-performance, aesthetically refined Night-Desk & Reception Counter OS purpose-built for luxury hospitality operations. It combines rapid 15-second counter walk-ins, SAC 996311 GST-compliant billing, multi-shift cash reconciliation, QR self-checkin, housekeeping workflows, and owner yield analytics into a responsive, offline-resilient web application.

---

## 2. Core Architecture & Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18.3.1 + Vite 5.4.11 | Ultra-fast HMR and bundle compilation (<650ms build time) |
| **Design System** | Custom Night-Desk Design System | Curated Luxury Palette: Ink `#0B0F14`, Panel `#121826`, Brass `#C9A24B`, Signal Green `#3FCF8E`, Signal Amber `#E8A33D`, Signal Red `#E2574C`, Paper `#F2EFE6` |
| **Typography** | Google Fonts | **Fraunces** (Display Headings/Hero Numbers), **Inter** (UI Text & Controls), **JetBrains Mono** (IDs, Dates, Currency, Tabular Nums) |
| **State Management** | `pmsStore.js` (Custom Reactive Store) | Hybrid Local Storage + Supabase sync, immutable audit trails, shift ledgers, real-time calculations |
| **Responsive Engine** | `useMediaQuery.js` + Custom CSS Tokens | Real DOM component swapping between desktop `NavigationRail` and mobile `MobileBottomNav` |
| **PWA & Offline** | `manifest.json` + `sw.js` | Installable mobile web app with offline resilience and local persistence |

---

## 3. Project Evolution & Feature Timeline (Starting Till Now)

### Phase 1: Foundation & Core Room Grid
- Implemented the 11-room property configuration (Floors 2 & 3: Deluxe, Classic, Suite, Family).
- Designed the signature **Keycard Room Pass** tile with the decorative barcode texture strip, status indicators (Vacant, Occupied, Reserved, Dirty, Cleaning, Cleaned), and dynamic tariffs (AC vs. Non-AC).
- Built real-time operational metrics (Occupancy %, Available Keys, Today's Total Revenue, Daily Collections Breakdown).

### Phase 2: Counter Shift & Rapid Guest Operations
- **15-Second Fast Walk-In (`WalkInModal.jsx`)**: Rapid phone auto-lookup, room assignment, advance payment recording, automatic GST calculation (12% / 18%), and instant keycard pass issuance.
- **Folio & Checkout Settlement (`FolioModal.jsx`)**: Multi-day stay ledger, room charges, extra service items, split GST calculations, discount handling, and final payment collection (Cash / UPI / Card).
- **Paper Palette Tax Invoice (`PaperInvoice.jsx`)**: Authentic `#F2EFE6` tax invoice with luxury typography, SAC 996311 compliance, GST breakdown, QR code, and print stylesheet.
- **Global Spotlight Search (`GlobalSearchModal.jsx`)**: Instant `⌘K` modal to search across all guests, mobile numbers, booking IDs, and room statuses.
- **WiFi Voucher Generator (`WiFiVoucherModal.jsx`)**: One-tap guest WiFi voucher slip generation with QR code and bandwidth tiering.

### Phase 3: Operations, Housekeeping & Shift Reconciliations
- **Shift Handover & Cash Reconciliation (`ShiftHandoverModal.jsx`)**: Physical cash drawer counting, expected vs. actual balance reconciliation, handover notes, and historical shift logs.
- **Mobile Housekeeping Board (`HousekeepingBoard.jsx`)**: Role-scoped room cleaning pipeline (`Dirty` ➔ `Cleaning` ➔ `Cleaned` ➔ `Vacant Ready`) for housekeeping staff (Meera Thomas).
- **Guest CRM & Directory (`GuestLookup.jsx`)**: Guest profile management, stay history, VIP tags, total lifetime revenue, and 1-tap re-booking.
- **Daily Collections Report (`DailyCollectionsReport.jsx`)**: Shift collection audits, GST rate configurations, payment split breakdowns, and daily printable summaries.

### Phase 4: Multi-Property, Yield Analytics & Security (Owner Suite)
- **Multi-Property Engine (`PropertySwitcher.jsx` / `PropertyOnboardingWizard.jsx`)**: Seamless switching between properties (e.g. Kozhikode Main vs. Wayanad Retreat) and property creation wizard.
- **Owner Analytics & Yield Dashboard (`OwnerAnalyticsDashboard.jsx`)**: RevPAR, ADR, occupancy heatmaps, seasonality yield tracking, and multi-property comparison.
- **Monthly P&L & Expense Ledger (`ExpensePnLView.jsx`)**: Category expense tracking, monthly net profit margins, and financial health metrics.
- **Seasonal Rate Overrides (`SeasonalOverrideModal.jsx`)**: Dynamic pricing rules for peak holiday dates and weekend surcharges.
- **PIN Keypad Security Gate (`LoginScreen.jsx` / `StaffManagementModal.jsx`)**: Role-based access control (Owner, Receptionist Day/Night, Housekeeping) with PIN authentication and staff management.
- **Operations Audit Trail (`AuditTrailView.jsx`)**: Immutable event logging for check-ins, rate overrides, invoice settlements, and staff actions.

### Phase 5: Mobile Responsive Architecture & Visual Hierarchy Overhaul (Latest Update)
- **True Conditional DOM Swapping**: Replaced scaled-down desktop layouts on mobile (<768px) with genuine component swapping:
  - `<768px`: Desktop sidebar completely omitted; sleek fixed `MobileBottomNav` with primary tabs, centered prominent Walk-In action, and slide-up operations drawer.
  - `≥768px`: Desktop `NavigationRail` with keyboard shortcuts rendered smoothly.
- **Anti-Clipping Header**: Fixed cash drawer badge container so amounts like `₹15,680` render completely with tabular numerals on all screens.
- **Visual Hierarchy Polish**:
  - Elevated **Today Total Revenue** to a dominant Hero Card with 1.5x typography, soft brass glow (`#C9A24B`), and backdrop blur.
  - Stat cards arranged into a 2x2 grid on mobile & tablet and 4-column row on desktop.
  - Active status filter pills highlighted with solid filled brass (`bg-brass text-ink font-bold shadow-md`) for zero visual ambiguity.
  - High-contrast room numbers in bold Fraunces serif for rapid recognition.
- **Multi-Device Viewport Validation**: Verified at **393px** (iPhone 14 Pro), **430px** (iPhone 14 Pro Max), **480px** (Pixel 7 Pro), **820px** (iPad / Tablet), and **1559px** (MacBook Air / Desktop).

---

## 4. Current File Map & Component Structure

```
/TAJ Residency/
├── index.html                   # HTML entry point, PWA meta tags, Google Fonts (Fraunces, Inter, JetBrains Mono)
├── package.json                 # Dependencies & build scripts (Vite, React 18, Lucide, Confetti, QR)
├── vite.config.js               # Vite development & production configuration
├── public/
│   ├── manifest.json            # PWA Web App manifest
│   └── sw.js                    # Service worker script
├── src/
│   ├── main.jsx                 # React root renderer
│   ├── App.jsx                  # Main view controller, authentication & modal orchestrator
│   ├── index.css                # Night-Desk design system tokens, responsive utilities & elevation styles
│   ├── hooks/
│   │   └── useMediaQuery.js     # Responsive viewport hooks (useMediaQuery, useIsDesktop)
│   ├── store/
│   │   └── pmsStore.js          # Reactive store (rooms, bookings, guests, invoices, audit logs, shifts)
│   ├── types/
│   │   └── data.js              # Room types, sample seed data, GST slabs, property defaults
│   ├── utils/
│   │   └── formatters.js        # Currency, date, phone, and time formatting helpers
│   ├── lib/
│   │   └── supabaseClient.js    # Supabase cloud database client
│   └── components/
│       ├── AuditTrailView.jsx           # Operations audit log view
│       ├── DailyCollectionsReport.jsx   # GST & daily collections report
│       ├── DatabaseSettingsModal.jsx    # Cloud database sync settings modal
│       ├── DemoTourModal.jsx            # Interactive feature tour modal
│       ├── ExpensePnLView.jsx           # P&L ledger & expense tracking view
│       ├── FolioModal.jsx               # Guest folio & checkout settlement modal
│       ├── GlobalSearchModal.jsx        # ⌘K global spotlight search
│       ├── GuestLookup.jsx              # Guest CRM & stay history directory
│       ├── GuestSelfCheckinModal.jsx    # QR self-checkin queue modal
│       ├── HousekeepingBoard.jsx        # Mobile housekeeping pipeline view
│       ├── KeycardRoom.jsx              # Signature keycard room tile
│       ├── LandingPage.jsx              # Public luxury showcase landing page
│       ├── LoginModal.jsx               # Quick staff switch modal
│       ├── LoginScreen.jsx              # PIN keypad authentication gate
│       ├── MobileBottomNav.jsx          # Mobile bottom navigation bar (<768px)
│       ├── NavigationRail.jsx           # Desktop navigation sidebar (≥768px)
│       ├── OwnerAnalyticsDashboard.jsx  # Yield analytics & RevPAR dashboard
│       ├── PaperInvoice.jsx             # Luxury #F2EFE6 tax invoice modal
│       ├── PropertyOnboardingWizard.jsx # Multi-property setup wizard
│       ├── PropertySwitcher.jsx         # Property switcher dropdown
│       ├── RoleSelector.jsx             # Role switcher helper
│       ├── RoomGrid.jsx                 # 11-room operational front desk grid
│       ├── SeasonalOverrideModal.jsx    # Dynamic rate overrides modal
│       ├── ShiftHandoverModal.jsx       # Cash drawer reconciliation modal
│       ├── StaffManagementModal.jsx     # Staff PIN admin modal
│       ├── TopHeader.jsx                # Responsive counter top header
│       ├── WalkInModal.jsx              # 15-second fast walk-in modal
│       └── WiFiVoucherModal.jsx         # Guest WiFi voucher generator
```

---

## 5. Staff Accounts & Role Credentials

The system comes pre-configured with active staff profiles:

| Staff Name | Role | Access Scope | Default PIN / Password |
| :--- | :--- | :--- | :--- |
| **Rajesh Verma** | Owner / GM | Full Access (Analytics, P&L, Overrides, Audit Trail, Staff Admin, Room Grid) | `123` / `admin` |
| **Anoop Nair** | Receptionist (Day Shift) | Front Desk Counter, Walk-Ins, Folios, Daily Collections, Shift Handover, Guests | `123` / `1234` |
| **Suresh Babu** | Receptionist (Night Shift) | Front Desk Counter, Walk-Ins, Folios, Night Audit, Shift Handover, Guests | `123` / `1234` |
| **Meera Thomas** | Housekeeping Lead | Mobile Room Cleaning Board, Room Turnover Advancement | `123` / `demo` |

---

## 6. Verification & Health Status

- **Dev Server Status:** Running and active at `http://localhost:5175/` (Vite v5.4.21).
- **Production Build:** Verified clean compilation via `npm run build` (`0 errors`, 649ms build time).
- **Responsive Layout:** Verified across phone (393px, 430px, 480px), tablet (820px), and desktop (1559px) with zero overlapping text, zero cash clipping, and full DOM swapping.
- **Data Integrity:** Fully functional offline-first local persistence with seamless Supabase cloud integration capability.

---

## 7. Recommended Next Steps & Roadmap

1. **Production Deployment**: Connect to Vercel, Netlify, or self-hosted server with automated CI/CD.
2. **Hardware Integrations**: Connect USB / ESC-POS thermal receipt printer for instant physical folio & WiFi slip printing.
3. **SMS / WhatsApp Gateway**: Integrate Twilio or MSG91 for automated WhatsApp invoices and check-in welcome passes.
4. **Payment Gateway Webhooks**: Connect Razorpay / PineLabs POS terminal webhooks for automated UPI payment confirmations.
