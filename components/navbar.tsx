"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
import { Button } from "@/components/ui/button";
import { LogOut, Home, UserCircle, Building2, Search, Menu, Plus, Shield } from "lucide-react";
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
    const { openModal } = useSearchModal();
    const { location, checkIn, checkOut, guests } = useSearch();

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
        const { data } = await (supabase
            .from("profiles") as any)
            .select("is_host")
            .eq("id", userId)
            .maybeSingle(); // returns null (not 406) when no row exists
        setProfile(data ?? null);
    };

    useEffect(() => {
        // onAuthStateChange fires INITIAL_SESSION immediately on mount,
        // so we do NOT also call fetchUserAndProfile() here — that would
        // cause a double fetch on every page load.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // TOKEN_REFRESHED fires silently in the background; no need to
            // re-query the profile table just because the JWT rotated.
            if (event === 'TOKEN_REFRESHED') return;

            if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                setLoading(false);
                return;
            }

            // INITIAL_SESSION, SIGNED_IN, USER_UPDATED
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        // Listen for profile updates dispatched by the profile form
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

    // Scroll listener for homepage
    useEffect(() => {
        if (!isHomepage) {
            setShowSearchPill(true);
            return;
        }

        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowSearchPill(true);
            } else {
                setShowSearchPill(false);
            }
        };

        // Don't call handleScroll() on mount to avoid hydration mismatch
        // Let the scroll event handler update it naturally
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isHomepage]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setMenuOpen(false);
        router.push("/");
        router.refresh();
    };

    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm" dir="rtl">
            <div className="container mx-auto px-4 md:px-6 lg:px-8">
                <div className="relative flex items-center justify-between h-16 md:h-20">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="bg-primary p-2 rounded-xl group-hover:scale-105 transition-transform">
                            <Home className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-primary hidden sm:block">
                            ليبيا رنتل
                        </span>
                    </Link>

                    {/* Center Search Bar - absolutely centered so it's always mid-page */}
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

                    {/* Right Side - User Menu */}
                    <div className="flex items-center gap-4">
                        {/* Host CTA Button - Desktop Only */}
                        {!loading && (
                            user ? (
                                profile?.is_host ? (
                                    // Logged In + Is Host: Add Property Button
                                    <Link
                                        href="/host/properties/new"
                                        className="hidden md:flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:border-gray-900 hover:shadow-md transition-all"
                                    >
                                        <span>إضافة عقار</span>
                                        <Plus className="h-4 w-4" />
                                    </Link>
                                ) : (
                                    // Logged In but NOT a Host: Become a Host Button (redirects to profile)
                                    <Link
                                        href="/profile"
                                        className="hidden md:block text-sm font-semibold px-4 py-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                                    >
                                        كن مضيفاً
                                    </Link>
                                )
                            ) : (
                                // Not Logged In: Become a Host Button (links to login)
                                <Link
                                    href="/login"
                                    className="hidden md:block text-sm font-semibold px-4 py-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    كن مضيفاً
                                </Link>
                            )
                        )}

                        {/* User Menu Button */}
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="flex items-center gap-3 border border-gray-300 rounded-full pl-2 pr-4 py-2 hover:shadow-md transition-shadow"
                            >
                                <Menu className="h-4 w-4 text-gray-700" />
                                <UserCircle className="h-7 w-7 text-gray-700" />
                            </button>

                            {/* Dropdown Menu */}
                            {menuOpen && (
                                <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                                    {user ? (
                                        <>
                                            {/* Admin Dashboard Link - Only for admin email */}
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

                                            <Link
                                                href="/guest/trips"
                                                onClick={() => setMenuOpen(false)}
                                                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                حجوزاتي
                                            </Link>
                                            <Link
                                                href="/favorites"
                                                onClick={() => setMenuOpen(false)}
                                                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                المفضلة
                                            </Link>
                                            <div className="border-t border-gray-100 my-2" />
                                            {profile?.is_host ? (
                                                <>
                                                    <Link
                                                        href="/host/properties"
                                                        onClick={() => setMenuOpen(false)}
                                                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Building2 className="h-4 w-4 inline ml-2" />
                                                        عقاراتي
                                                    </Link>
                                                    <Link
                                                        href="/host/bookings"
                                                        onClick={() => setMenuOpen(false)}
                                                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                    >
                                                        الحجوزات
                                                    </Link>
                                                    <div className="border-t border-gray-100 my-2" />
                                                </>
                                            ) : (
                                                <>
                                                    <div className="border-t border-gray-100 my-2" />
                                                    <Link
                                                        href="/profile"
                                                        onClick={() => setMenuOpen(false)}
                                                        className="block px-4 py-3 text-sm font-semibold text-primary hover:bg-teal-50 transition-colors"
                                                    >
                                                        كن مضيفاً
                                                    </Link>
                                                    <div className="border-t border-gray-100 my-2" />
                                                </>
                                            )}
                                            <Link
                                                href="/profile"
                                                onClick={() => setMenuOpen(false)}
                                                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                الملف الشخصي
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-right px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <LogOut className="h-4 w-4 inline ml-2" />
                                                تسجيل الخروج
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link
                                                href="/login"
                                                onClick={() => setMenuOpen(false)}
                                                className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                تسجيل الدخول
                                            </Link>
                                            <Link
                                                href="/register"
                                                onClick={() => setMenuOpen(false)}
                                                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                إنشاء حساب
                                            </Link>
                                            <div className="border-t border-gray-100 my-2" />
                                            <Link
                                                href="/profile"
                                                onClick={() => setMenuOpen(false)}
                                                className="block px-4 py-3 text-sm font-semibold text-primary hover:bg-teal-50 transition-colors"
                                            >
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

            {/* Search Modal */}
            <SearchModal />

            {/* Click outside to close menu */}
            {menuOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                />
            )}
        </nav>
    );
}
