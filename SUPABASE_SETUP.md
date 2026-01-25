# Supabase Registration Integration Setup Guide

## Overview

The vendor and rider registration forms have been integrated with Supabase. This guide explains how to set up the Supabase storage bucket and configure RLS policies.

## 1. Create Storage Bucket

### Steps to Create the "verifications" Bucket:

1. **Log in to Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to Storage**
   - Click on "Storage" in the left sidebar
   - Click "Create a new bucket"

3. **Configure the Bucket**
   - **Name**: `verifications`
   - **Public/Private**: Make it **Private** (to restrict access)
   - Click "Create bucket"

### Storage Bucket Structure

The bucket will automatically organize files by the following structure:

```
verifications/
├── vendor/
│   └── {user_id}/
│       ├── valid-id-front-{timestamp}.jpg
│       ├── valid-id-back-{timestamp}.jpg
│       ├── selfie-{timestamp}.jpg
│       └── optional-doc-{timestamp}.jpg
└── rider/
    └── {user_id}/
        ├── drivers-license-front-{timestamp}.jpg
        ├── drivers-license-back-{timestamp}.jpg
        ├── selfie-with-id-{timestamp}.jpg
        └── motorcycle-registration-{timestamp}.jpg
```

## 2. Configure Storage Policies (RLS)

Since the bucket is private, you need to set up RLS policies to allow authenticated users to upload files.

### Adding Storage Policies:

1. **In the Supabase Dashboard**, go to **Storage** → **verifications** → **Policies**

2. **Create Policy for Upload (INSERT)**
   - **Policy name**: `Users can upload their own verification documents`
   - **Operation**: INSERT
   - **Target**: All files
   - **Policy expression**:

   ```sql
   (auth.uid()::text = (storage.foldername(name))[2])
   ```

   This ensures users can only upload to their own `{user_id}` folder.

3. **Create Policy for Read (SELECT)**
   - **Policy name**: `Users can view their own verification documents`
   - **Operation**: SELECT
   - **Target**: All files
   - **Policy expression**:

   ```sql
   (auth.uid()::text = (storage.foldername(name))[2])
   ```

4. **Optional: Policy for Admin**
   - If you want admins to access all files, create a policy:
   - **Policy name**: `Admin can view all verification documents`
   - **Operation**: SELECT
   - **Target**: All files
   - **Policy expression**:
   ```sql
   (auth.jwt()->'app_metadata'->'role') = '"admin"'
   ```

## 3. Database Tables Setup

All required tables should already be created with the following structure:

### profiles

```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  avatar_url VARCHAR,
  full_name VARCHAR,
  mobile_number VARCHAR,
  role VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### addresses

```sql
CREATE TABLE addresses (
  address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id),
  full_address VARCHAR,
  purok VARCHAR,
  barangay VARCHAR,
  municipality VARCHAR,
  address_type VARCHAR,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### vendor_profiles

```sql
CREATE TABLE vendor_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(user_id),
  avatar_url VARCHAR,
  shop_name VARCHAR,
  gcash_number VARCHAR,
  approval_status VARCHAR DEFAULT 'pending',
  approval_notes VARCHAR,
  agreed_to_terms BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### rider_profiles

```sql
CREATE TABLE rider_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(user_id),
  avatar_url VARCHAR,
  vehicle_type VARCHAR,
  license_plate VARCHAR,
  approval_status VARCHAR DEFAULT 'pending',
  approval_notes VARCHAR,
  gcash_number VARCHAR,
  emergency_contact_name VARCHAR,
  emergency_contact_number VARCHAR,
  agreed_to_terms BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_verifications

```sql
CREATE TABLE user_verifications (
  verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id),
  status VARCHAR DEFAULT 'pending',
  is_required BOOLEAN DEFAULT TRUE,
  document_type VARCHAR,
  file_url VARCHAR,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  notes VARCHAR
);
```

## 4. RLS Policies for Database Tables

All the required policies have been set up. Here's a summary:

### profiles

- **profiles_insert_own**: INSERT - No restrictions (creates own profile)
- **Users can view own profile**: SELECT - `(auth.uid() = user_id)`
- **Users can update own profile**: UPDATE - `(auth.uid() = user_id)`

### addresses

- **Users can insert own addresses**: INSERT - No restrictions
- **Users can view own addresses**: SELECT - `(auth.uid() = user_id)`
- **Users can update own addresses**: UPDATE - `(auth.uid() = user_id)`

### vendor_profiles

- **vendor_profiles_insert_own**: INSERT - No restrictions
- **vendor_profiles_select_own**: SELECT - `(auth.uid() = user_id)`
- **vendor_profiles_update_own**: UPDATE - `(auth.uid() = user_id)`

### rider_profiles

- **rider_profiles_insert_own**: INSERT - No restrictions
- **rider_profiles_select_own**: SELECT - `(auth.uid() = user_id)`
- **rider_profiles_update_own**: UPDATE - `(auth.uid() = user_id)`

### user_verifications

- **user_verifications_insert_own**: INSERT - No restrictions
- **user_verifications_select_own**: SELECT - `(auth.uid() = user_id)`
- **user_verifications_update_own**: UPDATE - `(auth.uid() = user_id)`

## 5. Code Implementation

### File Structure

```
mobile/
├── lib/
│   ├── supabase.ts (existing)
│   └── registrationService.ts (NEW)
├── components/
│   └── registration/
│       ├── VendorRegistration.tsx (UPDATED)
│       ├── RiderRegistration.tsx (UPDATED)
│       └── AddressForm.tsx (UPDATED)
```

### Key Changes Made

#### registrationService.ts (NEW)

- `uploadImageToStorage()`: Uploads images to Supabase Storage
- `saveVendorRegistration()`: Saves vendor profile, address, and verification records
- `saveRiderRegistration()`: Saves rider profile, address, and verification records

#### VendorRegistration.tsx (UPDATED)

- Added `isLoading` state for submission feedback
- Updated `handleSubmit()` to save data to Supabase
- Passes municipality to AddressForm
- Shows loading indicator during submission

#### RiderRegistration.tsx (UPDATED)

- Added `isLoading` state for submission feedback
- Updated `handleSubmit()` to save data to Supabase
- Passes municipality to AddressForm
- Shows loading indicator during submission

#### AddressForm.tsx (UPDATED)

- Added `onMunicipalityChange` callback prop
- Passes municipality value to parent components

## 6. Testing the Integration

### Test Vendor Registration:

1. Navigate to the vendor registration screen
2. Fill in all required fields
3. Upload all required documents (ID front, selfie)
4. Accept terms and conditions
5. Click "Submit Registration"
6. Check Supabase for:
   - New record in `vendor_profiles`
   - New record in `addresses`
   - New records in `user_verifications`
   - Documents in `verifications/vendor/{user_id}/` bucket

### Test Rider Registration:

1. Navigate to the rider registration screen
2. Fill in all required fields
3. Upload all required documents (license front, selfie)
4. Accept terms and conditions
5. Click "Submit Registration"
6. Check Supabase for:
   - New record in `rider_profiles`
   - New record in `addresses`
   - New records in `user_verifications`
   - Documents in `verifications/rider/{user_id}/` bucket

## 7. Troubleshooting

### Issue: "Storage bucket not found"

- **Solution**: Ensure the "verifications" bucket is created and not deleted

### Issue: "Permission denied" when uploading

- **Solution**: Check that storage RLS policies are properly configured

### Issue: "Foreign key constraint failed"

- **Solution**: Ensure the user profile exists in the `profiles` table before registering

### Issue: Images not uploading

- **Solution**:
  - Check that the user has camera permissions
  - Verify the image file is valid (JPEG)
  - Check network connectivity

## 8. Admin Dashboard Integration (Future)

To manage registrations, create an admin dashboard that:

1. Views all pending registrations (status = 'pending')
2. Displays verification documents from the storage bucket
3. Allows approval/rejection with notes
4. Updates `approval_status` and `approval_notes` in respective profiles

## 9. Email Notifications (Future)

Consider adding:

- Email when user submits registration
- Email when registration is approved/rejected
- Email reminders for pending approvals to admins
