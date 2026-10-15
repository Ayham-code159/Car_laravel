const env = import.meta.env;
const webUrl = (value: string | undefined) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol)
      ? url.href.replace(/\/$/, "")
      : "";
  } catch {
    return "";
  }
};
const maxDays = Number(env.VITE_MAX_RENTAL_DAYS || 90);
export const site = {
  name: env.VITE_BUSINESS_NAME?.trim() || "THE COLLECTION",
  isPreview: !env.VITE_BUSINESS_NAME?.trim(),
  tagline: env.VITE_TAGLINE?.trim() || "Exceptional journeys begin here.",
  phone: env.VITE_CONTACT_PHONE?.trim() || "",
  whatsapp: /^\+?\d{7,15}$/.test(env.VITE_WHATSAPP_NUMBER || "")
    ? env.VITE_WHATSAPP_NUMBER.replace(/\D/g, "")
    : "",
  address: env.VITE_ADDRESS?.trim() || "",
  url: webUrl(env.VITE_SITE_URL),
  socials: [
    { name: "Instagram", url: webUrl(env.VITE_INSTAGRAM_URL) },
    { name: "Facebook", url: webUrl(env.VITE_FACEBOOK_URL) },
  ].filter((s) => s.url),
  maxRentalDays: Number.isInteger(maxDays) && maxDays > 0 ? maxDays : 90,
};
export function whatsappUrl(
  message = "Hello, I would like to enquire about a car rental.",
) {
  return site.whatsapp
    ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`
    : "";
}
