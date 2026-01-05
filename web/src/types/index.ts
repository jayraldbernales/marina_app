export type UserRole = 'admin' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  productCount: number;
  joinedDate: string;
  totalSales: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerName: string;
  vendorName: string;
  status: 'pending' | 'accepted' | 'delivered' | 'cancelled';
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
  viewerCount: number;
}

export interface ChartData {
  name: string;
  orders: number;
  sales: number;
}
