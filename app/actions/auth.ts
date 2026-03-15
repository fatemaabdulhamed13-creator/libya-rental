'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { siteUrl } from '@/lib/site-url'

/**
 * Server Action: sign in with email + password.
 * Returns { error: string } on failure.
 * On success calls redirect() server-side — no client router involved.
 */
export async function loginAction(
    email: string,
    password: string,
    destination: string = '/'
): Promise<{ error: string } | never> {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
        return { error: error.message }
    }

    // next/navigation redirect() throws a special Next.js error that the
    // framework catches and turns into a proper HTTP 303 response.
    // This bypasses the client router entirely, so router.refresh() calls
    // in SupabaseAuthListener cannot cancel or race with it.
    redirect(destination)
}

/**
 * Server Action: register a new user with email + password.
 * Supabase will send a confirmation email via Resend SMTP.
 * The link in that email points back to /auth/callback.
 */
export async function signUpAction(
    email: string,
    password: string,
    metadata?: Record<string, string>,
): Promise<{ error: string } | { success: true }> {
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            // After clicking the confirmation link Supabase redirects here.
            // The /auth/callback route exchanges the code for a session.
            emailRedirectTo: `${siteUrl()}/auth/callback`,
            data: metadata,
        },
    })

    if (error) return { error: error.message }
    return { success: true }
}

/**
 * Server Action: send a password-reset email via Resend SMTP.
 * The link in that email points back to /auth/callback?next=/reset-password.
 */
export async function resetPasswordAction(
    email: string,
): Promise<{ error: string } | { success: true }> {
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // After clicking the reset link Supabase redirects here with a code.
        // /auth/callback will exchange it, then forward to /reset-password
        // where the user sets their new password.
        redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
    })

    if (error) return { error: error.message }
    return { success: true }
}
