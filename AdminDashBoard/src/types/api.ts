export interface Envelope<T> {
  success: boolean;
  message: string;
  errors: string[];
  data: T;
}
export interface Pagination {
  currentPage: number;
  perPage: number;
  lastPage: number;
  total: number;
  from: number | null;
  to: number | null;
}
export interface Page<T> {
  items: T[];
  pagination: Pagination;
}
export interface Admin {
  id: number;
  username: string;
}
export interface AuthResult {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  admin: Admin;
}
export interface Category {
  id: number;
  name: string;
  slug: string;
}
export type Brand = Category;
export interface Location {
  id: number;
  name: string;
  city: string;
  country: string;
  isActive: boolean;
}
export type OperationalStatus = "active" | "maintenance" | "inactive";
export type BookingStatus =
  "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
export interface Media {
  id: number;
  url: string;
  thumbnailUrl: string;
  isPrimary: boolean;
  order: number;
}
export interface Block {
  id: number;
  carId: number;
  startAt: string;
  endAt: string;
  reason: string;
}
export interface Car {
  id: number;
  slug: string;
  inventoryCode: string;
  model: string;
  year: number;
  brand: Brand;
  category: Category;
  location: Location;
  pricePerDay: string;
  currency: string;
  transmission: "automatic" | "manual";
  fuelType: "petrol" | "diesel" | "hybrid" | "electric";
  seats: number;
  luggageCount: number;
  description: string | null;
  operationalStatus: OperationalStatus;
  isPublished: boolean;
  isFeatured: boolean;
  primaryImageUrl: string | null;
  images: Media[];
  archivedAt: string | null;
  blockedPeriods?: Block[];
}
export interface Booking {
  id: number;
  bookingReference: string;
  car: Car;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  pickupLocation: Location;
  pickupAt: string;
  returnAt: string;
  estimatedTotal: string;
  currency: string;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
}
export interface Dashboard {
  totalCars: number;
  publishedCars: number;
  activeCars: number;
  carsUnderMaintenance: number;
  pendingBookingRequests: number;
  confirmedBookings: number;
  completedBookings: number;
  recentBookingRequests: Booking[];
}
export type Filters = Record<string, string | number | boolean | undefined>;
