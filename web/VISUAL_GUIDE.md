# Applications Management System - Visual & Navigation Guide

## 🗂️ File Organization

```
marina_app/
└── web/src/
    ├── lib/
    │   └── applicationService.ts          ← Data/API layer
    │       ├── fetchVendorApplications()
    │       ├── updateVendorApplicationStatus()
    │       ├── fetchRiderApplications()
    │       ├── updateRiderApplicationStatus()
    │       └── fetchApplicationStats()
    │
    ├── components/
    │   ├── admin/
    │   │   └── ApplicationCard.tsx         ← Reusable component
    │   │       ├── Approve dialog
    │   │       ├── Reject dialog
    │   │       └── Status badge
    │   │
    │   └── layout/
    │       └── AdminSidebar.tsx            ← UPDATED
    │           └── "Applications" menu item → /admin/applications
    │
    ├── pages/
    │   └── admin/
    │       ├── Applications.tsx            ← Main hub (Vendors | Riders tabs)
    │       ├── VendorApplications.tsx      ← Vendor details page
    │       └── RiderApplications.tsx       ← Rider details page
    │
    └── App.tsx                             ← UPDATED with /admin/applications route
```

## 🗺️ Navigation Flow

```
Admin Dashboard
    ↓
Sidebar Click: "Applications"
    ↓
/admin/applications (Applications.tsx)
    ├─→ Tab: "Vendor Applications"
    │   ↓
    │   VendorApplications.tsx
    │   ├─ Statistics Cards
    │   ├─ Filter Tabs (All, Pending, Approved, Rejected)
    │   └─ Application Grid
    │       └─ ApplicationCard x N
    │           ├─ Approve button
    │           └─ Reject button
    │
    └─→ Tab: "Rider Applications"
        ↓
        RiderApplications.tsx
        ├─ Statistics Cards
        ├─ Filter Tabs (All, Pending, Approved, Rejected)
        └─ Application Grid
            └─ ApplicationCard x N
                ├─ Approve button
                └─ Reject button
```

## 🎨 UI Layout

### Applications Hub Page

```
┌─────────────────────────────────────────┐
│ 📋 Applications                          │
│ Manage vendor and rider applications    │
├─────────────────────────────────────────┤
│ [Vendor Applications] [Rider Applications] │
├─────────────────────────────────────────┤
│ (Content of selected tab)               │
└─────────────────────────────────────────┘
```

### Vendor/Rider Applications Page

```
┌─────────────────────────────────────────────────────────┐
│ 🏪 Vendor Applications                                  │
│ Review and manage vendor registration applications      │
├─────────────────────────────────────────────────────────┤
│ Statistics:                                             │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│ │ Total        │ │ Pending  ⏳  │ │ Approved ✅  │   │
│ │     12       │ │      5       │ │       7      │   │
│ └──────────────┘ └──────────────┘ └──────────────┘   │
│ ┌──────────────┐                                       │
│ │ Rejected ❌  │                                       │
│ │      0       │                                       │
│ └──────────────┘                                       │
├─────────────────────────────────────────────────────────┤
│ [All 12] [Pending 5] [Approved 7] [Rejected 0]        │
├─────────────────────────────────────────────────────────┤
│ Applications Grid:                                      │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 👤 Shop Name                        [Pending] ⏳    ││
│ │    Vendor Application                              ││
│ ├──────────────────────────────────────────────────────┤│
│ │ Email: vendor@email.com      Phone: 09123456789    ││
│ │ 📍 Barangay, Municipality                          ││
│ ├──────────────────────────────────────────────────────┤│
│ │ GCash: 09987654321                                  ││
│ │ Applied on Jan 15, 2026                            ││
│ ├──────────────────────────────────────────────────────┤│
│ │ [❌ Reject]  [✅ Approve]                           ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ (More cards...)                                      ││
│ └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### ApplicationCard Component Detail

```
┌─────────────────────────────────────────┐
│ 👤 Shop Name              [Status Badge] │  ← Avatar + Title + Status
├─────────────────────────────────────────┤
│ Vendor Application                      │  ← Subtitle
├─────────────────────────────────────────┤
│ 📧 Email              vendor@email.com  │  ← Contact info
│ 📱 Phone              09123456789       │
├─────────────────────────────────────────┤
│ 📍 Barangay, Municipality               │  ← Location
├─────────────────────────────────────────┤
│ GCash Number: 09987654321               │  ← Type-specific info
├─────────────────────────────────────────┤
│ Applied on Jan 15, 2026                 │  ← Date
├─────────────────────────────────────────┤
│ [❌ Reject]  [✅ Approve]              │  ← Actions (if pending)
└─────────────────────────────────────────┘
```

### Approval/Rejection Dialog

```
Approve Dialog:
┌────────────────────────────────────────┐
│ ✅ Approve Application                 │
├────────────────────────────────────────┤
│ Are you sure you want to approve this  │
│ vendor application? They will be able  │
│ to access their account immediately.  │
├────────────────────────────────────────┤
│ Notes (Optional)                       │
│ ┌──────────────────────────────────────┐
│ │ [Type optional notes here...]        │
│ └──────────────────────────────────────┘
├────────────────────────────────────────┤
│ [Cancel]  [Approve ✓]                 │
└────────────────────────────────────────┘

Reject Dialog:
┌────────────────────────────────────────┐
│ ❌ Reject Application                  │
├────────────────────────────────────────┤
│ Please provide a reason for rejecting  │
│ this vendor application.               │
├────────────────────────────────────────┤
│ Reason for Rejection * (Required)      │
│ ┌──────────────────────────────────────┐
│ │ [Type rejection reason...]           │
│ └──────────────────────────────────────┘
├────────────────────────────────────────┤
│ [Cancel]  [Reject ✗]                  │
└────────────────────────────────────────┘
```

## 🔄 Data Flow Diagram

```
Component Mount
    ↓
useQuery("vendor-applications")
    ↓
applicationService.fetchVendorApplications()
    ↓
Supabase Query
├─ SELECT from vendor_profiles
├─ JOIN profiles
├─ JOIN addresses
└─ ORDER BY created_at DESC
    ↓
Data Return
    ↓
Component Render
├─ Calculate Stats
├─ Render Cards
└─ Filter by Tab
    ↓
User Click: Approve/Reject
    ↓
Modal Dialog Open
    ↓
User Submits
    ↓
useMutation("updateVendorApplicationStatus")
    ↓
applicationService.updateVendorApplicationStatus()
    ↓
Supabase Update
├─ UPDATE vendor_profiles
└─ SET approval_status, approval_notes
    ↓
Toast Notification
    ↓
Query Invalidation
    ↓
Re-fetch Data
    ↓
UI Updates
```

## 🎯 User Workflows

### Approving a Vendor Application

```
1. Login to Admin Panel
2. Click "Applications" in Sidebar
3. Vendor Applications Tab is active
4. See application cards in "Pending" tab
5. Click "Approve" button on desired card
6. Dialog appears
7. (Optional) Add approval notes
8. Click "Approve ✓"
9. Toast shows "Success: Vendor application approved"
10. Card disappears from Pending, appears in Approved
11. Statistics update automatically
```

### Rejecting a Rider Application

```
1. Login to Admin Panel
2. Click "Applications" in Sidebar
3. Click "Rider Applications" tab
4. See application cards in "Pending" filter
5. Click "Reject" button on desired card
6. Dialog appears with required reason field
7. Enter rejection reason (Required)
8. Click "Reject ✗"
9. Toast shows "Success: Rider application rejected"
10. Card disappears from Pending, appears in Rejected
11. Statistics update automatically
```

### Viewing Statistics

```
1. Navigate to Vendor/Rider Applications page
2. See 4 stat cards at top:
   ├─ Total Applications
   ├─ Pending (yellow)
   ├─ Approved (green)
   └─ Rejected (red)
3. Numbers update in real-time
4. Click on tab to filter and verify counts
```

## 🔌 Database Schema Mapping

```
ApplicationCard Component
    ↓
application.avatar_url        → Avatar.AvatarImage
application.full_name/shop_name → Card Title
application.approval_status   → Status Badge
application.email             → Email display
application.mobile_number     → Phone display
application.barangay          → Location display
application.municipality      → Location display
application.created_at        → Date display
```

## 🎭 State Management Flow

```
Component State:
├─ activeTab: "all" | "pending" | "approved" | "rejected"
├─ showApproveDialog: boolean
├─ showRejectDialog: boolean
├─ rejectNotes: string
├─ approveNotes: string
└─ isSubmitting: boolean

Query State (React Query):
├─ data: Application[]
├─ isLoading: boolean
├─ error: Error | null
└─ status: "pending" | "success" | "error"

Mutation State (React Query):
├─ isPending: boolean
├─ isSuccess: boolean
├─ isError: boolean
└─ error: Error | null
```

## 📱 Responsive Breakpoints

```
Desktop (> 1024px):
├─ Sidebar visible (collapsed toggle available)
├─ Stats grid: 4 columns
├─ Content width: full with padding
└─ Cards: side-by-side layout

Tablet (768px - 1024px):
├─ Sidebar: auto-collapse
├─ Stats grid: 2x2
└─ Cards: single column

Mobile (< 768px):
├─ Sidebar: hamburger menu
├─ Stats grid: 1 column
├─ Cards: stacked
└─ Buttons: full width
```

## 🔍 Debugging Guide

To check data flow:

1. Open DevTools Console
2. Check Network tab for Supabase requests
3. Check React Query DevTools
4. Log component state in browser

To test manually:

1. Add test data to Supabase manually
2. Refresh page
3. Should appear immediately
4. Click approve/reject
5. Check Supabase table - status should change

---

This visual guide helps understand the complete system architecture and user experience!
