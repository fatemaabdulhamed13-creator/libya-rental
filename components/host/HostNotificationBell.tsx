"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import Link from "next/link";

interface PendingBooking {
    id: string;
    start_date: string;
    end_date: string;
    guest: { full_name: string | null } | null;
    property: { title: string | null } | null;
}

function formatRange(start: string, end: string) {
    const s = format(parseISO(start), "d MMM", { locale: ar });
    const e = format(parseISO(end), "d MMM", { locale: ar });
    return `${s} — ${e}`;
}

export default function HostNotificationBell() {
    const [open, setOpen] = useState(false);
    const [count, setCount] = useState(0);
    const [previews, setPreviews] = useState<PendingBooking[]>([]);
    const ref = useRef<HTMLDivElement>(null);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Count
            const { count: c } = await supabase
                .from("bookings")
                .select("*", { count: "exact", head: true })
                .eq("host_id", user.id)
                .eq("status", "pending");
            setCount(c ?? 0);

            // 3 most recent previews
            const { data } = await supabase
                .from("bookings")
                .select(`
                    id, start_date, end_date,
                    guest:profiles!guest_id(full_name),
                    property:properties(title)
                `)
                .eq("host_id", user.id)
                .eq("status", "pending")
                .order("created_at", { ascending: false })
                .limit(3);

            if (data) setPreviews(data as PendingBooking[]);
        };

        load();
    }, []);

    // ── Click-outside close ───────────────────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            {/* Bell button */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="الإشعارات"
            >
                <Bell className="h-5 w-5 text-gray-600" />
                {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none animate-pulse">
                        {count}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden" dir="rtl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900">الطلبات الواردة</h3>
                        {count > 0 && (
                            <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                {count} جديد
                            </span>
                        )}
                    </div>

                    {/* Preview list */}
                    {previews.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">لا توجد طلبات جديدة</p>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {previews.map((b) => (
                                <li key={b.id}>
                                    <Link
                                        href="/host/bookings"
                                        onClick={() => setOpen(false)}
                                        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                                    >
                                        {/* Avatar placeholder */}
                                        <div className="shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                                            <span className="text-amber-700 text-sm font-bold">
                                                {(b.guest?.full_name ?? "ض")[0]}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {b.guest?.full_name ?? "ضيف"}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {b.property?.title ?? "عقار"}
                                            </p>
                                            <p className="text-xs text-primary mt-0.5">
                                                {formatRange(b.start_date, b.end_date)}
                                            </p>
                                        </div>
                                        <span className="shrink-0 mt-1 w-2 h-2 rounded-full bg-amber-400" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Footer CTA */}
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                        <Link
                            href="/host/bookings"
                            onClick={() => setOpen(false)}
                            className="block w-full text-center text-sm font-semibold text-primary hover:underline"
                        >
                            عرض جميع الحجوزات
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
