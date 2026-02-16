# Applications Management System

## Overview

A comprehensive admin panel application management system for approving and rejecting vendor and rider applications. Built with React, TypeScript, and Supabase.

## Features

### Core Features

- ✅ **Vendor Applications Management**
  - View all vendor applications
  - Filter by status (pending, approved, rejected)
  - Approve/reject with optional notes
  - View vendor details (shop name, contact, location, etc.)

- ✅ **Rider Applications Management**
  - View all rider applications
  - Filter by status (pending, approved, rejected)
  - Approve/reject with optional notes
  - View rider details (vehicle type, license plate, emergency contact, etc.)

- ✅ **Statistics Dashboard**
  - Total application count
  - Pending applications count
  - Approved applications count
  - Rejected applications count

- ✅ **Clean Architecture**
  - Service layer for API calls
  - Reusable components
  - Type-safe with TypeScript
  - React Query for state management

## Project Structure

```
web/src/
├── lib/
│   └── applicationService.ts      # Supabase queries & mutations
├── components/admin/
│   └── ApplicationCard.tsx         # Reusable application card component
├── pages/admin/
│   ├── Applications.tsx            # Main applications page
│   ├── VendorApplications.tsx      # Vendor applications management
│   └── RiderApplications.tsx       # Rider applications management
├── components/layout/
│   └── AdminSidebar.tsx            # Updated sidebar with new nav item
└── App.tsx                         # Updated with new routes
```

## File Descriptions

### 1. **applicationService.ts**

Handles all Supabase interactions for applications management.

**Key Functions:**

- `fetchVendorApplications(status?)` - Fetch vendor applications with optional status filter
- `updateVendorApplicationStatus(userId, status, notes)` - Approve/reject vendor
- `fetchRiderApplications(status?)` - Fetch rider applications with optional status filter
- `updateRiderApplicationStatus(userId, status, notes)` - Approve/reject rider
- `fetchApplicationStats()` - Get statistics for all applications

**Type Definitions:**

```typescript
interface VendorApplication {
  user_id: string;
  shop_name: string;
  email: string;
  mobile_number: string;
  gcash_number: string;
  approval_status: "pending" | "approved" | "rejected";
  approval_notes?: string;
  created_at: string;
  // ... other fields
}

interface RiderApplication {
  user_id: string;
  vehicle_type: string;
  license_plate: string;
  approval_status: "pending" | "approved" | "rejected";
  approval_notes?: string;
  // ... other fields
}
```

### 2. **ApplicationCard.tsx**

Reusable component for displaying individual applications.

**Features:**

- Avatar with fallback initials
- Application status badge with color coding
- Application details display
- Approve/Reject buttons for pending applications
- Dialog modals for approval/rejection with optional notes
- Loading states and error handling

**Props:**

```typescript
interface ApplicationCardProps {
  application: VendorApplication | RiderApplication;
  type: "vendor" | "rider";
  onApprove: (userId: string, notes?: string) => Promise<void>;
  onReject: (userId: string, notes?: string) => Promise<void>;
  isLoading?: boolean;
}
```

### 3. **Applications.tsx**

Main applications page with tab navigation.

**Features:**

- Tab navigation between vendor and rider applications
- Page header with icon
- Delegates to specific application pages

### 4. **VendorApplications.tsx**

Vendor-specific applications management page.

**Features:**

- Statistics cards (total, pending, approved, rejected)
- Tab-based filtering (all, pending, approved, rejected)
- Grid layout of application cards
- React Query for data fetching and caching
- Toast notifications for success/error

### 5. **RiderApplications.tsx**

Rider-specific applications management page.

**Features:**

- Same structure as VendorApplications
- Rider-specific details display
- Independent data fetching

### 6. **AdminSidebar.tsx** (Updated)

Navigation sidebar with new "Applications" menu item.

**Changes:**

- Added `FileCheck` icon import
- Added "Applications" navigation item pointing to `/admin/applications`

### 7. **App.tsx** (Updated)

Main app routes configuration.

**Changes:**

- Added lazy-loaded `Applications` page
- Added new route: `/admin/applications`

## Usage

### Accessing the Applications Page

1. Navigate to the admin dashboard
2. Click "Applications" in the sidebar
3. Choose between "Vendor Applications" or "Rider Applications"

### Approving an Application

1. Navigate to Applications page
2. Find the pending application
3. Click "Approve" button
4. Optionally add notes
5. Confirm approval

### Rejecting an Application

1. Navigate to Applications page
2. Find the pending application
3. Click "Reject" button
4. Add a rejection reason (required)
5. Confirm rejection

## Database Schema Integration

The system uses the following Supabase tables:

**vendor_profiles**

- `user_id` (PK)
- `shop_name`
- `approval_status` (pending, approved, rejected)
- `approval_notes`
- `created_at`

**rider_profiles**

- `user_id` (PK)
- `vehicle_type`
- `approval_status` (pending, approved, rejected)
- `approval_notes`
- `created_at`

**profiles** (via foreign key)

- `user_id`
- `full_name`
- `email`
- `mobile_number`
- `avatar_url`

**addresses** (via foreign key)

- `barangay`
- `municipality`
- `purok`

## Styling & UI

- Built with Tailwind CSS
- Uses shadcn/ui components
- Responsive design
- Dark/light mode support
- Color-coded status badges

## State Management

- **React Query** for server state management
- **useState** for local component state
- Automatic cache invalidation on mutations
- Query key structure: `vendor-applications`, `rider-applications`

## Error Handling

- Try-catch blocks in service functions
- Toast notifications for user feedback
- Graceful error messages
- Loading states during async operations

## Performance Optimizations

- Lazy loading of pages
- Query caching with React Query
- Memoized components
- Efficient re-renders with proper dependency arrays

## Code Quality

- **TypeScript** for type safety
- **Clean Code Principles**
  - Single responsibility principle
  - DRY (Don't Repeat Yourself)
  - Proper separation of concerns
  - Meaningful variable and function names
- **Consistent Formatting** with ESLint

## Next Steps / Future Enhancements

1. Add search functionality
2. Add sorting by different criteria
3. Bulk actions (approve/reject multiple)
4. Email notifications to applicants
5. Document verification view
6. Comments/discussion thread on applications
7. Audit logs for approval/rejection history
8. Export applications to CSV/PDF

## Contributing

When adding new features:

1. Follow the existing code structure
2. Add proper TypeScript types
3. Update documentation
4. Test thoroughly
5. Ensure responsive design
