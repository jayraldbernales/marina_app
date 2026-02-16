# Applications Management System - Setup Guide

## Quick Start

### 1. Database Requirements

Your Supabase database should have the following structure (which matches your ERD):

```sql
-- Ensure these tables exist with proper relationships
- auth.users (Supabase built-in)
- profiles (user_id FK → auth.users)
- vendor_profiles (user_id FK → profiles)
- rider_profiles (user_id FK → profiles)
- addresses (user_id FK → profiles)
- user_verifications (user_id FK → profiles)
```

### 2. Column Requirements

**vendor_profiles table must have:**

```
- user_id (UUID, Primary Key)
- shop_name (VARCHAR)
- approval_status (VARCHAR: 'pending', 'approved', 'rejected')
- approval_notes (TEXT, nullable)
- created_at (TIMESTAMP)
- avatar_url (VARCHAR, nullable)
- gcash_number (VARCHAR)
```

**rider_profiles table must have:**

```
- user_id (UUID, Primary Key)
- vehicle_type (VARCHAR)
- license_plate (VARCHAR)
- approval_status (VARCHAR: 'pending', 'approved', 'rejected')
- approval_notes (TEXT, nullable)
- created_at (TIMESTAMP)
- avatar_url (VARCHAR, nullable)
- gcash_number (VARCHAR)
- emergency_contact_name (VARCHAR)
- emergency_contact_number (VARCHAR)
```

**profiles table must have:**

```
- user_id (UUID, Primary Key)
- full_name (VARCHAR)
- email (VARCHAR)
- mobile_number (VARCHAR)
- avatar_url (VARCHAR, nullable)
```

**addresses table must have:**

```
- address_id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- barangay (VARCHAR)
- municipality (VARCHAR)
- purok (VARCHAR)
```

### 3. Environment Variables

Make sure your `.env` file in the web folder contains:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Install Dependencies

The feature uses these existing dependencies (no new installs needed):

- `@tanstack/react-query` - State management
- `react-router-dom` - Routing
- `lucide-react` - Icons
- `@/components/ui` - UI components (shadcn)

### 5. File Structure

All new files have been created in:

```
web/src/
├── lib/applicationService.ts                 (NEW)
├── components/admin/ApplicationCard.tsx      (NEW)
├── pages/admin/
│   ├── Applications.tsx                      (NEW)
│   ├── VendorApplications.tsx                (NEW)
│   └── RiderApplications.tsx                 (NEW)
└── components/layout/AdminSidebar.tsx        (UPDATED)
```

### 6. Verify Setup

1. **Check Sidebar**: Login as admin and verify "Applications" appears in sidebar
2. **Check Routes**: Navigate to `/admin/applications`
3. **Check Data**: Should display vendor and rider applications from Supabase

### 7. Troubleshooting

#### "No applications found"

- Ensure vendor/rider registrations exist in database
- Check that `approval_status` is set (defaults to 'pending')
- Verify relationships between tables (user_id foreign keys)

#### "Can't approve/reject"

- Check Supabase permissions on `vendor_profiles` and `rider_profiles` tables
- Verify `approval_status` column allows these string values: 'pending', 'approved', 'rejected'
- Check browser console for error messages

#### "Images not displaying"

- Verify `avatar_url` fields are properly populated
- Check if URLs are valid/accessible

#### Missing Icons

- Ensure `lucide-react` is installed: `npm install lucide-react`

### 8. Customization

#### Change Status Colors

Edit [ApplicationCard.tsx](../src/components/admin/ApplicationCard.tsx#L19-L28):

```typescript
const getStatusStyles = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    // ... modify these hex colors
  }
};
```

#### Modify Form Fields

Edit the `ApplicationCard` component to show/hide fields:

```typescript
{type === "vendor" ? (
  // Vendor-specific fields
) : (
  // Rider-specific fields
)}
```

#### Change Approval Workflow

Edit [applicationService.ts](../src/lib/applicationService.ts):

- Modify `updateVendorApplicationStatus()`
- Modify `updateRiderApplicationStatus()`

### 9. Testing

#### Manual Testing Checklist:

- [ ] Admin can navigate to Applications page
- [ ] Vendor tab shows vendor applications
- [ ] Rider tab shows rider applications
- [ ] Can approve pending applications
- [ ] Can reject pending applications
- [ ] Notes appear when provided
- [ ] Status badges update after approval/rejection
- [ ] Statistics update correctly
- [ ] Filter tabs work (pending, approved, rejected, all)

#### Test Data

Create test data in Supabase:

```sql
-- Add test vendor
INSERT INTO vendor_profiles (user_id, shop_name, approval_status, gcash_number, created_at)
VALUES ('test-user-id', 'Test Shop', 'pending', '09123456789', NOW());

-- Add test rider
INSERT INTO rider_profiles (user_id, vehicle_type, license_plate, approval_status, created_at)
VALUES ('test-rider-id', 'Motorcycle', 'ABC1234', 'pending', NOW());
```

### 10. Deployment

1. Build the project: `npm run build`
2. Deploy to hosting (Vercel, Netlify, etc.)
3. Test admin functionality in production environment

## Features Summary

✅ **Vendor Applications**

- View pending, approved, rejected applications
- Approve with optional notes
- Reject with required reason

✅ **Rider Applications**

- View pending, approved, rejected applications
- Same approve/reject workflow

✅ **Statistics**

- Total count per type
- Breakdown by status

✅ **UX**

- Clean card-based layout
- Color-coded status badges
- Responsive design
- Toast notifications
- Loading states

## Support & Documentation

- Full documentation: See [APPLICATIONS_FEATURE.md](APPLICATIONS_FEATURE.md)
- Code comments explain key logic
- TypeScript types ensure correctness

---

**Ready to use!** Start by navigating to `/admin/applications` in your admin dashboard.
