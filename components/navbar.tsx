"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { LogOut, UserCircle, Building2, Search, Menu, Plus, Shield, Bell, CalendarCheck } from "lucide-react";
import NextImage from "next/image";
import { useSearchModal } from "@/hooks/use-search-modal";
import { useSearch } from "@/contexts/search-context";
import SearchModal from "@/components/modals/search-modal";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// Admin email - for showing admin dashboard link
const ADMIN_EMAIL = "fatemaabdulhamed13@gmail.com";

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showSearchPill, setShowSearchPill] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const { openModal } = useSearchModal();
    const { location, checkIn, checkOut, guests } = useSearch();
    const supabase = createClient();

    // Pill label helpers
    const pillLocation = location ? location.split(" (")[0].trim() : "أي مكان";
    const pillDates = checkIn && checkOut
        ? `${format(checkIn, "d MMM", { locale: ar })} — ${format(checkOut, "d MMM", { locale: ar })}`
        : checkIn
            ? format(checkIn, "d MMM", { locale: ar })
            : "أي أسبوع";
    const pillGuests = guests > 1 ? `${guests} ضيوف` : "أضف ضيوف";

    const isHomepage = pathname === '/';

    const fetchProfile = async (userId: string) => {
        const { data } = await supabase
            .from("public_profiles_view")
            .select("is_host")
            .eq("id", userId)
            .maybeSingle();
        setProfile(data ?? null);
    };

    // ── Auth state listener ────────────────────────────────────────────────
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'TOKEN_REFRESHED') return;

            if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                setPendingCount(0);
                setLoading(false);
                return;
            }

            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        const handleProfileUpdate = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) await fetchProfile(session.user.id);
        };

        window.addEventListener('profile-updated', handleProfileUpdate);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('profile-updated', handleProfileUpdate);
        };
    }, []);

    // ── Real-time pending bookings count (hosts only) ──────────────────────
    useEffect(() => {
        if (!user || !profile?.is_host) {
            setPendingCount(0);
            return;
        }

        const loadCount = async () => {
            const { count } = await supabase
                .from("bookings")
                .select("*", { count: "exact", head: true })
                .eq("host_id", user.id)
                .eq("status", "pending");
            setPendingCount(count ?? 0);
        };

        loadCount();

        const channel = supabase
            .channel("navbar-host-pending")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "bookings", filter: `host_id=eq.${user.id}` },
                () => loadCount()
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user?.id, profile?.is_host]);

    // ── Scroll listener for homepage ───────────────────────────────────────
    useEffect(() => {
        if (!isHomepage) {
            setShowSearchPill(true);
            return;
        }

        const handleScroll = () => {
            setShowSearchPill(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isHomepage]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setMenuOpen(false);
        // Hard navigate so the server picks up the cleared auth cookie immediately
        window.location.href = "/";
    };

    const isHost = !!profile?.is_host;

    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm" dir="rtl">
            <div className="container mx-auto px-4 md:px-6 lg:px-8">
                <div className="relative flex items-center justify-between h-16 md:h-24">

                    {/* Logo */}
                    <Link href="/" className="flex items-end gap-1 group">
                        <NextImage
                            src="/brand-logo-v1.png"
                            alt="استراحة"
                            width={55}
                            height={55}
                            className="object-contain group-hover:scale-105 transition-transform shrink-0"
                            priority
                        />
                        <span className="text-lg font-bold text-primary hidden sm:block">
                            استراحة
                        </span>
                    </Link>

                    {/* Center Search Pill */}
                    <div className={`absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center transition-opacity duration-300 ${showSearchPill ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="flex items-center border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer whitespace-nowrap">
                            <button
                                onClick={() => openModal("location")}
                                className={`px-4 py-2.5 text-sm font-medium hover:bg-gray-50 rounded-r-full transition-colors border-l border-gray-200 ${location ? "text-gray-900" : "text-gray-500"}`}
                            >
                                {pillLocation}
                            </button>
                            <button
                                onClick={() => openModal("dates")}
                                className={`px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors border-l border-gray-200 ${checkIn ? "text-gray-900" : "text-gray-500"}`}
                            >
                                {pillDates}
                            </button>
                            <button
                                onClick={() => openModal("guests")}
                                className="pl-3 pr-2 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <span className={guests > 1 ? "text-gray-900 font-medium" : "text-gray-500"}>{pillGuests}</span>
                                <div className="bg-primary p-1.5 rounded-full">
                                    <Search className="h-3.5 w-3.5 text-white" />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-2">

                        {/* Host: Add Property button (desktop) */}
                        {!loading && isHost && (
                            <Link
                                href="/host/properties/new"
                                className="hidden md:flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full bg-[#e09b53] hover:bg-[#c98642] text-white transition-all shadow-sm hover:shadow-md"
                            >
                                <span>إضافة عقار</span>
                                <Plus className="h-4 w-4" />
                            </Link>
                        )}

                        {/* Non-host logged in: Become a Host */}
                        {!loading && user && !isHost && (
                            <Link
                                href="/profile"
                                className="hidden md:block text-sm font-semibold px-4 py-2 rounded-full bg-[#e09b53] hover:bg-[#c98642] text-white transition-all shadow-sm hover:shadow-md"
                            >
                                كن مضيفاً
                            </Link>
                        )}

                        {/* Not logged in: Become a Host */}
                        {!loading && !user && (
                            <Link
                                href="/login"
                                className="hidden md:block text-sm font-semibold px-4 py-2 rounded-full bg-[#e09b53] hover:bg-[#c98642] text-white transition-all shadow-sm hover:shadow-md"
                            >
                                كن مضيفاً
                            </Link>
                        )}

                        {/* ── Notification Bell (hosts only) ── */}
                        {!loading && isHost && (
                            <Link
                                href="/host/bookings"
                                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                                aria-label="إشعارات الحجوزات"
                            >
                                <Bell className="h-5 w-5 text-slate-800" />
                                {pendingCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                                        {pendingCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* User Menu Button */}
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="flex items-center gap-3 border border-gray-300 rounded-full pl-2 pr-4 py-2 hover:shadow-md transition-shadow"
                            >
                                <Menu className="h-4 w-4 text-slate-800" />
                                <UserCircle className="h-7 w-7 text-slate-800" />
                            </button>

                            {/* Dropdown */}
                            {menuOpen && (
                                <div className="absolute left-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                                    {user ? (
                                        <>
                                            {/* Admin link */}
                                            {user.email === ADMIN_EMAIL && (
                                                <>
                                                    <Link
                                                        href="/admin"
                                                        onClick={() => setMenuOpen(false)}
                                                        className="block px-4 py-3 text-sm font-bold text-primary hover:bg-teal-50 transition-colors"
                                                    >
                                                        <Shield className="h-4 w-4 inline ml-2" />
                                                        لوحة الإدارة 🛡️
                                                    </Link>
                                                    <div className="border-t border-gray-200 my-2" />
                                                </>
                                            )}

                                            {/* Guest links */}
                                            <Link href="/guest/trips" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                حجوزاتي
                                            </Link>
                                            <Link href="/favorites" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                المفضلة
                                            </Link>

                                            {/* Host links */}
                                            {isHost ? (
                                                <>
                                                    <div className="border-t border-gray-100 my-2" />
                                                    <p className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">لوحة المضيف</p>
                                                    <Link
                                                        href="/host/properties"
                                                        onClick={() => setMenuOpen(false)}
                                                        className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Building2 className="h-4 w-4 text-gray-400" />
                                                        عقاراتي
                                                    </Link>
                                                    <Link
                                                        href="/host/bookings"
                                                        onClick={() => setMenuOpen(false)}
                                                        className="flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <CalendarCheck className="h-4 w-4 text-gray-400" />
                                                            الحجوزات
                                                        </span>
                                                        {pendingCount > 0 && (
                                                            <span className="bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 leading-none">
                                                                {pendingCount}
                                                            </span>
                                                        )}
                                                    </Link>
                                                    <div className="border-t border-gray-100 my-2" />
                                                </>
                                            ) : (
                                                <>
                                                    <div className="border-t border-gray-100 my-2" />
                                                    <Link href="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-semibold text-primary hover:bg-teal-50 transition-colors">
                                                        كن مضيفاً
                                                    </Link>
                                                    <div className="border-t border-gray-100 my-2" />
                                                </>
                                            )}

                                            <Link href="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                الملف الشخصي
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-right px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                تسجيل الخروج
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                                تسجيل الدخول
                                            </Link>
                                            <Link href="/register" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                إنشاء حساب
                                            </Link>
                                            <div className="border-t border-gray-100 my-2" />
                                            <Link href="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-semibold text-primary hover:bg-teal-50 transition-colors">
                                                كن مضيفاً
                                            </Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <SearchModal />

            {menuOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            )}
        </nav>
    );
}
