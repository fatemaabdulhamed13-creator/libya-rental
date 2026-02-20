"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Building2, CalendarCheck } from "lucide-react";
import Navbar from "@/components/navbar";

export default function HostLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push("/login");
                return;
            }

            const { data: profile } = await (supabase as any)
                .from("profiles")
                .select("is_host")
                .eq("id", session.user.id)
                .single();

            if (!profile?.is_host) {
                router.push("/profile");
                return;
            }

            // Fetch pending bookings count for badge
            const { count } = await (supabase as any)
                .from("bookings")
                .select("*", { count: "exact", head: true })
                .eq("host_id", session.user.id)
                .eq("status", "pending");

            setPendingCount(count ?? 0);
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

    const tabs = [
        {
            label: "عقاراتي",
            href: "/host/properties",
            icon: Building2,
            active: pathname.startsWith("/host/properties"),
            badge: 0,
        },
        {
            label: "الحجوزات",
            href: "/host/bookings",
            icon: CalendarCheck,
            active: pathname === "/host/bookings",
            badge: pendingCount,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            {/* Host Tab Navigation */}
            <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
                <div className="container mx-auto px-4 md:px-6 lg:px-8">
                    <div className="flex gap-0" dir="rtl">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={`relative flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                                        tab.active
                                            ? "border-primary text-primary"
                                            : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{tab.label}</span>
                                    {tab.badge > 0 && (
                                        <span className="absolute -top-0.5 right-1 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 leading-none">
                                            {tab.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            <main className="flex-1 container mx-auto px-4 md:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
