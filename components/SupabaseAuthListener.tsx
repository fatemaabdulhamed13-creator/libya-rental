"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Tiny client component that lives in the root layout.
 * Listens for Supabase auth state changes and calls router.refresh()
 * so the Next.js router cache is invalidated and Server Components
 * (Navbar, layouts, etc.) re-fetch with the current session.
 */
export default function SupabaseAuthListener() {
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event) => {
                if (
                    event === "SIGNED_IN" ||
                    event === "SIGNED_OUT" ||
                    event === "TOKEN_REFRESHED" ||
                    event === "USER_UPDATED"
                ) {
                    router.refresh();
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    // Renders nothing — purely a side-effect component
    return null;
}
