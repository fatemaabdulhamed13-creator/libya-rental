import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code       = requestUrl.searchParams.get('code');
  const tokenHash  = requestUrl.searchParams.get('token_hash');
  const type       = requestUrl.searchParams.get('type') as 'signup' | 'recovery' | 'invite' | null;
  const next       = requestUrl.searchParams.get('next') || '/';
  const origin     = requestUrl.origin;

  const supabase = await createClient();

  // ── PKCE flow: code exchanged for session ─────────────────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('Auth callback – code exchange failed:', error.message);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  // ── token_hash flow: used by newer Supabase email confirmations ───────────
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      console.error('Auth callback – token_hash verify failed:', error.message);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  // No recognised params — send to login
  return NextResponse.redirect(`${origin}/login`);
}
