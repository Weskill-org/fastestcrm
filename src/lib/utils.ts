import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Rewrites a direct Supabase storage/API URL to use the api.fastestcrm.com proxy.
 * This prevents ERR_CONNECTION_TIMED_OUT for users on restricted networks.
 */
export function proxifySupabaseUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Example: https://uykdyqdeyilpulaqlqip.supabase.co/storage/v1/object/public/company_assets/logo.png
  // To: https://api.fastestcrm.com/storage/v1/object/public/company_assets/logo.png
  const directUrl = "uykdyqdeyilpulaqlqip.supabase.co";
  const proxyUrl = "api.fastestcrm.com";

  if (url.includes(directUrl)) {
    return url.replace(directUrl, proxyUrl);
  }

  return url;
}
