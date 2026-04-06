import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Must be dynamic — POST routes that read cookies cannot be cached.
export const dynamic = 'force-dynamic'

/**
 * POST /api/properties/update
 *
 * Two-client pattern:
 * 1. Session client (anon key + cookies) — verify the user is authenticated
 * 2. Service role client — perform the write (bypasses RLS)
 */
export async function POST(request: NextRequest) {
    try {
        // ── Step 1: Verify session ────────────────────────────────────────────
        const sessionClient = await createClient()
        const { data: { user }, error: authError } = await sessionClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // ── Step 2: Parse body ────────────────────────────────────────────────
        const body = await request.json()
        const { propertyId, propertyData } = body

        if (!propertyId || !propertyData) {
            return NextResponse.json({ error: 'Missing propertyId or propertyData' }, { status: 400 })
        }

        // ── Step 3: Service role client ───────────────────────────────────────
        const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Ensure the property belongs to this host before allowing update
        const { data: existing, error: fetchError } = await serviceClient
            .from('properties')
            .select('host_id')
            .eq('id', propertyId)
            .single()

        if (fetchError || !existing) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 })
        }

        if (existing.host_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // ── Step 4: Perform update ────────────────────────────────────────────
        const { error: updateError } = await serviceClient
            .from('properties')
            .update(propertyData)
            .eq('id', propertyId)

        if (updateError) {
            console.error('[API/properties/update] Supabase error:', updateError)
            return NextResponse.json({ error: updateError.message, code: updateError.code }, { status: 400 })
        }

        console.log('[API/properties/update] ✅ Updated property:', propertyId, 'by user:', user.id)
        return NextResponse.json({ success: true }, {
            headers: { 'Cache-Control': 'no-store' },
        })

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[API/properties/update] Unexpected error:', msg)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
