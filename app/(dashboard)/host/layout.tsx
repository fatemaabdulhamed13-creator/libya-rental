"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/navbar";

export default function HostLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push("/login");
                return;
            }

            const { data: profile } = await supabase
                .from("public_profiles_view")
                .select("is_host")
                .eq("id", session.user.id)
                .single();

            if (!profile?.is_host) {
                router.push("/profile");
                return;
            }

            setLoading(false);
        };

        init();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 md:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
