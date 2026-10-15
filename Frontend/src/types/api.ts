export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  errors: string[];
  data: T;
}
export interface Brand {
  id: number;
  name: string;
  slug: string;
}
export interface Category {
  id: number;
  name: string;
  slug: string;
}
export interface Location {
  id: number;
  name: string;
  city: string;
  country: string;
  isActive: boolean;
}
export interface Media {
  id: number;
  url: string;
  thumbnailUrl: string;
  isPrimary: boolean;
  order: number;
}
export type Transmission = "automatic" | "manual";
export type FuelType = "petrol" | "diesel" | "hybrid" | "electric";
export interface Car {
  id: number;
  slug: string;
  model: string;
  year: number;
  brand: Brand;
  category: Category;
  location: Location;
  pricePerDay: string;
  currency: string;
  transmission: Transmission;
  fuelType: FuelType;
  seats: number;
  luggageCount: number;
  description: string | null;
  isFeatured: boolean;
  primaryImageUrl: string | null;
  images: Media[];
}
export interface Pagination {
  currentPage: number;
  perPage: number;
  lastPage: number;
  total: number;
  from: number | null;
  to: number | null;
}
export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}
export type Sort =
  "newest" | "price_asc" | "price_desc" | "year_desc" | "model_asc";
export interface SearchFilters {
  brand?: string;
  model?: string;
  search?: string;
  category?: string;
  location?: string;
  min_price?: string;
  max_price?: string;
  transmission?: Transmission;
  fuel_type?: FuelType;
  pickup_at?: string;
  return_at?: string;
  sort?: Sort;
  page?: number;
  per_page?: number;
}
export interface BookingRequest {
  car_slug: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  pickup_location_id: number;
  pickup_at: string;
  return_at: string;
  notes?: string | null;
}
export interface BookingReceipt {
  bookingReference: string;
  status: "pending";
  estimatedTotal: string;
  currency: string;
}
