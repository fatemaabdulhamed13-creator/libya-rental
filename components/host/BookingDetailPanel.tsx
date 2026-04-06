"use client";

import { Drawer } from "vaul";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
    X, Users, Banknote, CreditCard, Clock, CheckCircle2, XCircle,
    Loader2, AlertTriangle, Copy, Check, CalendarDays
} from "lucide-react";
import { format, parseISO, differenceInCalendarDays, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

// ── types ────────────────────────────────────────────────────────────────────

export interface BookingForPanel {
    id: string;
    start_date: string;
    end_date: string;
    total_price: number;
    num_guests: number | null;
    payment_method: "cash" | "bank_transfer";
    payment_proof_url?: string | null;
    booking_code?: string | null;
    status: string;
    expires_at?: string | null;
    guest: { full_name: string | null } | null;
    property: { title: string | null; images?: string[] | null } | null;
    competingCount?: number;
}

interface BookingDetailPanelProps {
    booking: BookingForPanel | null;
    onClose: () => void;
    onAccept: (booking: BookingForPanel) => Promise<void>;
    onDecline: (id: string) => Promise<void>;
    onConfirmPayment: (id: string) => Promise<void>;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function nights(start: string, end: string) {
    return differenceInCalendarDays(parseISO(end), parseISO(start));
}
function fmt(d: string, pattern: string) {
    return format(parseISO(d), pattern, { locale: ar });
}

// ── component ────────────────────────────────────────────────────────────────

export default function BookingDetailPanel({
    booking,
    onClose,
    onAccept,
    onDecline,
    onConfirmPayment,
}: BookingDetailPanelProps) {
    // Detect desktop: md breakpoint = 768 px
    const [isDesktop, setIsDesktop] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)");
        setIsDesktop(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    const [actionLoading, setActionLoading] = useState<"accept" | "decline" | "confirm" | null>(null);
    const [copied, setCopied] = useState(false);

    const open = booking !== null;
    if (!booking) return null;

    const n = nights(booking.start_date, booking.end_date);
    const perNight = n > 0 ? Math.round(booking.total_price / n) : booking.total_price;
    const coverImage = booking.property?.images?.[0] ?? null;
    const isPending = booking.status === "pending";
    const expiry = booking.expires_at ? new Date(booking.expires_at) : null;
    const isExpired = expiry && expiry < new Date();

    const handleAccept = async () => {
        setActionLoading("accept");
        await onAccept(booking);
        setActionLoading(null);
        onClose();
    };
    const handleDecline = async () => {
        setActionLoading("decline");
        await onDecline(booking.id);
        setActionLoading(null);
        onClose();
    };
    const handleConfirm = async () => {
        setActionLoading("confirm");
        await onConfirmPayment(booking.id);
        setActionLoading(null);
        // stay open — status will update on re-fetch
    };
    const copyCode = () => {
        if (!booking.booking_code) return;
        navigator.clipboard.writeText(booking.booking_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Panel content (shared between mobile + desktop) ───────────────────────
    const content = (
        <div className="flex flex-col h-full" dir="rtl">
            {/* Close button */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
                <h2 className="text-base font-bold text-gray-900">تفاصيل الطلب</h2>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="إغلاق"
                >
                    <X className="h-5 w-5 text-gray-500" />
                </button>
            </div>

            {/* ── Scrollable body ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4 space-y-5">

                {/* Competing alert */}
                {(booking.competingCount ?? 0) > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-sm font-semibold">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>⚠️ {(booking.competingCount ?? 0) + 1} طلبات على نفس التواريخ — اختر واحدًا</span>
                    </div>
                )}

                {/* Cover photo — shorter on mobile so buttons stay visible */}
                <div className="relative w-full h-36 md:aspect-video rounded-2xl overflow-hidden bg-gray-100">
                    {coverImage ? (
                        <Image
                            src={coverImage}
                            alt={booking.property?.title ?? "عقار"}
                            fill
                            sizes="(max-width: 768px) 100vw, 400px"
                            className="object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-5xl">🏠</div>
                    )}
                </div>

                {/* Property + guest */}
                <div>
                    <p className="text-xs font-semibold text-primary mb-0.5">
                        {booking.property?.title ?? "عقار"}
                    </p>
                    <p className="text-xl font-extrabold text-gray-900">
                        {booking.guest?.full_name ?? "ضيف"}
                    </p>
                </div>

                <hr className="border-gray-100" />

                {/* Dates */}
                <section className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">التواريخ</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 mb-0.5">الوصول</p>
                            <p className="text-sm font-bold text-gray-900">{fmt(booking.start_date, "d MMMM yyyy")}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 mb-0.5">المغادرة</p>
                            <p className="text-sm font-bold text-gray-900">{fmt(booking.end_date, "d MMMM yyyy")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>{n} ليلة</span>
                        <span>·</span>
                        <Users className="h-3.5 w-3.5" />
                        <span>{booking.num_guests ?? 1} ضيوف</span>
                    </div>
                </section>

                <hr className="border-gray-100" />

                {/* Payout breakdown */}
                <section className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">ملخص الدفع</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>{perNight} د.ل × {n} ليلة</span>
                            <span>{booking.total_price} د.ل</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>طريقة الدفع</span>
                            <span className="flex items-center gap-1 font-medium text-gray-900">
                                {booking.payment_method === "cash"
                                    ? <><Banknote className="h-3.5 w-3.5" /> نقدًا</>
                                    : <><CreditCard className="h-3.5 w-3.5" /> تحويل بنكي</>
                                }
                            </span>
                        </div>
                        <div className="flex justify-between items-baseline pt-2 border-t border-gray-100">
                            <span className="text-sm font-bold text-gray-900">الإجمالي</span>
                            <span className="text-2xl font-black text-primary">{booking.total_price} د.ل</span>
                        </div>
                    </div>
                </section>

                {/* Expiry */}
                {expiry && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${isExpired ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
                        }`}>
                        <Clock className="h-4 w-4 shrink-0" />
                        {isExpired
                            ? "انتهت صلاحية هذا الطلب"
                            : `ينتهي ${formatDistanceToNow(expiry, { locale: ar, addSuffix: true })}`
                        }
                    </div>
                )}

                {/* Booking code */}
                {booking.booking_code && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                        <span className="text-xs text-gray-500 font-mono">{booking.booking_code}</span>
                        <button onClick={copyCode} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                            {copied
                                ? <Check className="h-3.5 w-3.5 text-green-500" />
                                : <Copy className="h-3.5 w-3.5 text-gray-400" />
                            }
                        </button>
                    </div>
                )}

                {/* Payment proof link */}
                {booking.payment_proof_url && (
                    <a
                        href={booking.payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-sm text-blue-600 underline"
                    >
                        عرض إيصال الدفع
                    </a>
                )}
            </div>

            {/* ── Fixed action buttons ─────────────────────────────────────── */}
            {isPending && (
                <div className="shrink-0 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-gray-100 bg-white grid grid-cols-2 gap-3">
                    <button
                        onClick={handleAccept}
                        disabled={!!actionLoading}
                        className="flex items-center justify-center gap-2 h-13 rounded-2xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold text-base transition-colors disabled:opacity-50"
                    >
                        {actionLoading === "accept"
                            ? <Loader2 className="h-5 w-5 animate-spin" />
                            : <CheckCircle2 className="h-5 w-5" />
                        }
                        قبول
                    </button>
                    <button
                        onClick={handleDecline}
                        disabled={!!actionLoading}
                        className="flex items-center justify-center gap-2 h-13 rounded-2xl border-2 border-red-300 text-red-600 hover:bg-red-50 font-bold text-base transition-colors disabled:opacity-50"
                    >
                        {actionLoading === "decline"
                            ? <Loader2 className="h-5 w-5 animate-spin" />
                            : <XCircle className="h-5 w-5" />
                        }
                        رفض
                    </button>
                </div>
            )}

            {booking.status === "host_verifying" && (
                <div className="shrink-0 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-gray-100 bg-white">
                    <button
                        onClick={handleConfirm}
                        disabled={!!actionLoading}
                        className="w-full h-13 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-base transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {actionLoading === "confirm"
                            ? <Loader2 className="h-5 w-5 animate-spin" />
                            : <CheckCircle2 className="h-5 w-5" />
                        }
                        تأكيد استلام الدفع
                    </button>
                </div>
            )}
        </div>
    );

    // ── Mobile: bottom sheet ───────────────────────────────────────────────────
    if (!isDesktop) {
        return (
            <Drawer.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
                    <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-white rounded-t-3xl max-h-[96dvh] focus:outline-none">
                        {/* Drag handle */}
                        <div className="mx-auto mt-3 mb-1 w-10 h-1.5 rounded-full bg-gray-300 shrink-0" />
                        <div className="flex-1 overflow-hidden flex flex-col">
                            {content}
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        );
    }

    // ── Desktop: left side-sheet ───────────────────────────────────────────────
    return (
        <Drawer.Root
            open={open}
            onOpenChange={(v) => { if (!v) onClose(); }}
            direction="left"
        >
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/30 z-40" />
                <Drawer.Content className="fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-white w-[420px] max-w-[45vw] shadow-2xl focus:outline-none">
                    {content}
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
