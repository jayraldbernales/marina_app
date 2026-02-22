export type UserRole = "admin" | "viewer" | "user";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  banned?: boolean;
  createdAt?: string;
  mobileNumber?: string; // Added mobile number
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  ownerName?: string;
  mobileNumber?: string;
  status: "active" | "banned";
  productCount: number;
  joinedDate: string;
  totalSales: number;
  shopBanned?: boolean;
  businessAddress?: string;
}

export interface Rider {
  id: string;
  name: string;
  email: string;
  mobileNumber?: string;
  status: "active" | "pending" | "banned";
  vehicleType: string;
  licensePlate: string;
  isAvailable: boolean;
  joinedDate: string;
  deliveryCount: number;
  totalEarnings: number;
  riderBanned?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerName: string;
  vendorName: string;
  status: "pending" | "accepted" | "delivered" | "cancelled";
  total: number;
  items: number;
  date: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  totalOrders: number;
  completedTransactions: number;
  buyerCount: number;
  riderCount: number;
}

export interface ChartData {
  name: string;
  orders: number;
  sales: number;
}
