import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'

type ValidStatus = 'pending' | 'awaiting_payment' | 'host_verifying' | 'confirmed' | 'rejected' | 'cancelled' | 'expired'
const VALID_STATUSES: ValidStatus[] = ['pending', 'awaiting_payment', 'host_verifying', 'confirmed', 'rejected', 'cancelled', 'expired']

/**
 * POST /api/host/bookings/update-status
 * Allows a host to update the status of a booking they own.
 * Uses service role to bypass RLS.
 */
export async function POST(request: NextRequest) {
    try {
        // ── Verify session ─────────────────────────────────────────────────────
        const sessionClient = await createClient()
        const { data: { user }, error: authError } = await sessionClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { bookingId, status } = body

        if (!bookingId || !status) {
            return NextResponse.json({ error: 'Missing bookingId or status' }, { status: 400 })
        }

        if (!VALID_STATUSES.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        // ── Service role client ────────────────────────────────────────────────
        const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Verify the booking belongs to this host
        const { data: existing, error: fetchError } = await serviceClient
            .from('bookings')
            .select('host_id')
            .eq('id', bookingId)
            .single()

        if (fetchError || !existing) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        if (existing.host_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { error: updateError } = await serviceClient
            .from('bookings')
            .update({ status })
            .eq('id', bookingId)

        if (updateError) {
            console.error('[API/host/bookings/update-status] error:', updateError)
            return NextResponse.json({ error: updateError.message }, { status: 400 })
        }

        console.log('[API/host/bookings/update-status] ✅ booking:', bookingId, '→', status)
        return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[API/host/bookings/update-status] Unexpected error:', msg)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
