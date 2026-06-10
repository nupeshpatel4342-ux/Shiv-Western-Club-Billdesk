export interface Item {
  id: number;
  name: string;
  sku?: string;
  qty: number;
  price: number;
  discount?: number;
}

export interface Customer {
  name: string;
  phone: string;
  address?: string;
  isGuest?: boolean;
}

export interface Bill {
  id: string;
  date: string;
  time: string;
  timestamp: number; // Added for reporting
  customer: string; // For compatibility with exportUtils
  mobile?: string;  // For compatibility with exportUtils
  customerObj: Customer; // My implementation
  items: Item[];
  subtotal: number;
  discountPct: number;
  discountAmt: number;
  discount: number; // My implementation
  grand: number;    // For compatibility with exportUtils
  total: number;    // My implementation
  paidAmount: number; // For Udhar system
  balance: number;    // For Udhar system
  paymentStatus: "PAID" | "UNPAID";
  paymentMethod: "CASH" | "CARD" | "UPI" | "MIXED" | "UDHAR";
  createdBy?: string; // UID of the user who created the bill
}

export type Role = "admin" | "staff" | "owner" | "customer" | "manager";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: Role;
  createdAt: number;
  isGuest?: boolean;
}

export interface Settings {
  shopName: string;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  taxRate?: number;
  gstId?: string;
  upiQrCode?: string; // Base64 string of the QR code image
  logo?: string;      // Base64 string of the shop logo
  invoiceLayout?: 'standard' | 'minimal' | 'modern';
}

export interface CatalogProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  createdAt: number;
  brand?: string;
  category?: string;
  image?: string;
  sellingPrice?: number;
  stock?: number;
  size?: string;
  color?: string;
}

