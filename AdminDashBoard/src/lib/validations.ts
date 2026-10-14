import { z } from "zod";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "./api/client";
export const MAX_RENTAL_DAYS =
  Number(import.meta.env.VITE_MAX_RENTAL_DAYS) || 90;
export const loginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username."),
  password: z.string().min(1, "Enter your password."),
});
const id = z.string().min(1, "Select an option.");
export const carSchema = z.object({
  brand_id: id,
  category_id: id,
  location_id: id,
  inventory_code: z
    .string()
    .min(1, "Enter an inventory code.")
    .max(80)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9_-]*$/,
      "Use letters, numbers, underscores or hyphens.",
    ),
  model: z.string().trim().min(1).max(120),
  year: z
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1),
  price_per_day: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter an amount with up to two decimals.")
    .refine(
      (v) => Number(v) > 0 && Number(v) <= 99999999.99,
      "Enter a positive price below 100,000,000.",
    ),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, "Use a three-letter uppercase currency code."),
  transmission: z.enum(["automatic", "manual"]),
  fuel_type: z.enum(["petrol", "diesel", "hybrid", "electric"]),
  seats: z.number().int().min(1).max(12),
  luggage_count: z.number().int().min(0).max(20),
  description: z.string().max(10000),
  operational_status: z.enum(["active", "maintenance", "inactive"]),
  is_published: z.boolean(),
  is_featured: z.boolean(),
});
export type CarFormValues = z.infer<typeof carSchema>;
const datetime = z
  .string()
  .min(1, "Choose a date and time.")
  .refine(
    (v) => Number.isFinite(Date.parse(v)),
    "Enter a valid date and time.",
  );
export const bookingSchema = z
  .object({
    car_slug: id,
    customer_name: z.string().trim().min(1).max(150),
    customer_phone: z
      .string()
      .regex(/^\+?[0-9][0-9 ()-]{6,24}[0-9]$/, "Enter a valid phone number.")
      .refine((v) => {
        const n = v.replace(/\D/g, "").length;
        return n >= 7 && n <= 15;
      }, "Use 7–15 digits."),
    customer_email: z.union([z.string().email().max(255), z.literal("")]),
    pickup_location_id: id,
    pickup_at: datetime,
    return_at: datetime,
    notes: z.string().max(5000),
    status: z.enum(["pending", "confirmed"]),
  })
  .superRefine((v, ctx) => {
    if (Date.parse(v.pickup_at) < Date.now())
      ctx.addIssue({
        code: "custom",
        path: ["pickup_at"],
        message: "Pickup must be in the future.",
      });
    const duration = Date.parse(v.return_at) - Date.parse(v.pickup_at);
    if (duration <= 0)
      ctx.addIssue({
        code: "custom",
        path: ["return_at"],
        message: "Return must be after pickup.",
      });
    if (duration > MAX_RENTAL_DAYS * 86400000)
      ctx.addIssue({
        code: "custom",
        path: ["return_at"],
        message: `Maximum rental is ${MAX_RENTAL_DAYS} days.`,
      });
  });
export type BookingFormValues = z.infer<typeof bookingSchema>;
export const categorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase words separated by hyphens.",
    ),
});
export const locationSchema = z.object({
  name: z.string().trim().min(1).max(150),
  city: z.string().trim().min(1).max(100),
  country: z.string().trim().min(1).max(100),
  is_active: z.boolean(),
});
export const blockSchema = z
  .object({
    start_at: datetime,
    end_at: datetime,
    reason: z.string().trim().min(1).max(500),
  })
  .refine((v) => Date.parse(v.end_at) > Date.parse(v.start_at), {
    path: ["end_at"],
    message: "End must be after start.",
  });
export function mapErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
) {
  if (error instanceof ApiError && error.status === 422) {
    for (const entry of error.errors) {
      const index = entry.indexOf(":");
      if (index > 0)
        setError(entry.slice(0, index) as Path<T>, {
          type: "server",
          message: entry.slice(index + 1).trim(),
        });
    }
  }
}
