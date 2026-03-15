"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Loader2, CalendarDays, LayoutDashboard, History
} from "lucide-react";
import { format, parseISO, differenceInCalendarDays, isBefore, startOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import Image from "next/image";
import BookingDetailPanel, { type BookingForPanel } from "@/components/host/BookingDetailPanel";

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatArabicRange(start: string, end: string) {
    const s = format(parseISO(start), "d MMM", { locale: ar });
    const e = format(parseISO(end), "d MMM yyyy", { locale: ar });
    const n = differenceInCalendarDays(parseISO(end), parseISO(start));
    return { label: `${s} — ${e}`, nights: n };
}

function datesOverlap(a: any, b: any) {
    return (
        new Date(a.start_date) < new Date(b.end_date) &&
        new Date(a.end_date) > new Date(b.start_date)
    );
}

function competingCount(booking: any, allBookings: any[]) {
    return allBookings.filter(
        other =>
            other.id !== booking.id &&
            other.property_id === booking.property_id &&
            other.status === "pending" &&
            datesOverlap(booking, other)
    ).length;
}

function groupBy<T>(arr: T[], key: (item: T) => string): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const item of arr) {
        const k = key(item);
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(item);
    }
    return map;
}

function isHistory(booking: any, today: Date): boolean {
    const TERMINAL = new Set(["rejected", "cancelled", "expired"]);
    if (TERMINAL.has(booking.status)) return true;
    return isBefore(parseISO(booking.end_date), today);
}

const STATUS_LABEL: Record<string, string> = {
    pending: "بانتظار الرد",
    awaiting_payment: "بانتظار الدفع",
    host_verifying: "مراجعة الإيصال",
    confirmed: "مؤكد",
    rejected: "مرفوض",
    cancelled: "ملغى",
    expired: "منتهي الصلاحية",
};

const STATUS_COLOR: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    awaiting_payment: "bg-blue-100 text-blue-800",
    host_verifying: "bg-purple-100 text-purple-800",
    confirmed: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
    expired: "bg-gray-100 text-gray-400",
};

const HISTORY_BORDER: Record<string, string> = {
    confirmed: "border-r-4 border-r-green-500",
    rejected: "border-r-4 border-r-red-500",
    cancelled: "border-r-4 border-r-red-400",
    expired: "border-r-4 border-r-gray-300",
    awaiting_payment: "border-r-4 border-r-amber-400",
    host_verifying: "border-r-4 border-r-purple-400",
};

// ─── tiny stat card ───────────────────────────────────────────────────────────

function StatCard({ label, value, accent = false, warn = false }: {
    label: string; value: number; accent?: boolean; warn?: boolean;
}) {
    return (
        <div className={`rounded-2xl px-4 py-3 flex items-center justify-between ${accent ? "bg-amber-500"
            : warn ? "bg-orange-50 border border-orange-200"
                : "bg-gray-50 border border-gray-100"
            }`}>
            <p className={`text-xs font-semibold ${accent ? "text-amber-100"
                : warn ? "text-orange-600"
                    : "text-gray-500"
                }`}>{label}</p>
            <p className={`text-2xl font-black leading-none ${accent ? "text-white"
                : warn ? "text-orange-600"
                    : "text-gray-700"
                }`}>{value}</p>
        </div>
    );
}

// ─── compact inbox row card ──────────────────────────────────────────────────

function BookingCard({
    booking,
    onClick,
    historyBorder,
    isLast = false,
}: {
    booking: any;
    onClick: () => void;
    historyBorder?: string;
    isLast?: boolean;
}) {
    const { label, nights } = formatArabicRange(booking.start_date, booking.end_date);
    const cover = booking.property?.images?.[0] ?? null;

    return (
        <button
            onClick={onClick}
            className={`w-full text-right flex items-center gap-4 px-4 py-3 bg-white hover:bg-gray-50 transition-colors ${isLast ? "" : "border-b border-gray-100"
                } ${historyBorder ?? ""}`}
        >
            {/* Thumbnail — right/start side */}
            <div className="relative shrink-0 w-14 h-14 rounded-md overflow-hidden bg-gray-100">
                {cover ? (
                    <Image src={cover} alt="" fill sizes="56px" className="object-cover" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xl">🏠</div>
                )}
            </div>

            {/* Guest info — grows to fill */}
            <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm font-bold text-gray-900 truncate leading-tight">
                    {booking.guest?.full_name ?? "ضيف"}
                </p>
                <p className="text-xs text-gray-400 truncate">{booking.property?.title ?? "عقار"}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    <span className="truncate">{label}</span>
                    <span className="shrink-0 text-gray-300">· {nights}ل</span>
                </div>
            </div>

            {/* Status badge — left/end side */}
            <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[booking.status] ?? "bg-gray-100 text-gray-600"
                }`}>
                {STATUS_LABEL[booking.status] ?? booking.status}
            </span>
        </button>
    );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function HostBookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"active" | "history">("active");
    const [selectedBooking, setSelectedBooking] = useState<BookingForPanel | null>(null);

    const today = startOfDay(new Date());

    const fetchBookings = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from("bookings")
            .select(`
                *,
                guest:profiles!guest_id(full_name),
                property:properties(title, images)
            `)
            .eq("host_id", user.id)
            .order("created_at", { ascending: false });

        if (data) setBookings(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchBookings();
        const timer = setInterval(() => fetchBookings(), 60_000);
        return () => clearInterval(timer);
    }, []);

    // ── panel action wrappers ─────────────────────────────────────────────────

    const panelAccept = async (b: BookingForPanel) => {
        const supabase = createClient();
        const newStatus = b.payment_method === "bank_transfer" ? "awaiting_payment" : "confirmed";
        await supabase.from("bookings").update({ status: newStatus as any }).eq("id", b.id);
        await fetchBookings();
    };
    const panelDecline = async (id: string) => {
        const supabase = createClient();
        await supabase.from("bookings").update({ status: "rejected" }).eq("id", id);
        await fetchBookings();
    };
    const panelConfirmPayment = async (id: string) => {
        const supabase = createClient();
        await supabase.from("bookings").update({ status: "confirmed" }).eq("id", id);
        await fetchBookings();
    };

    // ── derived data ──────────────────────────────────────────────────────────

    const totalPending = bookings.filter(b => b.status === "pending").length;
    const totalConfirmed = bookings.filter(b => b.status === "confirmed" && !isBefore(parseISO(b.end_date), today)).length;
    const totalConflicts = bookings.filter(b => b.status === "pending" && competingCount(b, bookings) > 0).length;

    const activeBookings = bookings.filter(b => !isHistory(b, today));
    const historyBookings = bookings.filter(b => isHistory(b, today));

    const sortedActive = [...activeBookings].sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return 0;
    });

    const byProperty = groupBy(sortedActive, b => b.property_id);

    // ── loading / empty ───────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="text-center py-24 text-gray-400" dir="rtl">
                <LayoutDashboard className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                <p className="text-lg">لا توجد حجوزات حالياً</p>
            </div>
        );
    }

    // ── render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col lg:flex-row gap-6 pb-20" dir="rtl">

            {/* ══════════════════════════════════════════════════════════════
                RIGHT COL — Sticky overview (first in DOM = right in RTL flex)
            ══════════════════════════════════════════════════════════════ */}
            <aside className="lg:w-72 shrink-0 lg:sticky lg:top-24 lg:self-start space-y-3">

                {/* Heading */}
                <h1 className="text-xl font-black text-gray-900 mb-1">لوحة الحجوزات</h1>

                {/* Stats */}
                <StatCard
                    label="طلبات تحتاج ردًّا"
                    value={totalPending}
                    accent={totalPending > 0}
                />
                <div className="grid grid-cols-2 gap-3">
                    <StatCard label="مؤكدة قادمة" value={totalConfirmed} />
                    <StatCard label="تعارض تواريخ" value={totalConflicts} warn={totalConflicts > 0} />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500">إجمالي الحجوزات</p>
                    <p className="text-2xl font-black text-gray-700">{bookings.length}</p>
                </div>

                {/* Divider */}
                <div className="pt-1" />

                {/* Tab bar — inside the sticky sidebar on desktop */}
                <div className="flex rounded-2xl bg-gray-100 p-1">
                    <button
                        onClick={() => setTab("active")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === "active" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <LayoutDashboard className="h-3.5 w-3.5" />
                        الحالية
                        {activeBookings.length > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === "active" ? "bg-gray-100 text-gray-700" : "bg-gray-200 text-gray-500"
                                }`}>{activeBookings.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setTab("history")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === "history" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <History className="h-3.5 w-3.5" />
                        السجل
                        {historyBookings.length > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === "history" ? "bg-gray-100 text-gray-700" : "bg-gray-200 text-gray-500"
                                }`}>{historyBookings.length}</span>
                        )}
                    </button>
                </div>

                {/* Hint text */}
                <p className="text-xs text-gray-400 text-center pb-1">
                    اضغط على أي بطاقة لعرض التفاصيل واتخاذ إجراء
                </p>
            </aside>

            {/* ══════════════════════════════════════════════════════════════
                LEFT COL — Scrollable feed
            ══════════════════════════════════════════════════════════════ */}
            <div className="flex-1 min-w-0 max-w-3xl space-y-6">

                {/* ── ACTIVE TAB ── */}
                {tab === "active" && (
                    <>
                        {activeBookings.length === 0 && (
                            <p className="text-center text-gray-400 py-16">لا توجد حجوزات نشطة</p>
                        )}

                        {Array.from(byProperty.entries()).map(([propertyId, propBookings]) => {
                            const propertyTitle = propBookings[0]?.property?.title ?? "عقار";
                            const pendingCount = propBookings.filter(b => b.status === "pending").length;

                            return (
                                <section key={propertyId}>
                                    {/* Property group header */}
                                    <div className="flex items-center gap-2 px-4 pb-2">
                                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide truncate">{propertyTitle}</h2>
                                        {pendingCount > 0 && (
                                            <span className="shrink-0 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {pendingCount} طلب
                                            </span>
                                        )}
                                    </div>

                                    {/* Rows grouped in a single card with dividers */}
                                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                        {propBookings.map((booking, idx) => (
                                            <BookingCard
                                                key={booking.id}
                                                booking={booking}
                                                isLast={idx === propBookings.length - 1}
                                                onClick={() => setSelectedBooking({ ...booking, competingCount: competingCount(booking, bookings) })}
                                            />
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </>
                )}

                {/* ── HISTORY TAB ── */}
                {tab === "history" && (
                    <>
                        {historyBookings.length === 0 && (
                            <p className="text-center text-gray-400 py-16">لا يوجد سجل حجوزات سابقة</p>
                        )}

                        {/* History rows grouped in a single card */}
                        {historyBookings.length > 0 && (
                            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                {historyBookings.map((booking, idx) => (
                                    <BookingCard
                                        key={booking.id}
                                        booking={booking}
                                        historyBorder={HISTORY_BORDER[booking.status]}
                                        isLast={idx === historyBookings.length - 1}
                                        onClick={() => setSelectedBooking(booking)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Detail panel ─────────────────────────────────────────────── */}
            <BookingDetailPanel
                booking={selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onAccept={panelAccept}
                onDecline={panelDecline}
                onConfirmPayment={panelConfirmPayment}
            />
        </div>
    );
}
