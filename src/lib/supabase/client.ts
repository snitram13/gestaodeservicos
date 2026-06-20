import { createBrowserClient } from "@supabase/ssr"

/** Cliente Supabase para uso no browser (Client Components). */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
