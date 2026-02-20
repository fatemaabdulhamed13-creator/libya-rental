"use client";

import { useState, useEffect, useRef } from "react";
import { Minus, Plus, ChevronDown, ChevronUp } from "lucide-react";
import BookingForm from "@/components/booking/booking-form";

// --- GuestSelector Component ---
interface GuestSelectorProps {
    maxGuests: number;
    adults: number;
    children: number;
    onAdultsChange: (n: number) => void;
    onChildrenChange: (n: number) => void;
}

export function GuestSelector({ maxGuests, adults, children, onAdultsChange, onChildrenChange }: GuestSelectorProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const total = adults + children;

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full border-t border-gray-300 p-3 text-right hover:bg-gray-50 transition-colors"
            >
                <span className="block text-[10px] font-bold uppercase text-gray-700 tracking-wider">الضيوف</span>
                <div className="flex items-center justify-between mt-0.5">
                    <span className="text-sm text-gray-700">
                        {total} {total === 1 ? "ضيف" : "ضيوف"}
                    </span>
                    {open ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                </div>
            </button>

            {/* Popover */}
            {open && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-4 space-y-4">
                    {/* Adults Row */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900">بالغون</p>
                            <p className="text-xs text-gray-500">13 سنة فما فوق</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => onAdultsChange(Math.max(1, adults - 1))}
                                disabled={adults <= 1}
                                className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium">{adults}</span>
                            <button
                                type="button"
                                onClick={() => onAdultsChange(Math.min(maxGuests - children, adults + 1))}
                                disabled={total >= maxGuests}
                                className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Children Row */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900">أطفال</p>
                            <p className="text-xs text-gray-500">من 2 إلى 12 سنة</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => onChildrenChange(Math.max(0, children - 1))}
                                disabled={children <= 0}
                                className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium">{children}</span>
                            <button
                                type="button"
                                onClick={() => onChildrenChange(Math.min(maxGuests - adults, children + 1))}
                                disabled={total >= maxGuests}
                                className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Max guests hint */}
                    <p className="text-xs text-gray-400 pt-1 border-t border-gray-100">
                        الحد الأقصى {maxGuests} ضيوف لهذا المكان
                    </p>
                </div>
            )}
        </div>
    );
}

// --- BookingWidget Wrapper ---
interface BookingWidgetProps {
    property: any;
}

export default function BookingWidget({ property }: BookingWidgetProps) {
    return (
        <div id="booking-widget" className="lg:col-span-1">
            <BookingForm property={property} />
        </div>
    );
}
