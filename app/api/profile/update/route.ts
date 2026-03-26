import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Must be dynamic — POST routes that read cookies cannot be cached.
export const dynamic = 'force-dynamic'

/**
 * POST /api/profile/update
 *
 * Two-client pattern:
 * 1. Session client (anon key + cookies) — verify the user is authenticated
 * 2. Service role client — perform the write (bypasses RLS and auth.users FK check)
 *
 * This is safe because:
 * - We verify identity with getUser() before allowing any write
 * - We always set id = user.id (server-verified), never trusting the request body
 * - The service role key is never exposed to the browser
 */
export async function POST(request: NextRequest) {
    try {
        // ── Step 1: Verify session ────────────────────────────────────────────
        const sessionClient = await createClient()
        const { data: { user }, error: authError } = await sessionClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // ── Step 2: Build payload ─────────────────────────────────────────────
        const body = await request.json()

        const upsertPayload: Database['public']['Tables']['profiles']['Insert'] = {
            id: user.id,            // always from verified session
            full_name: body.full_name ?? null,
            phone_number: body.phone_number ?? null,
            is_host: body.is_host ?? false,
            bank_details: body.bank_details ?? null,
        }

        if (body.verification_status) upsertPayload.verification_status = body.verification_status
        if (body.identity_document_url) upsertPayload.identity_document_url = body.identity_document_url

        // ── Step 3: Write with service role (bypasses auth.users FK issue) ────
        const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data, error } = await serviceClient
            .from('profiles')
            .upsert(upsertPayload, { onConflict: 'id' })
            .select()
            .single()

        if (error) {
            console.error('[API/profile/update] Supabase error:', error)
            return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
        }

        console.log('[API/profile/update] ✅ Saved profile for user:', user.id)
        return NextResponse.json({ data }, {
            headers: { 'Cache-Control': 'no-store' },
        })

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[API/profile/update] Unexpected error:', msg)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
