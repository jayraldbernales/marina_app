import { supabase } from "./supabase";

/* ================================
   Types
================================ */

export interface VendorApplication {
  user_id: string;
  shop_name: string;
  email?: string;
  mobile_number?: string;
  gcash_number: string;
  approval_status: "pending" | "approved" | "rejected";
  approval_notes?: string;
  created_at: string;
  full_name?: string;
  avatar_url?: string;
  barangay: string;
  municipality: string;
  purok: string;
}

export interface RiderApplication {
  user_id: string;
  email?: string;
  vehicle_type: string;
  license_plate: string;
  approval_status: "pending" | "approved" | "rejected";
  approval_notes?: string;
  gcash_number: string;
  emergency_contact_name: string;
  emergency_contact_number: string;
  created_at: string;
  full_name?: string;
  avatar_url?: string;
  mobile_number?: string;
  barangay: string;
  municipality: string;
}

// Helper function to get proper image URLs
const getImageUrl = (path: string | undefined | null) => {
  if (!path) return null;

  // If it's already a full URL, return it
  if (path.startsWith("http")) return path;

  // If it's a storage path, try to get public URL
  try {
    const { data } = supabase.storage
      .from("verifications") // or 'avatars' or whatever bucket name
      .getPublicUrl(path);

    return data.publicUrl;
  } catch (error) {
    console.error("Error getting image URL:", error);
    return null;
  }
};

/* ================================
   Vendor Applications
================================ */

export const fetchVendorApplications = async (
  status?: "pending" | "approved" | "rejected",
): Promise<VendorApplication[]> => {
  try {
    console.log("Fetching vendor applications with status:", status);

    // Step 1: Fetch vendor profiles
    let vendorQuery = supabase
      .from("vendor_profiles")
      .select(
        "user_id, shop_name, gcash_number, approval_status, approval_notes, created_at, avatar_url",
      )
      .order("created_at", { ascending: false });

    if (status) {
      vendorQuery = vendorQuery.eq("approval_status", status);
    }

    const { data: vendors, error: vendorError } = await vendorQuery;

    if (vendorError) {
      console.error("Supabase vendor error:", vendorError);
      throw vendorError;
    }

    if (!vendors || vendors.length === 0) {
      console.log("No vendor applications found");
      return [];
    }

    // Step 2: Fetch all profiles and addresses in parallel
    const userIds = vendors.map((v) => v.user_id);

    const [profileResponse, addressResponse] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, full_name, email, mobile_number")
        .in("user_id", userIds),
      supabase
        .from("addresses")
        .select("user_id, barangay, municipality, purok, is_default")
        .in("user_id", userIds),
    ]);

    const profiles = profileResponse.data || [];
    const addresses = addressResponse.data || [];

    // Log errors if they occur but continue
    if (profileResponse.error) {
      console.warn("Warning fetching profiles:", profileResponse.error);
    }
    if (addressResponse.error) {
      console.warn("Warning fetching addresses:", addressResponse.error);
    }

    // Step 3: Combine data in application layer
    return vendors.map((vendor) => {
      const profile = profiles.find((p) => p.user_id === vendor.user_id);
      const vendorAddresses =
        addresses.filter((a) => a.user_id === vendor.user_id) || [];

      // Find default address or take first one
      const defaultAddress =
        vendorAddresses.find((a) => a.is_default) || vendorAddresses[0];

      return {
        user_id: vendor.user_id,
        shop_name: vendor.shop_name || "No shop name",
        email: profile?.email || "No email",
        mobile_number: profile?.mobile_number || "No phone",
        gcash_number: vendor.gcash_number || "No GCash",
        approval_status: vendor.approval_status || "pending",
        approval_notes: vendor.approval_notes || "",
        created_at: vendor.created_at,
        full_name: profile?.full_name || "Unknown",
        avatar_url: getImageUrl(vendor.avatar_url) || "",
        barangay: defaultAddress?.barangay || "Not specified",
        municipality: defaultAddress?.municipality || "Not specified",
        purok: defaultAddress?.purok || "Not specified",
      };
    });
  } catch (error) {
    console.error("Error fetching vendor applications:", error);
    throw error;
  }
};

export const updateVendorApplicationStatus = async (
  userId: string,
  status: "approved" | "rejected",
  notes?: string,
): Promise<void> => {
  console.log("Updating vendor application:", { userId, status, notes });

  const { data, error } = await supabase
    .from("vendor_profiles")
    .update({
      approval_status: status,
      approval_notes: notes || null,
    })
    .eq("user_id", userId)
    .select();

  console.log("Update result:", { data, error });

  if (error) {
    console.error("Error updating vendor application:", error);
    throw new Error(`Failed to update vendor application: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("No vendor profile found with that user ID");
  }
};

/* ================================
   Rider Applications
================================ */

export const fetchRiderApplications = async (
  status?: "pending" | "approved" | "rejected",
): Promise<RiderApplication[]> => {
  try {
    console.log("Fetching rider applications with status:", status);

    // Step 1: Fetch rider profiles
    let riderQuery = supabase
      .from("rider_profiles")
      .select(
        "user_id, vehicle_type, license_plate, approval_status, approval_notes, gcash_number, emergency_contact_name, emergency_contact_number, created_at, avatar_url",
      )
      .order("created_at", { ascending: false });

    if (status) {
      riderQuery = riderQuery.eq("approval_status", status);
    }

    const { data: riders, error: riderError } = await riderQuery;

    if (riderError) {
      console.error("Supabase rider error:", riderError);
      throw riderError;
    }

    if (!riders || riders.length === 0) {
      console.log("No rider applications found");
      return [];
    }

    // Step 2: Fetch all profiles and addresses in parallel
    const userIds = riders.map((r) => r.user_id);

    const [profileResponse, addressResponse] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, full_name, email, mobile_number")
        .in("user_id", userIds),
      supabase
        .from("addresses")
        .select("user_id, barangay, municipality, is_default")
        .in("user_id", userIds),
    ]);

    const profiles = profileResponse.data || [];
    const addresses = addressResponse.data || [];

    // Log errors if they occur but continue
    if (profileResponse.error) {
      console.warn("Warning fetching profiles:", profileResponse.error);
    }
    if (addressResponse.error) {
      console.warn("Warning fetching addresses:", addressResponse.error);
    }

    // Step 3: Combine data in application layer
    return riders.map((rider) => {
      const profile = profiles.find((p) => p.user_id === rider.user_id);
      const riderAddresses =
        addresses.filter((a) => a.user_id === rider.user_id) || [];

      // Find default address or take first one
      const defaultAddress =
        riderAddresses.find((a) => a.is_default) || riderAddresses[0];

      return {
        user_id: rider.user_id,
        email: profile?.email || "No email",
        vehicle_type: rider.vehicle_type || "Not specified",
        license_plate: rider.license_plate || "Not specified",
        approval_status: rider.approval_status || "pending",
        approval_notes: rider.approval_notes || "",
        gcash_number: rider.gcash_number || "No GCash",
        emergency_contact_name: rider.emergency_contact_name || "Not specified",
        emergency_contact_number:
          rider.emergency_contact_number || "Not specified",
        created_at: rider.created_at,
        full_name: profile?.full_name || "Unknown",
        avatar_url: getImageUrl(rider.avatar_url) || "",
        mobile_number: profile?.mobile_number || "No phone",
        barangay: defaultAddress?.barangay || "Not specified",
        municipality: defaultAddress?.municipality || "Not specified",
      };
    });
  } catch (error) {
    console.error("Error fetching rider applications:", error);
    throw error;
  }
};

export const updateRiderApplicationStatus = async (
  userId: string,
  status: "approved" | "rejected",
  notes?: string,
): Promise<void> => {
  console.log("Updating rider application:", { userId, status, notes });

  const { data, error } = await supabase
    .from("rider_profiles")
    .update({
      approval_status: status,
      approval_notes: notes || null,
    })
    .eq("user_id", userId)
    .select();

  console.log("Update result:", { data, error });

  if (error) {
    console.error("Error updating rider application:", error);
    throw new Error(`Failed to update rider application: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("No rider profile found with that user ID");
  }
};

/* ================================
   Statistics
================================ */

export const fetchApplicationStats = async () => {
  const [vendors, riders] = await Promise.all([
    fetchVendorApplications(),
    fetchRiderApplications(),
  ]);

  return {
    vendors: {
      pending: vendors.filter((v) => v.approval_status === "pending").length,
      approved: vendors.filter((v) => v.approval_status === "approved").length,
      rejected: vendors.filter((v) => v.approval_status === "rejected").length,
    },
    riders: {
      pending: riders.filter((r) => r.approval_status === "pending").length,
      approved: riders.filter((r) => r.approval_status === "approved").length,
      rejected: riders.filter((r) => r.approval_status === "rejected").length,
    },
  };
};
