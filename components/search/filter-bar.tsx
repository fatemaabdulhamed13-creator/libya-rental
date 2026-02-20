"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

const GUEST_OPTIONS = [
    { label: "أي عدد", value: "" },
    { label: "١+ ضيف", value: "1" },
    { label: "٢+ ضيوف", value: "2" },
    { label: "٤+ ضيوف", value: "4" },
    { label: "٦+ ضيوف", value: "6" },
];

export default function FilterBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentMinPrice = searchParams.get("minPrice") || "";
    const currentMaxPrice = searchParams.get("maxPrice") || "";
    const currentGuests = searchParams.get("guests") || "";

    const [showFilters, setShowFilters] = useState(false);
    const [minPrice, setMinPrice] = useState(currentMinPrice);
    const [maxPrice, setMaxPrice] = useState(currentMaxPrice);
    const [guests, setGuests] = useState(currentGuests);

    const activeFilterCount = [currentMinPrice, currentMaxPrice, currentGuests].filter(Boolean).length;

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams.toString());

        if (minPrice) params.set("minPrice", minPrice);
        else params.delete("minPrice");

        if (maxPrice) params.set("maxPrice", maxPrice);
        else params.delete("maxPrice");

        if (guests) params.set("guests", guests);
        else params.delete("guests");

        router.push(`/search?${params.toString()}`);
        setShowFilters(false);
    };

    const clearFilters = () => {
        setMinPrice("");
        setMaxPrice("");
        setGuests("");

        const params = new URLSearchParams(searchParams.toString());
        params.delete("minPrice");
        params.delete("maxPrice");
        params.delete("guests");
        router.push(`/search?${params.toString()}`);
        setShowFilters(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") applyFilters();
    };

    return (
        <div className="bg-white border-b border-gray-200 shadow-sm z-20">
            <div className="container mx-auto px-4 py-3">
                {/* Filter toggle */}
                <div className="flex items-center justify-end">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                            activeFilterCount > 0
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                        }`}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        <span>فلاتر</span>
                        {activeFilterCount > 0 && (
                            <span className="bg-white text-primary text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Expandable Filter Panel */}
                {showFilters && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                            {/* Price Range */}
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600 font-medium whitespace-nowrap">السعر:</label>
                                <input
                                    type="number"
                                    placeholder="من"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-24 h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                />
                                <span className="text-gray-400">—</span>
                                <input
                                    type="number"
                                    placeholder="إلى"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-24 h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                />
                                <span className="text-xs text-gray-500">د.ل</span>
                            </div>

                            {/* Guest Count */}
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600 font-medium whitespace-nowrap">الضيوف:</label>
                                <select
                                    value={guests}
                                    onChange={(e) => setGuests(e.target.value)}
                                    className="h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                >
                                    {GUEST_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={applyFilters}
                                    className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary/90 transition-colors"
                                >
                                    تطبيق
                                </button>
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-4 py-2 text-gray-600 text-sm font-medium rounded-full border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        مسح
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
