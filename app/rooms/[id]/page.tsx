"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import BookingForm from "@/components/booking/booking-form";
import { Button } from "@/components/ui/button";
import {
    MapPin, Star, Users, Wifi, Wind, Tv, Car,
    Utensils, Waves, Home as HomeIcon, ArrowLeft, Shield
} from "lucide-react";
import VerificationBadge from "@/components/verification-badge";

const AMENITY_ICONS: Record<string, any> = {
    "واي فاي": Wifi,
    "مكيف هواء": Wind,
    "تلفاز": Tv,
    "موقف سيارات": Car,
    "مطبخ": Utensils,
    "مسبح": Waves,
};

export default function RoomDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const propertyId = params.id as string;

    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProperty();
    }, [propertyId]);

    async function fetchProperty() {
        setLoading(true);
        try {
            // Fetch property
            const { data: propertyData, error: propertyError } = await supabase
                .from("properties")
                .select("*")
                .eq("id", propertyId)
                .single();

            if (propertyError) throw propertyError;

            // Fetch host profile
            if (propertyData?.host_id) {
                const { data: hostData } = await supabase
                    .from("profiles")
                    .select("id, full_name, avatar_url, is_identity_verified, verification_status, phone_number")
                    .eq("id", propertyData.host_id)
                    .single();

                (propertyData as any).host = hostData;
            }

            setProperty(propertyData);
        } catch (err) {
            console.error("Error fetching property:", err);
            setProperty(null);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <HomeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">العقار غير موجود</h2>
                    <Link href="/">
                        <Button variant="outline">العودة للرئيسية</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const mainImage = property.images?.[0];
    const sideImages = property.images?.slice(1, 5) || [];

    return (
        <div className="min-h-screen bg-background" dir="rtl">
            {/* Back Button */}
            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    العودة
                </Button>
            </div>

            {/* Image Grid Hero */}
            <div className="container mx-auto px-4 md:px-6 lg:px-8 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden h-[400px] md:h-[500px]">
                    {/* Main Large Image */}
                    <div className="md:col-span-2 md:row-span-2 relative">
                        {mainImage ? (
                            <img
                                src={mainImage}
                                alt={property.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-teal-50 to-[#F5F0E8] flex items-center justify-center">
                                <HomeIcon className="h-24 w-24 text-gray-400" />
                            </div>
                        )}
                    </div>

                    {/* Side Images */}
                    {[0, 1, 2, 3].map((index) => (
                        <div key={index} className="hidden md:block relative">
                            {sideImages[index] ? (
                                <img
                                    src={sideImages[index]}
                                    alt={`${property.title} - ${index + 2}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                    <HomeIcon className="h-12 w-12 text-gray-300" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Grid */}
            <div className="container mx-auto px-4 md:px-6 lg:px-8 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Header */}
                        <div className="border-b border-gray-200 pb-6">
                            <h1 className="text-3xl md:text-4xl font-bold text-teal-900 mb-4">
                                {property.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                <div className="flex items-center gap-1">
                                    <Star className="h-5 w-5 fill-current text-gray-900" />
                                    <span className="font-semibold text-gray-900">4.9</span>
                                    <span className="text-sm">· 23 تقييم</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-5 w-5" />
                                    <span>{property.city}, ليبيا</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="h-5 w-5" />
                                    <span>{property.max_guests} ضيوف</span>
                                </div>
                            </div>
                        </div>

                        {/* Host Info */}
                        <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-teal-50 to-[#F5F0E8] rounded-2xl border-2 border-primary/20">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                                {property.host?.full_name?.[0] || "H"}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        مضيف: {property.host?.full_name || "مضيف"}
                                    </h3>
                                    <VerificationBadge isIdentityVerified={property.host?.is_identity_verified} />
                                </div>
                                <p className="text-sm text-gray-600">انضم في 2024</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="border-b border-gray-200 pb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">عن هذا المكان</h2>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {property.description}
                            </p>
                        </div>

                        {/* Amenities */}
                        <div className="border-b border-gray-200 pb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">ما يقدمه هذا المكان</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {property.amenities?.map((amenity: string) => {
                                    const Icon = AMENITY_ICONS[amenity] || HomeIcon;
                                    return (
                                        <div key={amenity} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                            <Icon className="h-6 w-6 text-primary" />
                                            <span className="text-gray-900">{amenity}</span>
                                        </div>
                                    );
                                })}
                                {(!property.amenities || property.amenities.length === 0) && (
                                    <p className="text-gray-500 col-span-2">لا توجد مرافق محددة</p>
                                )}
                            </div>
                        </div>

                        {/* Location Map Placeholder */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">الموقع</h2>
                            <div className="bg-gradient-to-br from-teal-50 to-[#F5F0E8] rounded-2xl h-[400px] flex items-center justify-center border-2 border-primary/20">
                                <div className="text-center">
                                    <MapPin className="h-16 w-16 text-primary mx-auto mb-4" />
                                    <p className="text-gray-600 font-semibold">{property.city}, ليبيا</p>
                                    <p className="text-sm text-gray-500 mt-2">سيتم عرض الموقع الدقيق بعد الحجز</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Booking Widget */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <BookingForm key={property.id} property={property} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
