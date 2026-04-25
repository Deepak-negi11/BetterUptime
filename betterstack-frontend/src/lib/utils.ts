import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const BACKEND_URL = "/api/proxy";

export const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://146.190.33.150:3001";

export function getOAuthUrl(provider: "google" | "github") {
  return `${API_ORIGIN}/user/oauth/${provider}`;
}
