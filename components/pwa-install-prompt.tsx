"use client";

import { useEffect, useState } from "react";
import { X, Share, Plus } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "pwa-install-dismissed";
const COOLDOWN_DAYS = 7;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isStandalone(): boolean {
    if (typeof window === "undefined") return false;
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window.navigator as any).standalone === true
    );
}

function isIOS(): boolean {
    if (typeof window === "undefined") return false;
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isMobile(): boolean {
    if (typeof window === "undefined") return false;
    return /iphone|ipad|ipod|android/i.test(window.navigator.userAgent);
}

function wasDismissedRecently(): boolean {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const ts = parseInt(raw, 10);
        return Date.now() - ts < COOLDOWN_MS;
    } catch {
        return false;
    }
}

function saveDismissed(): void {
    try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
        // ignore
    }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PWAInstallPrompt() {
    const [show, setShow] = useState(false);
    const [isIOSDevice, setIsIOSDevice] = useState(false);
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        // Gate 1: already installed as PWA
        if (isStandalone()) return;

        // Gate 2: only show on mobile
        if (!isMobile()) return;

        // Gate 3: user previously dismissed within cooldown window
        if (wasDismissedRecently()) return;

        const ios = isIOS();
        setIsIOSDevice(ios);

        if (ios) {
            // iOS: show instructional overlay immediately (no event to wait for)
            setShow(true);
            return;
        }

        // Android: capture beforeinstallprompt to prevent mini-infobar
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShow(true);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const dismiss = () => {
        saveDismissed();
        setShow(false);
    };

    const handleAndroidInstall = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setShow(false);
        }
        setDeferredPrompt(null);
    };

    if (!show) return null;

    // ── iOS Overlay ─────────────────────────────────────────────────────────
    if (isIOSDevice) {
        return (
            <div
                className="fixed inset-x-0 bottom-16 z-[60] flex justify-center px-4 mb-2"
                role="dialog"
                aria-label="تثبيت التطبيق"
                dir="rtl"
            >
                {/* Card */}
                <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Amber top stripe */}
                    <div className="h-1 w-full bg-[#F59E0B]" />

                    <div className="p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                                {/* App icon placeholder */}
                                <div className="h-12 w-12 rounded-xl bg-[#F59E0B] flex items-center justify-center shrink-0 shadow-md">
                                    <span className="text-white font-bold text-lg">I</span>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm leading-tight">
                                        ثبّت تطبيق Istiraaha
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        أضف التطبيق إلى شاشتك الرئيسية
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={dismiss}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mt-1 -ml-1"
                                aria-label="إغلاق"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Steps */}
                        <div className="space-y-2.5">
                            <Step number={1}>
                                اضغط على أيقونة{" "}
                                <span className="inline-flex items-center gap-1 font-semibold text-[#F59E0B]">
                                    المشاركة <Share className="h-4 w-4" strokeWidth={2.5} />
                                </span>{" "}
                                في أسفل Safari
                            </Step>
                            <Step number={2}>
                                مرّر للأسفل واضغط{" "}
                                <span className="font-semibold text-gray-800">
                                    &quot;إضافة إلى الشاشة الرئيسية&quot;
                                </span>
                                <Plus className="inline h-4 w-4 mx-1 text-gray-600" strokeWidth={2.5} />
                            </Step>
                            <Step number={3}>
                                اضغط{" "}
                                <span className="font-semibold text-gray-800">
                                    &quot;إضافة&quot;
                                </span>{" "}
                                في أعلى اليمين للتأكيد
                            </Step>
                        </div>
                    </div>

                    {/* Downward arrow pointer */}
                    <div className="flex justify-center pb-3">
                        <div className="w-4 h-4 bg-white border-b border-r border-gray-100 rotate-45 shadow-sm -mb-2" />
                    </div>
                </div>
            </div>
        );
    }

    // ── Android Banner ───────────────────────────────────────────────────────
    return (
        <div
            className="fixed inset-x-0 bottom-16 z-[60] flex justify-center px-4 mb-2"
            role="dialog"
            aria-label="تثبيت التطبيق"
            dir="rtl"
        >
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
                <div className="h-1 w-full bg-[#F59E0B]" />

                <div className="flex items-center gap-3 p-4">
                    {/* App icon */}
                    <div className="h-12 w-12 rounded-xl bg-[#F59E0B] flex items-center justify-center shrink-0 shadow-md">
                        <span className="text-white font-bold text-lg">I</span>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm leading-tight">
                            ثبّت تطبيق Istiraaha
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                            تجربة أسرع وأفضل بدون متصفح
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleAndroidInstall}
                            className="rounded-xl bg-[#F59E0B] hover:bg-[#d97706] active:scale-95 transition-all text-white text-xs font-bold px-3 py-2 shadow-md"
                        >
                            تثبيت
                        </button>
                        <button
                            onClick={dismiss}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            aria-label="إغلاق"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Step helper ─────────────────────────────────────────────────────────────

function Step({
    number,
    children,
}: {
    number: number;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed">
            <span className="shrink-0 h-5 w-5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] font-bold flex items-center justify-center text-[10px] mt-0.5">
                {number}
            </span>
            <span>{children}</span>
        </div>
    );
}
