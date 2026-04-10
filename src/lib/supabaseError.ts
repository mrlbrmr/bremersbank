import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Returns a readable, complete message from a Supabase/PostgREST error object.
 * Useful for showing meaningful diagnostics and logging the API response body.
 */
export function getSupabaseErrorDetails(error: PostgrestError | null): string {
  if (!error) return "Erro desconhecido.";

  const parts = [
    error.message ? `message="${error.message}"` : null,
    error.code ? `code=${error.code}` : null,
    error.details ? `details="${error.details}"` : null,
    error.hint ? `hint="${error.hint}"` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : "Erro sem detalhes retornados pela API.";
}
