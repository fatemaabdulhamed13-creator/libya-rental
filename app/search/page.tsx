import { supabase } from "@/lib/supabase";
import SearchClient from "@/components/search/search-client";
import { getFavoritedPropertyIds } from "@/app/actions/favorites";

// English-to-Arabic city name mapping for URL compatibility
const CITY_MAP: Record<string, string> = {
    tripoli:    "طرابلس",
    benghazi:   "بنغازي",
    misrata:    "مصراتة",
    "al-khoms": "الخمس",
    alkhoms:    "الخمس",
    khoms:      "الخمس",
    zawiya:     "الزاوية",
    zliten:     "زليتن",
    gharyan:    "غريان",
    bayda:      "البيضاء",
    tobruk:     "طبرق",
    sabha:      "سبها",
};

function resolveCity(city: string): string {
    const trimmed = city.trim();
    if (/[\u0600-\u06FF]/.test(trimmed)) return trimmed;
    return CITY_MAP[trimmed.toLowerCase()] || trimmed;
}

interface SearchPageProps {
    searchParams: Promise<{
        city?:     string;
        category?: string;
        guests?:   string;
        checkIn?:  string;
        checkOut?: string;
        minPrice?: string;
        maxPrice?: string;
    }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams;

    // ── Base query ─────────────────────────────────────────────────────────
    let query = (supabase as any)
        .from("properties")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

    if (params.city) {
        query = query.ilike("city", `%${resolveCity(params.city)}%`);
    }
    if (params.category) {
        query = query.eq("category", params.category);
    }
    if (params.guests) {
        const g = parseInt(params.guests);
        if (!isNaN(g)) query = query.gte("max_guests", g);
    }
    if (params.minPrice) {
        const min = parseInt(params.minPrice);
        if (!isNaN(min)) query = query.gte("price_per_night", min);
    }
    if (params.maxPrice) {
        const max = parseInt(params.maxPrice);
        if (!isNaN(max)) query = query.lte("price_per_night", max);
    }

    const { data: properties, error } = await query;

    if (error) {
        console.error("Search query error:", error);
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-red-600">حدث خطأ أثناء تحميل العقارات</p>
            </div>
        );
    }

    let results = properties || [];

    // ── Availability filtering ─────────────────────────────────────────────
    // If dates are provided, exclude properties that have confirmed bookings
    // or host manual blocks overlapping those dates.
    if (params.checkIn && params.checkOut && results.length > 0) {
        const checkIn  = params.checkIn;   // "yyyy-MM-dd"
        const checkOut = params.checkOut;  // "yyyy-MM-dd"

        // Fetch confirmed bookings and manual blocks in parallel
        const [{ data: bookedRows }, { data: blockedRows }] = await Promise.all([
            (supabase as any)
                .from("bookings")
                .select("property_id")
                .eq("status", "confirmed")
                .lt("start_date", checkOut)
                .gt("end_date",   checkIn),
            (supabase as any)
                .from("availability")
                .select("property_id")
                .lt("start_date", checkOut)
                .gt("end_date",   checkIn),
        ]);

        const unavailable = new Set<string>([
            ...(bookedRows  || []).map((r: any) => r.property_id),
            ...(blockedRows || []).map((r: any) => r.property_id),
        ]);

        if (unavailable.size > 0) {
            results = results.filter((p: any) => !unavailable.has(p.id));
        }
    }

    const favoritedIds = await getFavoritedPropertyIds();

    return (
        <SearchClient
            properties={results}
            favoritedIds={favoritedIds}
            searchMeta={{
                city:     params.city,
                checkIn:  params.checkIn,
                checkOut: params.checkOut,
                guests:   params.guests,
            }}
        />
    );
}
