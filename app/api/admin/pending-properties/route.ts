import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'fatemaabdulhamed13@gmail.com'

/**
 * GET /api/admin/pending-properties
 * Returns properties with status = 'pending', with host names joined.
 * Uses service role to bypass RLS.
 */
export async function GET() {
    try {
        const sessionClient = await createClient()
        const { data: { user }, error: authError } = await sessionClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (user.email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Fetch pending properties
        const { data: properties, error: propError } = await serviceClient
            .from('properties')
            .select('id, title, city, price_per_night, images, status, host_id, created_at')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })

        if (propError) {
            console.error('[API/admin/pending-properties] GET error:', propError)
            return NextResponse.json({ error: propError.message }, { status: 400 })
        }

        if (!properties || properties.length === 0) {
            return NextResponse.json({ properties: [] }, { headers: { 'Cache-Control': 'no-store' } })
        }

        // Fetch host names
        const hostIds = [...new Set(properties.map(p => p.host_id).filter(Boolean))]
        const { data: profiles } = await serviceClient
            .from('profiles')
            .select('id, full_name')
            .in('id', hostIds)

        const profilesMap = new Map((profiles ?? []).map(p => [p.id, p]))
        const enriched = properties.map(prop => ({
            ...prop,
            host: profilesMap.get(prop.host_id) ?? { full_name: 'Unknown Host' },
        }))

        return NextResponse.json(
            { properties: enriched },
            { headers: { 'Cache-Control': 'no-store' } }
        )
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}

/**
 * POST /api/admin/pending-properties
 * Approve or reject a property.
 * Body: { propertyId: string, action: 'approve' | 'reject' }
 */
export async function POST(request: NextRequest) {
    try {
        const sessionClient = await createClient()
        const { data: { user }, error: authError } = await sessionClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (user.email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { propertyId, action } = await request.json()

        if (!propertyId || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error } = await serviceClient
            .from('properties')
            .update({ status: action === 'approve' ? 'approved' : 'rejected' })
            .eq('id', propertyId)

        if (error) {
            console.error('[API/admin/pending-properties] POST error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        console.log(`[API/admin/pending-properties] ✅ ${action}d property:`, propertyId)
        return NextResponse.json(
            { success: true },
            { headers: { 'Cache-Control': 'no-store' } }
        )
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
