"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

import FilterChip from "./FilterChip";
import FilterBottomSheet from "./FilterBottomSheet";
import { X } from "lucide-react";
import CityFilter from "./filters/CityFilter";
import DateFilter from "./filters/DateFilter";
import GuestsFilter from "./filters/GuestsFilter";
import PriceFilter from "./filters/PriceFilter";

type OpenFilter = "city" | "dates" | "guests" | "price" | null;

function formatDateLabel(checkIn: string, checkOut: string): string {
    if (checkIn && checkOut) {
        return `${format(parseISO(checkIn), "d MMM", { locale: ar })} — ${format(parseISO(checkOut), "d MMM", { locale: ar })}`;
    }
    if (checkIn) return format(parseISO(checkIn), "d MMM", { locale: ar });
    return "التواريخ";
}

function formatPriceLabel(min: string, max: string): string {
    if (min && max) return `${min}—${max} د.ل`;
    if (min) return `من ${min} د.ل`;
    if (max) return `حتى ${max} د.ل`;
    return "السعر";
}

export default function FilterChips() {
    const router      = useRouter();
    const searchParams = useSearchParams();
    const containerRef = useRef<HTMLDivElement>(null);

    const [openFilter, setOpenFilter] = useState<OpenFilter>(null);

    // URL state
    const currentCity     = searchParams.get("city")     ?? "";
    const currentCheckIn  = searchParams.get("checkIn")  ?? "";
    const currentCheckOut = searchParams.get("checkOut") ?? "";
    const currentGuests   = searchParams.get("guests")   ?? "";
    const currentMinPrice = searchParams.get("minPrice") ?? "";
    const currentMaxPrice = searchParams.get("maxPrice") ?? "";

    // Local pending state — reset to URL values whenever a chip is opened
    const [city,     setCity]     = useState(currentCity);
    const [checkIn,  setCheckIn]  = useState(currentCheckIn);
    const [checkOut, setCheckOut] = useState(currentCheckOut);
    const [guests,   setGuests]   = useState(currentGuests);
    const [minPrice, setMinPrice] = useState(currentMinPrice);
    const [maxPrice, setMaxPrice] = useState(currentMaxPrice);

    // Close desktop dropdown when clicking outside the entire FilterChips bar
    useEffect(() => {
        if (!openFilter) return;
        function onPointerDown(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpenFilter(null);
            }
        }
        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, [openFilter]);

    function openFilterPanel(filter: OpenFilter) {
        if (openFilter === filter) {
            setOpenFilter(null);
            return;
        }
        // Sync local state with current URL values before opening
        setCity(currentCity);
        setCheckIn(currentCheckIn);
        setCheckOut(currentCheckOut);
        setGuests(currentGuests);
        setMinPrice(currentMinPrice);
        setMaxPrice(currentMaxPrice);
        setOpenFilter(filter);
    }

    function pushParams(updates: Record<string, string>) {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(updates)) {
            if (value) params.set(key, value);
            else params.delete(key);
        }
        router.push(`/search?${params.toString()}`);
        setOpenFilter(null);
    }

    // Apply handlers (called from dropdown button or bottom sheet apply button)
    const applyCity   = () => pushParams({ city });
    const applyDates  = () => pushParams({ checkIn, checkOut });
    const applyGuests = () => pushParams({ guests });
    const applyPrice  = () => pushParams({ minPrice, maxPrice });

    // Clear handlers (called from the X on the chip)
    function clearCity(e: React.MouseEvent) {
        e.stopPropagation();
        pushParams({ city: "" });
    }
    function clearDates(e: React.MouseEvent) {
        e.stopPropagation();
        pushParams({ checkIn: "", checkOut: "" });
    }
    function clearGuests(e: React.MouseEvent) {
        e.stopPropagation();
        pushParams({ guests: "" });
    }
    function clearPrice(e: React.MouseEvent) {
        e.stopPropagation();
        pushParams({ minPrice: "", maxPrice: "" });
    }

    const cityLabel    = currentCity || "المدينة";
    const datesLabel   = formatDateLabel(currentCheckIn, currentCheckOut);
    const guestsLabel  = currentGuests ? `${currentGuests}+ ضيوف` : "الضيوف";
    const priceLabel   = formatPriceLabel(currentMinPrice, currentMaxPrice);

    const hasDateFilter   = !!(currentCheckIn || currentCheckOut);
    const hasPriceFilter  = !!(currentMinPrice || currentMaxPrice);
    const hasAnyFilter    = !!(currentCity || hasDateFilter || currentGuests || hasPriceFilter);

    function clearAllFilters() {
        pushParams({ city: "", checkIn: "", checkOut: "", guests: "", minPrice: "", maxPrice: "" });
    }

    return (
        <div ref={containerRef} className="bg-white border-b border-gray-200 z-30 relative">
            {/* ── Chips row ─────────────────────────────────────────────── */}
            <div className="overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-2 px-4 md:px-6 py-3 min-w-max" dir="rtl">

                    <FilterChip
                        label={cityLabel}
                        isActive={!!currentCity}
                        isOpen={openFilter === "city"}
                        onClick={() => openFilterPanel("city")}
                        onClear={currentCity ? clearCity : undefined}
                    />

                    <FilterChip
                        label={datesLabel}
                        isActive={hasDateFilter}
                        isOpen={openFilter === "dates"}
                        onClick={() => openFilterPanel("dates")}
                        onClear={hasDateFilter ? clearDates : undefined}
                    />

                    <FilterChip
                        label={guestsLabel}
                        isActive={!!currentGuests}
                        isOpen={openFilter === "guests"}
                        onClick={() => openFilterPanel("guests")}
                        onClear={currentGuests ? clearGuests : undefined}
                    />

                    <FilterChip
                        label={priceLabel}
                        isActive={hasPriceFilter}
                        isOpen={openFilter === "price"}
                        onClick={() => openFilterPanel("price")}
                        onClear={hasPriceFilter ? clearPrice : undefined}
                    />

                    {/* Clear All — only shown when at least one filter is active */}
                    {hasAnyFilter && (
                        <button
                            onClick={clearAllFilters}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0 whitespace-nowrap border border-transparent"
                        >
                            <X className="h-3.5 w-3.5" />
                            مسح الكل
                        </button>
                    )}
                </div>
            </div>

            {/* ── Desktop dropdown panel (overlays content, doesn't push layout) ─ */}
            {openFilter && (
                <div className="hidden lg:block absolute inset-x-0 top-full bg-white border-b border-gray-200 shadow-xl z-50" dir="rtl">
                    <div className="max-w-sm px-6 py-5">
                        {openFilter === "city" && (
                            <>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">اختر المدينة</h4>
                                <CityFilter value={city} onChange={setCity} />
                                <button onClick={applyCity} className="mt-4 w-full py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm">
                                    تطبيق
                                </button>
                            </>
                        )}
                        {openFilter === "dates" && (
                            <>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">اختر التواريخ</h4>
                                <DateFilter
                                    checkIn={checkIn}
                                    checkOut={checkOut}
                                    onChangeRange={(ci, co) => { setCheckIn(ci); setCheckOut(co); }}
                                />
                                <button onClick={applyDates} className="mt-2 w-full py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm">
                                    تطبيق
                                </button>
                            </>
                        )}
                        {openFilter === "guests" && (
                            <>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">عدد الضيوف</h4>
                                <GuestsFilter value={guests} onChange={setGuests} />
                                <button onClick={applyGuests} className="mt-4 w-full py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm">
                                    تطبيق
                                </button>
                            </>
                        )}
                        {openFilter === "price" && (
                            <>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">نطاق السعر</h4>
                                <PriceFilter
                                    minPrice={minPrice}
                                    maxPrice={maxPrice}
                                    onMinChange={setMinPrice}
                                    onMaxChange={setMaxPrice}
                                />
                                <button onClick={applyPrice} className="mt-4 w-full py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm">
                                    تطبيق
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── Mobile bottom sheets ──────────────────────────────────── */}
            {openFilter === "city" && (
                <FilterBottomSheet title="اختر المدينة" onClose={() => setOpenFilter(null)} onApply={applyCity}>
                    <CityFilter value={city} onChange={setCity} />
                </FilterBottomSheet>
            )}
            {openFilter === "dates" && (
                <FilterBottomSheet title="التواريخ" onClose={() => setOpenFilter(null)} onApply={applyDates}>
                    <DateFilter
                        checkIn={checkIn}
                        checkOut={checkOut}
                        onChangeRange={(ci, co) => { setCheckIn(ci); setCheckOut(co); }}
                    />
                </FilterBottomSheet>
            )}
            {openFilter === "guests" && (
                <FilterBottomSheet title="الضيوف" onClose={() => setOpenFilter(null)} onApply={applyGuests}>
                    <GuestsFilter value={guests} onChange={setGuests} />
                </FilterBottomSheet>
            )}
            {openFilter === "price" && (
                <FilterBottomSheet title="نطاق السعر" onClose={() => setOpenFilter(null)} onApply={applyPrice}>
                    <PriceFilter
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        onMinChange={setMinPrice}
                        onMaxChange={setMaxPrice}
                    />
                </FilterBottomSheet>
            )}
        </div>
    );
}
