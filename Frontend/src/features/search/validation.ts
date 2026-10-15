import { z } from "zod";
import { site } from "../../lib/config/site";

export function validatePeriod(
  values: { pickup_at?: string; return_at?: string },
  ctx: z.RefinementCtx,
  required = true,
) {
  if (!required && !values.pickup_at && !values.return_at) return;
  const pickup = Date.parse(values.pickup_at || "");
  const end = Date.parse(values.return_at || "");
  if (!Number.isFinite(pickup))
    ctx.addIssue({
      code: "custom",
      path: ["pickup_at"],
      message: "Choose a valid pickup date and time.",
    });
  else if (pickup < Date.now())
    ctx.addIssue({
      code: "custom",
      path: ["pickup_at"],
      message: "Pickup must be in the future.",
    });
  if (!Number.isFinite(end))
    ctx.addIssue({
      code: "custom",
      path: ["return_at"],
      message: "Choose a valid return date and time.",
    });
  else if (Number.isFinite(pickup)) {
    if (end <= pickup)
      ctx.addIssue({
        code: "custom",
        path: ["return_at"],
        message: "Return must be after pickup.",
      });
    if (end - pickup > site.maxRentalDays * 86400000)
      ctx.addIssue({
        code: "custom",
        path: ["return_at"],
        message: `Rentals may be up to ${site.maxRentalDays} days.`,
      });
  }
}
export const searchSchema = z
  .object({
    location: z.string().min(1, "Choose a pickup location.").max(150),
    pickup_at: z.string(),
    return_at: z.string(),
  })
  .superRefine((v, c) => validatePeriod(v, c));
export type SearchValues = z.infer<typeof searchSchema>;
const optionalPrice = z
  .string()
  .refine(
    (v) =>
      v === "" || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) <= 99999999.99),
    "Enter a price between 0 and 99,999,999.99.",
  )
  .optional();
export const filtersSchema = z
  .object({
    brand: z.string().max(100).optional(),
    category: z.string().max(120).optional(),
    model: z.string().max(120).optional(),
    search: z.string().max(120).optional(),
    location: z.string().max(150).optional(),
    min_price: optionalPrice,
    max_price: optionalPrice,
    transmission: z.enum(["automatic", "manual"]).optional(),
    fuel_type: z.enum(["petrol", "diesel", "hybrid", "electric"]).optional(),
    pickup_at: z.string().datetime({ offset: true }).optional(),
    return_at: z.string().datetime({ offset: true }).optional(),
    sort: z
      .enum(["newest", "price_asc", "price_desc", "year_desc", "model_asc"])
      .optional(),
    page: z.coerce.number().int().min(1).optional(),
    per_page: z.coerce.number().int().min(1).max(100).optional(),
  })
  .superRefine((v, ctx) => {
    validatePeriod(v, ctx, false);
    if (v.min_price && v.max_price && Number(v.min_price) > Number(v.max_price))
      ctx.addIssue({
        code: "custom",
        path: ["max_price"],
        message: "Maximum price must be at least the minimum price.",
      });
  });
export function readFilters(params: URLSearchParams) {
  return filtersSchema.safeParse(
    Object.fromEntries([...params].filter(([, v]) => v !== "")),
  );
}
export function updateParams(
  current: URLSearchParams,
  patch: Record<string, string | undefined>,
) {
  const next = new URLSearchParams(current);
  next.delete("page");
  Object.entries(patch).forEach(([key, value]) =>
    value ? next.set(key, value) : next.delete(key),
  );
  return next;
}
export function rentalQuery(params: URLSearchParams) {
  const next = new URLSearchParams();
  ["location", "pickup_at", "return_at"].forEach((key) => {
    if (params.get(key)) next.set(key, params.get(key)!);
  });
  return next.toString() ? `?${next}` : "";
}
