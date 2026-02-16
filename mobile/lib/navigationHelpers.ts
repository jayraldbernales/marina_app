import { router } from "expo-router";

export const navigateToVendorFlow = (status: string, vendorNotes?: string) => {
  switch (status) {
    case "approved":
      router.push("/(seller-tabs)");
      break;
    case "pending":
      router.push("/registration/pending-vendor");
      break;
    case "rejected":
      // Pass notes as query parameter
      router.push({
        pathname: "/registration/rejected-vendor",
        params: { approval_notes: vendorNotes || "" },
      } as any);
      break;
    default:
      router.push("/registration/welcome-vendor");
      break;
  }
};

export const navigateToRiderFlow = (status: string, riderNotes?: string) => {
  switch (status) {
    case "approved":
      router.push("/(rider-tabs)");
      break;
    case "pending":
      router.push("/registration/pending-rider");
      break;
    case "rejected":
      // Pass notes as query parameter
      router.push({
        pathname: "/registration/rejected-rider",
        params: { approval_notes: riderNotes || "" },
      } as any);
      break;
    default:
      router.push("/registration/welcome-rider");
      break;
  }
};
