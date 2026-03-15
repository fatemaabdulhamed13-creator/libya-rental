import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar";
import Link from "next/link";
import Image from "next/image";
import {
    BadgeCheck,
    Star,
    MapPin,
    Calendar,
    Home,
    AlertCircle,
    User,
} from "lucide-react";

export const revalidate = 0;

// TypeScript interfaces for type safety
interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_identity_verified: boolean;
    is_host: boolean;
    created_at: string;
    phone_number?: string | null;
    verification_status?: string | null;
}

interface Property {
    id: string;
    title: string;
    city: string;
    price_per_night: number;
    images: string[] | null;
}

async function getProfile(id: string): Promise<Profile | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("public_profiles_view")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error("Error fetching profile:", error.message, "| ID:", id);
        return null;
    }
    return data as Profile;
}

async function getHostProperties(hostId: string): Promise<Property[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("properties")
        .select("id, title, city, price_per_night, images")
        .eq("host_id", hostId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching host properties:", error.message);
        return [];
    }
    return (data as Property[]) || [];
}

export default async function HostProfilePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [profile, properties] = await Promise.all([
        getProfile(id),
        getHostProperties(id),
    ]);

    if (!profile) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div
                    className="container mx-auto px-4 py-20 text-center"
                    dir="rtl"
                >
                    <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        لم يتم العثور على الملف الشخصي
                    </h1>
                    <p className="text-gray-500 mb-6">
                        هذا المستخدم غير موجود أو ربما تم حذف حسابه.
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                        العودة للرئيسية
                    </Link>
                </div>
            </div>
        );
    }

    const joinedYear = new Date(profile.created_at).getFullYear();

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main dir="rtl">
                {/* ── Teal Header Banner ── */}
                <div className="bg-primary">
                    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
                        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                            {/* Large Avatar */}
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.full_name || "المضيف"}
                                    className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover ring-4 ring-white/30 shadow-lg"
                                />
                            ) : (
                                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-white/10 flex items-center justify-center ring-4 ring-white/30">
                                    <User className="h-14 w-14 text-white/70" />
                                </div>
                            )}

                            {/* Name & Badges */}
                            <div className="text-center md:text-right">
                                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                                    {profile.full_name || "مضيف"}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    {profile.is_identity_verified && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 text-white text-sm font-medium rounded-full backdrop-blur-sm">
                                            <BadgeCheck className="h-4 w-4" />
                                            هوية موثّقة
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 text-white text-sm font-medium rounded-full backdrop-blur-sm">
                                        <Calendar className="h-4 w-4" />
                                        انضم في {joinedYear}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Stats Bar ── */}
                <div className="bg-white border-b border-gray-200">
                    <div className="container mx-auto px-4 md:px-6 lg:px-8">
                        <div className="flex items-center justify-center md:justify-start gap-10 py-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    {properties.length}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    عقار
                                </div>
                            </div>
                            <div className="w-px h-10 bg-gray-200" />
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <Star className="h-5 w-5 fill-current text-secondary" />
                                    <span className="text-2xl font-bold text-primary">
                                        4.9
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    تقييم
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Listings Grid ── */}
                <div className="container mx-auto px-4 md:px-6 lg:px-8 py-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">
                        عقارات {profile.full_name || "المضيف"}
                    </h2>

                    {properties.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {properties.map((property: any) => (
                                <Link
                                    key={property.id}
                                    href={`/properties/${property.id}`}
                                    className="group block rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-200"
                                >
                                    {/* Image */}
                                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
                                        {property.images?.[0] ? (
                                            <Image
                                                src={property.images[0]}
                                                alt={property.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                <Home className="h-12 w-12 text-gray-300" />
                                            </div>
                                        )}
                                        {/* Price pill */}
                                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-primary shadow">
                                            {property.price_per_night} د.ل
                                            <span className="text-gray-500 font-normal">
                                                {" "}
                                                / ليلة
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                                            {property.title}
                                        </h3>
                                        <div className="flex items-center gap-1 mt-1.5 text-sm text-gray-500">
                                            <MapPin className="h-3.5 w-3.5" />
                                            <span>{property.city}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                            <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">
                                لا توجد عقارات مسجّلة حالياً
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
