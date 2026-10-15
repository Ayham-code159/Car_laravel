import { api } from "../../lib/api/client";
import type {
  ApiEnvelope,
  BookingReceipt,
  BookingRequest,
} from "../../types/api";
export async function createBooking(values: BookingRequest) {
  const response = await api.post<ApiEnvelope<BookingReceipt>>(
    "/booking-requests",
    values,
  );
  return response.data.data;
}
