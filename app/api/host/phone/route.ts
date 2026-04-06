import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/host/phone?hostId=xxx
 * Returns the host's phone number so the booking form can open a WhatsApp chat.
 * Requires the caller to be authenticated (they just created a booking).
 */
export async function GET(request: NextRequest) {
    try {
        const sessionClient = await createClient()
        const { data: { user }, error: authError } = await sessionClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const hostId = request.nextUrl.searchParams.get('hostId')
        if (!hostId) {
            return NextResponse.json({ error: 'Missing hostId' }, { status: 400 })
        }

        const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data, error } = await serviceClient
            .from('profiles')
            .select('phone_number')
            .eq('id', hostId)
            .single()

        if (error) {
            return NextResponse.json({ phone_number: null })
        }

        return NextResponse.json({ phone_number: data?.phone_number ?? null })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[API/host/phone] error:', msg)
        return NextResponse.json({ phone_number: null })
    }
}
