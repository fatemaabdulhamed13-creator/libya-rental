import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * GET /api/profile/me
 * Returns the authenticated user's profile row.
 * Uses the service role key so SELECT RLS policies can't block it.
 */
export async function GET() {
    try {
        // Verify the session first
        const sessionClient = await createClient()
        const { data: { user }, error: authError } = await sessionClient.auth.getUser()

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

        return NextResponse.json({ profile: profile ?? null, userId: user.id })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[API/profile/me] Unexpected error:', msg)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
