"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Heart, BriefcaseBusiness, User } from "lucide-react";

const navItems = [
    {
        href: "/",
        label: "الرئيسية",
        icon: Home,
        match: (p: string) => p === "/",
    },
    {
        href: "/favorites",
        label: "المفضلة",
        icon: Heart,
        match: (p: string) => p.startsWith("/favorites"),
    },
    {
        href: "/guest/trips",
        label: "رحلاتي",
        icon: BriefcaseBusiness,
        match: (p: string) => p.startsWith("/guest"),
    },
    {
        href: "/profile",
        label: "حسابي",
        icon: User,
        match: (p: string) => p.startsWith("/profile"),
    },
];

export default function MobileNav() {
    const pathname = usePathname();
    const [isPWA, setIsPWA] = useState(false);

    useEffect(() => {
        const standalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window.navigator as any).standalone === true;
        setIsPWA(standalone);
    }, []);

    return (
        <nav
            style={
                isPWA
                    ? {
                        // Floating island — lifted above the iOS home indicator
                        bottom: "calc(env(safe-area-inset-bottom) + 1.25rem)",
                        left: "1rem",
                        right: "1rem",
                        borderRadius: "9999px",
                        border: "none",
                        boxShadow:
                            "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
                    }
                    : {
                        // Standard browser — edge-docked with top border
                        bottom: 0,
                        left: 0,
                        right: 0,
                        borderRadius: 0,
                        borderTop: "1px solid #e5e7eb",
                        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
                    }
            }
            className="fixed z-50 md:hidden bg-white/95 backdrop-blur-md"
            role="navigation"
            aria-label="القائمة السفلية"
        >
            <div className="flex items-stretch justify-around h-14">
                {navItems.map(({ href, label, icon: Icon, match }) => {
                    const active = match(pathname);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`
                                flex flex-col items-center justify-center gap-1
                                flex-1 min-w-0 px-2
                                text-[10px] font-semibold tracking-wide
                                transition-colors duration-150
                                ${active
                                    ? "text-[#F59E0B]"
                                    : "text-gray-400 hover:text-gray-600 active:text-[#F59E0B]"
                                }
                            `}
                            aria-current={active ? "page" : undefined}
                        >
                            <span className="relative">
                                <Icon
                                    className={`h-6 w-6 transition-transform duration-150 ${active ? "scale-110" : ""}`}
                                    strokeWidth={active ? 2.5 : 1.8}
                                    fill={active && href === "/favorites" ? "#F59E0B" : "none"}
                                />
                                {active && (
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#F59E0B]" />
                                )}
                            </span>
                            <span className="truncate">{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
