import { z } from "zod";
import { validatePeriod } from "../search/validation";
export const bookingSchema = z
  .object({
    customer_name: z.string().trim().min(1, "Please enter your name.").max(150),
    customer_phone: z
      .string()
      .trim()
      .regex(
        /^\+?[0-9][0-9 ()-]{6,24}[0-9]$/,
        "Enter a valid phone number, including your country code.",
      )
      .refine((v) => {
        const n = v.replace(/\D/g, "").length;
        return n >= 7 && n <= 15;
      }, "Use between 7 and 15 digits."),
    customer_email: z.union([
      z.literal(""),
      z.string().trim().email("Enter a valid email address.").max(255),
    ]),
    pickup_location_id: z
      .string()
      .regex(/^[1-9]\d*$/, "Choose a pickup location."),
    pickup_at: z.string(),
    return_at: z.string(),
    notes: z.string().trim().max(5000),
  })
  .superRefine((v, c) => validatePeriod(v, c));
export type BookingValues = z.infer<typeof bookingSchema>;
