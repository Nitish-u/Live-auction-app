# Live Auction App - Project Overview

## 1. Introduction
This document provides a comprehensive overview of the Live Auction App, detailing the backend and frontend architectures, existing features, missing logical edges, data flow, and development guidelines.

## 2. Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (via Prisma ORM)
- **Real-time:** Socket.io
- **Authentication:** JWT & BCrypt
- **Validation:** Zod
- **Testing:** Vitest

### Frontend
- **Build Tool:** Vite
- **Framework:** React 19
- **Styling:** TailwindCSS v4, Radix UI (base for shadcn/ui)
- **State Management:** Zustand (global), Tanstack Query (server state)
- **HTTP Client:** Axios
- **Real-time:** Socket.io Client
- **Routing:** React Router DOM v7

---

## 3. Backend Architecture

### Data Models (Prisma)
- **User:** Handles authentication, roles (`USER`, `ADMIN`), and profile info.
- **Wallet:** Manages user balances and locked funds for bidding.
- **Asset:** Items listed for auction. Includes images and metadata.
- **Auction:** Manages scheduling (`SCHEDULED`, `LIVE`, `ENDED`, `CANCELLED`).
- **Bid:** Records bids on active auctions.
- **Escrow:** Holds funds during the transaction process.
- **Message:** Chat messages within an auction room.
- **Dispute:** Handles conflicts between buyers and sellers.
- **Notification:** User alerts (`OUTBID`, `AUCTION_WON`, etc.).
- **AuditLog:** Tracks system actions.

### API Structure (`/api/v1`)
The API is organized by resource in `server/src/routes`:
- **Auth:** `/auth` (Register, Login, Password Change)
- **Users:** `/users` (Profile management)
- **Assets:** `/assets` (CRUD, image handling)
- **Auctions:** `/auctions` (Listing, detailed view)
- **Bids:** `/bids` (Placing bids)
- **Wallet:** `/wallet` (Balance check - *Transactions implementation pending*)
- **Dashboard:** `/dashboard` (Aggregated stats for Seller/Bidder/Admin)
- **Admin:** `/admin` (Asset approval, disputes)
- **Settlement:** `/settlement` (Auction finalization - *Partial*)

### Data Flow
1.  **Request:** Client sends HTTP request (with JWT in headers).
2.  **Middleware:** `authenticate` verifies token. `authorize` checks roles (where applicable).
3.  **Controller:** Validates input (Zod), calls Service layer.
4.  **Service:** Exectues business logic, interacts with Database (Prisma).
5.  **Response:** Returns JSON data.
6.  **Socket:** Emits events (e.g., `bid:placed`, `message:sent`) for real-time updates.

---

## 4. Frontend Architecture & UI Walkthrough

### Design System & Aesthetics
- **Style:** Minimalist and premium, leveraging **Shadcn/ui** and **TailwindCSS**.
- **Theme:** Clean light/dark mode support with neutral grays and primary action colors.
- **Interactions:** Real-time updates (socket.io) for bids and chat; skeleton loading states for smooth data fetching; toast notifications for user feedback.

### Page Layouts & Features

#### 1. Explore Auctions (Home)
- **Layout:** Grid-based gallery of active and scheduled auctions.
- **Features:**
    - **Filtering:** Filter by Status (`LIVE`, `SCHEDULED`) and Sort by Start/End time.
    - **Auction Cards:** Display active countdowns/status badges, high-resolution asset thumbnails, and current highest bid.
    - **Empty States:** Clear messaging with "Clear Filter" actions when no auctions match.

#### 2. Auction Details Page (`/auctions/:id`)
- **Layout:** Two-column split view (Desktop) or stacked (Mobile).
    - **Left Column:** High-interaction area.
        - **Asset Gallery:** Main hero image with a grid of thumbnails below.
        - **Live Chat:** Real-time chat panel for participants to discuss the item.
    - **Right Column:** Transactional area.
        - **Header:** Title, Seller info (Avatar + Name), and Status Badge (`LIVE` - pulsating red, `ENDED` - gray).
        - **Bidding Panel:** Shows Start/End times, current highest bid, and a smart **Bid Form** (only enabled for valid participants during `LIVE` status).
        - **Post-Auction:** If won, shows **Escrow Status** and "Raise Dispute" options for the buyer.
    - **Bid History:** A real-time updating list of recent bids below the folds.

#### 3. Dashboard (`/dashboard`)
- **Layout:** Role-based Tabbed Interface (`Seller` | `Bidder` | `Admin`).
- **Seller View:**
    - **Stats Cards:** Total Assets, Live Auctions, Released Earnings, Funds in Escrow.
    - **Quick Actions:** Link to "My Assets".
- **Bidder View:**
    - **Stats Cards:** Active Bids, Won Auctions, Wallet Balance, Locked Funds.
- **Admin View:**
    - **Overview:** Pending Asset Reviews, Active Disputes, Total Holding Escrows.

#### 4. Admin Console (`/admin`)
- **Focus:** Dispute Resolution and Compliance.
- **Dispute Manager:**
    - Lists open disputes with "Complainant" details and "Reason".
    - **Actions:** "Refund Buyer" (Red) or "Release to Seller" (Green). Actions are irreversible.
- **Asset Review:** (Planned) Interface to Approve/Reject pending user assets.

#### 5. User Profiles
- **Public Profile:** Shows user bio, avatar, and their active listings.
- **Settings:** form for profile updates (DisplayName, Bio, Avatar URL) and password management.

### Application Shell (`AppLayout`)
- **Top Navigation:**
    - **Logo:** Branding.
    - **Primary Nav:** Links to "Explore Auctions", "Explore Assets".
    - **User Menu:** Dynamic dropdown showing distinct options based on `Role` (e.g., "Admin Console" only for Admins) and "Snippet" of the user's profile.
    - **Notifications:** Real-time bell icon for user alerts.

---

## 5. Missing Edges & Recommendations

### Backend
1.  **Settlement Logic:** `settlement.routes.ts` exists but implementation needs rigorous testing for fund release/refunds.
2.  **Wallet Transactions:** While the model exists, full deposit/withdrawal flows might need integration (e.g., Stripe/mock payment).
3.  **RBAC Hardening:** Ensure `settlement` and critical `admin` routes have strict `authorize` middleware usage.
4.  **Email/External Notifications:** System currently has internal DB notifications. Email integration (e.g., SendGrid) for "Auction Won" is a common requirement.

### Frontend
1.  **Auth Pages:** `Login` and `Register` pages need to be created or connected if they exist elsewhere (currently assumed missing based on file structure).
2.  **Empty States:** Ensure all lists (Auctions, Assets, Bids) have user-friendly empty states.
3.  **Loading Skeletons:** Use Skeleton loaders instead of simple spinners for a premium feel on Dashboards and Details.
4.  **Error Handling:** `api.ts` has a helper, but global error boundaries for React components would prevent white-screen crashes.
5.  **Form Validations:** Ensure all forms (Bid, Asset Creation) share validation schemas with the backend (zod-to-form libraries).

---

## 6. Development Rules

1.  **Strict TypeScript:** No `any`. Define interfaces for all API responses in `client/src/lib/api.ts` and `server/src/types`.
2.  **Component Reusability:** Use `components/ui` for primitives. Build composite components in `components/`.
3.  **State Management:**
    - **Server State:** Use `React Query` (caching, retries).
    - **Local State:** `useState`.
    - **Global Client State:** `Zustand` (only for things like UserSession, Theme).
4.  **Styling:** Utility-first with Tailwind. Avoid custom CSS files unless animating complex interactions.
5.  **Testing:** Write unit/integration tests for critical paths (Bidding, Money flow).

---

## 7. Implementation Guidelines

### Standard Feature Workflow
Follow this checklist when adding a new feature (e.g., "Wishlist"):
1.  **Database:** Update `schema.prisma` -> Run `prisma migrate dev`.
2.  **Backend Core:**
    -   Create/Update `Service` (Business Logic).
    -   Create/Update `Controller` (Input Validation with Zod).
    -   Register in `Routes` and add to `server.ts`.
3.  **Frontend API:** Define types and axios hooks in `client/src/lib/api.ts`.
4.  **UI Construction:**
    -   Build atomic components in `components/` (if reusable).
    -   Assemble Page/Container.
    -   Integrate `useQuery`/`useMutation`.
5.  **Verification:** Manual test flow + write minimal high-value test case.

### UI/UX Standards
-   **Loading States:** ALWAYS use `<Skeleton />` matching the content shape, never a blank screen.
-   **Error Handling:** Use `toast.error()` for ephemeral API errors. Use generic **Error Boundaries** or inline error cards for page-load failures.
-   **Empty States:** Every list (Bids, Auctions, Assets) must have a friendly `<EmptyState />` component explaining *why* it's empty and *how* to fix it.
-   **Feedback:** Buttons triggering async actions must show `disabled` and `loading` states (e.g., "Submitting...").
-   **Mobile First:** Check all grids on mobile width. Stack columns vertically (e.g., `grid-cols-1 md:grid-cols-2`).
