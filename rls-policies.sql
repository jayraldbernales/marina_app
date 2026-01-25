-- ============================================
-- RLS POLICY UPDATES FOR PROFILES TABLE
-- ============================================

-- Drop existing conflicting policies (if needed)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- Policy: Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON profiles
FOR SELECT
TO public
USING (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
);

-- Keep existing insert policy (unchanged)
-- CREATE POLICY "profiles_insert_own" ON profiles
-- FOR INSERT TO public
-- WITH CHECK ((SELECT auth.uid() AS uid) = user_id);

-- Keep existing update policy (unchanged)
-- CREATE POLICY "profiles_update_own" ON profiles
-- FOR UPDATE TO public
-- USING ((SELECT auth.uid() AS uid) = user_id);


-- ============================================
-- RLS POLICY UPDATES FOR USER_VERIFICATIONS TABLE
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own verifications" ON user_verifications;
DROP POLICY IF EXISTS "Admins can read all verifications" ON user_verifications;
DROP POLICY IF EXISTS "Users can insert own verifications" ON user_verifications;

-- Policy: Users can read their own verification documents
CREATE POLICY "Users can read own verifications"
ON user_verifications
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- Policy: Admins can read all verification documents
CREATE POLICY "Admins can read all verifications"
ON user_verifications
FOR SELECT
TO public
USING (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
);

-- Policy: Users can insert their own verification documents
CREATE POLICY "Users can insert own verifications"
ON user_verifications
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own verification documents
CREATE POLICY "Users can update own verifications"
ON user_verifications
FOR UPDATE
TO public
USING (auth.uid() = user_id);


-- ============================================
-- RLS POLICY UPDATES FOR STORAGE.OBJECTS (Verifications Bucket)
-- ============================================

-- Drop existing bucket policies
DROP POLICY IF EXISTS "Users can read own verification images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own verification images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read verification images" ON storage.objects;

-- Policy: Users can read their own verification images
-- Matches paths like: vendor/{user_id}/* or rider/{user_id}/*
CREATE POLICY "Users can read own verification images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verifications' AND
  (
    path ILIKE (auth.uid()::text || '%') OR
    path ILIKE 'vendor/' || auth.uid()::text || '/%' OR
    path ILIKE 'rider/' || auth.uid()::text || '/%'
  )
);

-- Policy: Admins can read all verification images
CREATE POLICY "Admins can read all verification images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verifications' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Users can upload their own verification images
CREATE POLICY "Users can upload own verification images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verifications' AND
  (
    path ILIKE 'vendor/' || auth.uid()::text || '/%' OR
    path ILIKE 'rider/' || auth.uid()::text || '/%'
  )
);

-- Policy: Users can delete their own verification images
CREATE POLICY "Users can delete own verification images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verifications' AND
  (
    path ILIKE 'vendor/' || auth.uid()::text || '/%' OR
    path ILIKE 'rider/' || auth.uid()::text || '/%'
  )
);


-- ============================================
-- NOTES
-- ============================================
-- These policies ensure:
-- 1. Regular users can only read/write their own data
-- 2. Admins (users with role = 'admin') can read all profiles and verifications
-- 3. The "with_check" for INSERT/UPDATE still restricts to the user's own records
-- 4. Admin users can still only manage their own records for INSERT/UPDATE
--    (if you want admins to update anyone's records, additional policies are needed)
--
-- Bucket Policy Key Changes:
-- - Changed "Users can read own verification images" from role 'public' to 'authenticated'
-- - Added path matching with ILIKE to match bucket structure (vendor/{user_id}/*, rider/{user_id}/*)
-- - Admins can read all files in the verifications bucket
-- - Added DELETE policy so users can remove their own verification images
