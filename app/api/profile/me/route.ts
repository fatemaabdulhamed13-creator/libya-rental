import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Never cache this route — each request must resolve the user's live session.
export const dynamic = 'force-dynamic'

/**
 * GET /api/profile/me
 * Returns the authenticated user's profile row.
 * Uses the service role key so SELECT RLS policies can't block it.
 */
export async function GET(request: NextRequest) {
    try {
        // Verify the session first
        const sessionClient = await createClient()
        const { data: { user }, error: authError } = await sessionClient.auth.getUser()
        console.log('[API/profile/me] resolved user:', user?.id ?? 'none')

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Read with service role to bypass any SELECT policy issues
        const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: profile, error } = await serviceClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no row found (new user) — not a real error
            console.error('[API/profile/me] Error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Attach Cache-Control so no proxy, CDN, or browser caches this per user
        const headers = {
            'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
            'Pragma': 'no-cache',
            'X-User-Id': user.id, // debug header — visible in DevTools Network tab
        }

        return NextResponse.json(
            { profile: profile ?? null, userId: user.id },
            { headers },
        )
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[API/profile/me] Unexpected error:', msg)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
