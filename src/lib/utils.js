import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Extract error message from API error response
 * Handles both string errors and Pydantic validation error arrays
 */
export function getErrorMessage(error, fallback = "An error occurred") {
  const detail = error?.response?.data?.detail;
  
  if (!detail) return fallback;
  
  // If detail is a string, return it directly
  if (typeof detail === 'string') return detail;
  
  // If detail is an array (Pydantic validation errors), extract first message
  if (Array.isArray(detail) && detail.length > 0) {
    const firstError = detail[0];
    if (firstError.msg) return firstError.msg;
  }
  
  return fallback;
}
