"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import FilterChips from "./FilterChips";
import MapButton from "./MapButton";
import PropertyCard from "./property-card";
import CategoryBar from "@/components/category-bar";
import Navbar from "@/components/navbar";

// Dynamic import for SearchMap to avoid SSR issues
const SearchMap = dynamic(() => import("./search-map"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    ),
});

interface Property {
    id: string;
    title: string;
    city: string;
    price_per_night: number;
    images: string[];
    location_lat: number;
    location_lng: number;
}

interface SearchClientProps {
    properties: Property[];
    favoritedIds: Set<string>;
}

export default function SearchClient({ properties, favoritedIds }: SearchClientProps) {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <SearchClientInner properties={properties} favoritedIds={favoritedIds} />
        </Suspense>
    );
}

function SearchClientInner({ properties, favoritedIds }: SearchClientProps) {
    const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
    const [showMap, setShowMap] = useState(false);
    const searchParams = useSearchParams();
    const qs = searchParams.toString();

    return (
        <div className="h-screen flex flex-col bg-background" dir="rtl">

            {/* Navbar */}
            <Navbar />

            {/* Category icons bar */}
            <CategoryBar />

            {/* Filter chips */}
            <FilterChips />

            {/* ── Desktop: Side-by-side split ───────────────────────────── */}
            <div className="hidden lg:flex flex-1 min-h-0">

                {/* Left: scrollable property list (60%) */}
                <div className="w-[60%] overflow-y-auto">
                    <div className="px-6 py-6">
                        {properties.length === 0 ? (
                            <div className="text-center py-20 space-y-3">
                                <div className="text-5xl">🏠</div>
                                <h3 className="text-xl font-semibold text-gray-800">لا توجد نتائج</h3>
                                <p className="text-sm text-gray-500">جرّب تغيير الفلاتر أو البحث في مدينة أخرى</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-gray-500 mb-4">{properties.length} عقار</p>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {properties.map((property) => (
                                        <PropertyCard
                                            key={property.id}
                                            property={property}
                                            isHovered={hoveredPropertyId === property.id}
                                            onHover={setHoveredPropertyId}
                                            initialFavorited={favoritedIds.has(property.id)}
                                            searchString={qs}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right: sticky map (40%) */}
                <div className="w-[40%]">
                    <SearchMap
                        properties={properties}
                        hoveredPropertyId={hoveredPropertyId}
                        onPropertyClick={() => { }}
                    />
                </div>
            </div>

            {/* ── Mobile: list OR map, toggled by floating button ────────── */}
            <div className="lg:hidden flex-1 min-h-0 relative">
                {!showMap ? (
                    <div className="h-full overflow-y-auto">
                        <div className="container mx-auto px-4 py-6 pb-24">
                            {properties.length === 0 ? (
                                <div className="text-center py-20 space-y-3">
                                    <div className="text-5xl">🏠</div>
                                    <h3 className="text-xl font-semibold text-gray-800">لا توجد نتائج</h3>
                                    <p className="text-sm text-gray-500">جرّب تغيير الفلاتر أو البحث في مدينة أخرى</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-500 mb-4">{properties.length} عقار</p>
                                    <div className="grid grid-cols-1 gap-6">
                                        {properties.map((property) => (
                                            <PropertyCard
                                                key={property.id}
                                                property={property}
                                                initialFavorited={favoritedIds.has(property.id)}
                                                searchString={qs}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-full">
                        <SearchMap
                            properties={properties}
                            hoveredPropertyId={hoveredPropertyId}
                            onPropertyClick={() => { }}
                        />
                    </div>
                )}

                <MapButton showMap={showMap} onToggle={() => setShowMap(!showMap)} />
            </div>
        </div>
    );
}
