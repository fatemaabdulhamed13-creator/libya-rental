"use client";

import { Star } from "lucide-react";

interface MobileBookingBarProps {
    price: number;
}

export default function MobileBookingBar({ price }: MobileBookingBarProps) {
    const handleReserve = () => {
        document.getElementById("booking-widget")?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 md:hidden">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold text-gray-900">{price} د.ل</span>
                        <span className="text-sm text-gray-500">/ ليلة</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="h-3 w-3 fill-current text-gray-900" />
                        <span className="font-medium text-gray-900">4.9</span>
                        <span>· 23 تقييم</span>
                    </div>
                </div>
                <button
                    onClick={handleReserve}
                    className="px-6 py-3 bg-secondary text-white rounded-xl font-semibold text-sm hover:bg-secondary/90 transition-colors shadow-lg"
                >
                    احجز الآن
                </button>
            </div>
        </div>
    );
}
