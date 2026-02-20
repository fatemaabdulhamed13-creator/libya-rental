"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Home, Building2, Waves, Palmtree, LayoutGrid } from "lucide-react";

const CATEGORIES = [
    { id: "beachfront", label: "على البحر", icon: Waves     },
    { id: "istiraha",   label: "استراحة",   icon: Palmtree  },
    { id: "apartment",  label: "شقة",       icon: Building2 },
    { id: "villa",      label: "فيلا",      icon: Home      },
    { id: "chalet",     label: "شاليه",     icon: Waves     },
];

export default function CategoryBar() {
    const router       = useRouter();
    const pathname     = usePathname();
    const searchParams = useSearchParams();
    const active       = searchParams.get("category");

    function navigate(categoryId: string | null) {
        const params = new URLSearchParams(searchParams.toString());

        if (categoryId === null || categoryId === active) {
            // Clear: remove category, keep everything else
            params.delete("category");
        } else {
            params.set("category", categoryId);
        }

        // Always go to /search so category clicks show filtered results
        const base = "/search";
        const qs   = params.toString();
        router.push(qs ? `${base}?${qs}` : base);
    }

    return (
        <div className="border-b border-gray-200 bg-white sticky top-16 md:top-20 z-40" dir="rtl">
            {/* overflow-x-auto is separate from justify-center so centering works */}
            <div className="overflow-x-auto scrollbar-hide">
                <div className="flex justify-center gap-2 md:gap-8 min-w-max mx-auto px-6">

                    {/* عرض الكل — only visible when a category is active */}
                    {active && (
                        <button
                            onClick={() => navigate(null)}
                            className="flex flex-col items-center gap-1.5 px-3 pt-4 pb-3 border-b-2 border-primary text-primary transition-colors shrink-0"
                        >
                            <LayoutGrid className="h-5 w-5" />
                            <span className="text-[11px] font-semibold whitespace-nowrap">عرض الكل</span>
                        </button>
                    )}

                    {CATEGORIES.map(({ id, label, icon: Icon }) => {
                        const isActive = active === id;
                        return (
                            <button
                                key={id}
                                onClick={() => navigate(id)}
                                className={`flex flex-col items-center gap-1.5 px-3 pt-4 pb-3 border-b-2 transition-colors shrink-0 ${
                                    isActive
                                        ? "border-primary text-primary"
                                        : "border-transparent text-gray-400 hover:text-primary/70"
                                }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="text-[11px] font-medium whitespace-nowrap">{label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
