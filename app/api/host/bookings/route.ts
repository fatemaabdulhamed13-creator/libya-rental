import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/host/bookings
 * Returns all bookings for the currently authenticated host,
 * including guest name and property title/images.
 * Uses service role to bypass RLS.
 */
export async function GET() {
    try {
        // ── Verify session via cookie ──────────────────────────────────────────
        const sessionClient = await createClient()
        const { data: { user }, error: authError } = await sessionClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // ── Fetch with service role (bypasses RLS) ─────────────────────────────
        const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data, error } = await serviceClient
            .from('bookings')
            .select(`
                *,
                guest:profiles!guest_id(full_name, phone_number),
                property:properties(title, images)
            `)
            .eq('host_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[API/host/bookings] Supabase error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ bookings: data ?? [] }, {
            headers: { 'Cache-Control': 'no-store' },
        })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[API/host/bookings] Unexpected error:', msg)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
