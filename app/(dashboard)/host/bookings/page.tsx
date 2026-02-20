"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, Users, Banknote, CreditCard, AlertTriangle, CheckCircle2, XCircle, Loader2, Copy, Check } from "lucide-react";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatArabicRange(start: string, end: string) {
    const s = format(parseISO(start), "d MMMM", { locale: ar });
    const e = format(parseISO(end),   "d MMMM", { locale: ar });
    return `${e} ← ${s}`;
}

function datesOverlap(a: any, b: any) {
    return (
        new Date(a.start_date) < new Date(b.end_date) &&
        new Date(a.end_date)   > new Date(b.start_date)
    );
}

/** Returns how many OTHER pending bookings on the same property overlap with this one. */
function competingCount(booking: any, allBookings: any[]) {
    return allBookings.filter(
        other =>
            other.id          !== booking.id &&
            other.property_id === booking.property_id &&
            other.status      === "pending" &&
            datesOverlap(booking, other)
    ).length;
}

/** Group an array by a string key, preserving insertion order of first-seen keys. */
function groupBy<T>(arr: T[], key: (item: T) => string): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const item of arr) {
        const k = key(item);
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(item);
    }
    return map;
}

const STATUS_LABEL: Record<string, string> = {
    pending:          "بانتظار الرد",
    awaiting_payment: "بانتظار الدفع",
    host_verifying:   "مراجعة الإيصال",
    confirmed:        "مؤكد",
    rejected:         "مرفوض",
    cancelled:        "ملغى",
    expired:          "منتهي الصلاحية",
};

const STATUS_COLOR: Record<string, string> = {
    pending:          "bg-amber-100 text-amber-800",
    awaiting_payment: "bg-blue-100 text-blue-800",
    host_verifying:   "bg-purple-100 text-purple-800",
    confirmed:        "bg-green-100 text-green-800",
    rejected:         "bg-red-100 text-red-700",
    cancelled:        "bg-gray-100 text-gray-500",
    expired:          "bg-gray-100 text-gray-400",
};

// ─── main component ──────────────────────────────────────────────────────────

export default function HostBookingsPage() {
    const [bookings, setBookings]           = useState<any[]>([]);
    const [loading, setLoading]             = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [copiedCode, setCopiedCode]       = useState<string | null>(null);
    const [now, setNow]                     = useState(new Date());

    const fetchBookings = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from("bookings")
            .select(`
                *,
                guest:profiles!guest_id(full_name),
                property:properties(title)
            `)
            .eq("host_id", user.id)
            .order("created_at", { ascending: false });

        if (data) setBookings(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchBookings();
        const timer = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(timer);
    }, []);

    const handleAccept = async (booking: any) => {
        setActionLoading(booking.id + ":accept");
        const supabase = createClient();
        const newStatus = booking.payment_method === "bank_transfer" ? "awaiting_payment" : "confirmed";
        const { error } = await (supabase.from("bookings") as any).update({ status: newStatus }).eq("id", booking.id);
        if (error) alert("خطأ في قبول الحجز");
        else await fetchBookings();
        setActionLoading(null);
    };

    const handleDecline = async (bookingId: string) => {
        setActionLoading(bookingId + ":decline");
        const supabase = createClient();
        const { error } = await (supabase.from("bookings") as any).update({ status: "rejected" }).eq("id", bookingId);
        if (error) alert("خطأ في رفض الحجز");
        else await fetchBookings();
        setActionLoading(null);
    };

    const handleConfirmPayment = async (bookingId: string) => {
        const supabase = createClient();
        await (supabase.from("bookings") as any).update({ status: "confirmed" }).eq("id", bookingId);
        fetchBookings();
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // ── derived data ─────────────────────────────────────────────────────────

    // Sort: pending first within each group, then by created_at desc
    const sorted = [...bookings].sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return  1;
        return 0;
    });

    const byProperty = groupBy(sorted, b => b.property_id);
    const totalPending = bookings.filter(b => b.status === "pending").length;

    // ── loading ───────────────────────────────────────────────────────────────

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
                <p className="text-lg">لا توجد حجوزات حالياً</p>
            </div>
        );
    }

    // ── render ────────────────────────────────────────────────────────────────

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-16" dir="rtl">

            {/* Page header */}
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">الحجوزات الواردة</h1>
                {totalPending > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        {totalPending} جديد
                    </span>
                )}
            </div>

            {/* ── Per-property sections ── */}
            {Array.from(byProperty.entries()).map(([propertyId, propBookings]) => {
                const propertyTitle = propBookings[0]?.property?.title ?? "عقار";
                const pendingInProp = propBookings.filter(b => b.status === "pending");
                const otherInProp   = propBookings.filter(b => b.status !== "pending");

                return (
                    <section key={propertyId}>
                        {/* Property header */}
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-base font-bold text-gray-700 truncate">{propertyTitle}</h2>
                            {pendingInProp.length > 0 && (
                                <span className="shrink-0 bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                    {pendingInProp.length} طلب
                                </span>
                            )}
                        </div>

                        <div className="space-y-3">
                            {/* Pending requests first */}
                            {pendingInProp.map(booking => {
                                const competing = competingCount(booking, bookings);
                                const expiry    = booking.expires_at ? new Date(booking.expires_at) : null;
                                const isExpired = expiry && expiry < now;
                                const accepting = actionLoading === booking.id + ":accept";
                                const declining = actionLoading === booking.id + ":decline";

                                return (
                                    <div
                                        key={booking.id}
                                        className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm overflow-hidden"
                                    >
                                        {/* Competing badge — full-width top strip */}
                                        {competing > 0 && (
                                            <div className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 border-b border-orange-200 text-orange-700 text-xs font-semibold">
                                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                                <span>⚠️ {competing + 1} طلبات على نفس التواريخ — اختر واحدًا</span>
                                            </div>
                                        )}

                                        <div className="p-4 space-y-3">
                                            {/* Guest name */}
                                            <p className="text-xl font-bold text-gray-900 leading-tight">
                                                {booking.guest?.full_name ?? "ضيف"}
                                            </p>

                                            {/* Dates */}
                                            <p className="text-base text-gray-700 font-medium">
                                                {formatArabicRange(booking.start_date, booking.end_date)}
                                            </p>

                                            {/* Meta row: guests · payment · price */}
                                            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-4 w-4" />
                                                    {booking.num_guests ?? 1}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    {booking.payment_method === "cash"
                                                        ? <Banknote className="h-4 w-4" />
                                                        : <CreditCard className="h-4 w-4" />}
                                                    {booking.payment_method === "cash" ? "نقداً" : "تحويل"}
                                                </span>
                                                <span className="text-gray-400">{booking.total_price} د.ل</span>
                                            </div>

                                            {/* Expiry */}
                                            {expiry && (
                                                isExpired
                                                    ? <p className="text-xs text-red-500 font-medium">منتهي الصلاحية</p>
                                                    : (
                                                        <div className="flex items-center gap-1.5 text-amber-600">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            <span className="text-xs">
                                                                ينتهي {formatDistanceToNow(expiry, { locale: ar, addSuffix: true })}
                                                            </span>
                                                        </div>
                                                    )
                                            )}

                                            {/* Booking code — subtle */}
                                            {booking.booking_code && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs text-gray-400 font-mono">{booking.booking_code}</span>
                                                    <button
                                                        onClick={() => copyCode(booking.booking_code)}
                                                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                                                    >
                                                        {copiedCode === booking.booking_code
                                                            ? <Check className="h-3 w-3 text-green-500" />
                                                            : <Copy className="h-3 w-3 text-gray-400" />}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Action buttons — full-width, large touch targets */}
                                            <div className="grid grid-cols-2 gap-3 pt-1">
                                                <button
                                                    onClick={() => handleAccept(booking)}
                                                    disabled={accepting || declining}
                                                    className="flex items-center justify-center gap-2 h-12 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold text-base transition-colors disabled:opacity-50"
                                                >
                                                    {accepting
                                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                                        : <CheckCircle2 className="h-4 w-4" />}
                                                    قبول
                                                </button>
                                                <button
                                                    onClick={() => handleDecline(booking.id)}
                                                    disabled={accepting || declining}
                                                    className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-red-300 text-red-600 hover:bg-red-50 active:bg-red-100 font-semibold text-base transition-colors disabled:opacity-50"
                                                >
                                                    {declining
                                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                                        : <XCircle className="h-4 w-4" />}
                                                    رفض
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Non-pending bookings */}
                            {otherInProp.map(booking => (
                                <div
                                    key={booking.id}
                                    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-2"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-base font-bold text-gray-900">
                                            {booking.guest?.full_name ?? "ضيف"}
                                        </p>
                                        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[booking.status] ?? "bg-gray-100 text-gray-600"}`}>
                                            {STATUS_LABEL[booking.status] ?? booking.status}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-600">
                                        {formatArabicRange(booking.start_date, booking.end_date)}
                                    </p>

                                    <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3.5 w-3.5" />
                                            {booking.num_guests ?? 1}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            {booking.payment_method === "cash"
                                                ? <Banknote className="h-3.5 w-3.5" />
                                                : <CreditCard className="h-3.5 w-3.5" />}
                                            {booking.payment_method === "cash" ? "نقداً" : "تحويل"}
                                        </span>
                                        <span>{booking.total_price} د.ل</span>
                                    </div>

                                    {/* Booking code — subtle */}
                                    {booking.booking_code && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-gray-400 font-mono">{booking.booking_code}</span>
                                            <button
                                                onClick={() => copyCode(booking.booking_code)}
                                                className="p-1 rounded hover:bg-gray-100 transition-colors"
                                            >
                                                {copiedCode === booking.booking_code
                                                    ? <Check className="h-3 w-3 text-green-500" />
                                                    : <Copy className="h-3 w-3 text-gray-300" />}
                                            </button>
                                        </div>
                                    )}

                                    {booking.payment_proof_url && (
                                        <a href={booking.payment_proof_url} target="_blank" className="text-blue-600 underline text-sm block">
                                            عرض إيصال الدفع
                                        </a>
                                    )}

                                    {booking.status === "host_verifying" && (
                                        <button
                                            onClick={() => handleConfirmPayment(booking.id)}
                                            className="mt-2 w-full h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors"
                                        >
                                            تأكيد استلام الدفع
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
