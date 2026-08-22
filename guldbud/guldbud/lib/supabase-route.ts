import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'

// Server-klient för Route Handlers som läser sessionen DIREKT från request-
// cookies. Mer pålitligt än next/headers cookies() i en route handler, som
// ibland inte speglar den session middleware just förnyat. Vi behöver bara
// läsa (getUser), så setAll är en no-op här.
export function createRouteClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    }
  )
}
