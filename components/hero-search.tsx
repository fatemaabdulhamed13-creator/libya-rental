"use client";

import { Search } from "lucide-react";
import { useSearchModal } from "@/hooks/use-search-modal";

export default function HeroSearchButton() {
    const { openModal } = useSearchModal();

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Desktop - Big Search Button */}
            <button
                onClick={() => openModal("location")}
                className="hidden md:flex items-center justify-between w-full bg-white rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-4 hover:shadow-[0_24px_70px_rgba(0,0,0,0.55)] transition-all group"
            >
                <div className="flex items-center gap-6 flex-1 px-4">
                    <div className="text-right">
                        <div className="font-semibold text-gray-900">أي مكان</div>
                        <div className="text-sm text-gray-500">ابحث عن وجهتك</div>
                    </div>
                    <div className="h-8 w-px bg-gray-300" />
                    <div className="text-right">
                        <div className="font-semibold text-gray-900">أي أسبوع</div>
                        <div className="text-sm text-gray-500">أضف تواريخ</div>
                    </div>
                    <div className="h-8 w-px bg-gray-300" />
                    <div className="text-right flex-1">
                        <div className="font-semibold text-gray-900">أضف ضيوف</div>
                        <div className="text-sm text-gray-500">كم عدد الضيوف؟</div>
                    </div>
                </div>
                <div className="bg-secondary p-4 rounded-full group-hover:scale-110 transition-transform">
                    <Search className="h-5 w-5 text-white" />
                </div>
            </button>

            {/* Mobile - Compact Search Button */}
            <button
                onClick={() => openModal("location")}
                className="md:hidden w-full bg-white rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-4 flex items-center gap-3 hover:shadow-[0_24px_70px_rgba(0,0,0,0.55)] transition-all"
            >
                <Search className="h-5 w-5 text-gray-400" />
                <div className="flex-1 text-right text-gray-500">
                    ابحث عن إقامتك المثالية...
                </div>
            </button>
        </div>
    );
}
