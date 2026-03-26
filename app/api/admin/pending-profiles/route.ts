import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'fatemaabdulhamed13@gmail.com'

/**
 * GET /api/admin/pending-profiles
 * Returns profiles with identity_document_url set and status pending/unverified.
 * Uses service role to bypass RLS — protected by admin email check.
 */
export async function GET() {
    try {
        // 1. Verify this is the admin
        const sessionClient = await createClient()
        const { data: { user }, error: authError } = await sessionClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (user.email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 2. Use service role to bypass RLS and read all profiles
        const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data, error } = await serviceClient
            .from('profiles')
            .select('id, full_name, phone_number, identity_document_url, verification_status, created_at')
            .not('identity_document_url', 'is', null)
            .in('verification_status', ['pending', 'unverified'])
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[API/admin/pending-profiles] Error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(
            { profiles: data ?? [] },
            { headers: { 'Cache-Control': 'no-store' } }
        )
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[API/admin/pending-profiles] Unexpected error:', msg)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}

/**
 * POST /api/admin/pending-profiles
 * Updates a profile's verification status.
 * Body: { profileId: string, action: 'approve' | 'reject' }
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Verify admin
        const sessionClient = await createClient()
        const { data: { user }, error: authError } = await sessionClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (user.email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { profileId, action } = await request.json()

        if (!profileId || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error } = await serviceClient
            .from('profiles')
            .update({
                verification_status: action === 'approve' ? 'verified' : 'rejected',
                is_identity_verified: action === 'approve',
            })
            .eq('id', profileId)

        if (error) {
            console.error('[API/admin/pending-profiles] Update error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(
            { success: true },
            { headers: { 'Cache-Control': 'no-store' } }
        )
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
