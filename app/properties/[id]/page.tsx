import { supabase } from "@/lib/supabase";
import {
    MapPin,
    Star,
    Wifi,
    Car,
    Waves,
    Wind,
    Tv,
    UtensilsCrossed,
    Refrigerator,
    WashingMachine,
    Dumbbell,
    Shield,
    Sparkles,
    Users,
    Home,
    Building,
    Tent,
    Palmtree,
    AlertCircle,
    BadgeCheck,
    User,
    BedDouble,
    Bath
} from "lucide-react";
import Navbar from "@/components/navbar";
import PropertyMap from "@/components/map";
import PropertyGallery from "@/components/property/PropertyGallery";
import PropertyActions from "@/components/property/PropertyActions";
import BookingWidget from "@/components/property/BookingWidget";
import MobileBookingBar from "@/components/property/MobileBookingBar";
import { isFavorited } from "@/app/actions/favorites";
import Link from "next/link";

// Map category to icon + Arabic label
const categoryConfig: { [key: string]: { icon: any; label: string } } = {
    villa: { icon: Home, label: "فيلا" },
    apartment: { icon: Building, label: "شقة" },
    chalet: { icon: Tent, label: "شاليه" },
    istiraha: { icon: Palmtree, label: "استراحة" },
};

export const revalidate = 300; // re-validate every 5 minutes

// Map amenity names to icons
const amenityIcons: { [key: string]: any } = {
    'واي فاي': Wifi,
    'wifi': Wifi,
    'موقف سيارات': Car,
    'parking': Car,
    'مسبح': Waves,
    'pool': Waves,
    'مكيف': Wind,
    'ac': Wind,
    'air conditioning': Wind,
    'تلفاز': Tv,
    'tv': Tv,
    'مطبخ': UtensilsCrossed,
    'kitchen': UtensilsCrossed,
    'ثلاجة': Refrigerator,
    'غسالة': WashingMachine,
    'washer': WashingMachine,
    'صالة رياضة': Dumbbell,
    'gym': Dumbbell,
    'أمان': Shield,
    'security': Shield,
    'تنظيف': Sparkles,
    'cleaning': Sparkles,
};

function getAmenityIcon(amenity: string) {
    const lowerAmenity = amenity.toLowerCase();
    for (const [key, Icon] of Object.entries(amenityIcons)) {
        if (lowerAmenity.includes(key)) {
            return Icon;
        }
    }
    return Sparkles; // Default icon
}

async function getProperty(id: string) {
    const { data, error } = await supabase
        .from("properties")
        .select(`
      *,
      host:profiles!host_id(full_name, avatar_url, is_identity_verified, verification_status)
    `)
        .eq("id", id)
        .single();

    if (error) {
        console.error("Supabase error fetching property:", error.message, "| ID:", id);
        return null;
    }
    return data;
}

export default async function PropertyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    // Next.js 15+ requires awaiting params
    const { id } = await params;
    const [property, initialFavorited] = await Promise.all([
        getProperty(id),
        isFavorited(id),
    ]);

    if (!property) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center" dir="rtl">
                    <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">لم يتم العثور على العقار</h1>
                    <p className="text-gray-500 mb-2">
                        العقار المطلوب غير موجود أو ربما تم حذفه.
                    </p>
                    <p className="text-sm text-gray-400 mb-6">
                        معرّف العقار: <code className="bg-gray-100 px-2 py-1 rounded">{id}</code>
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

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
                {/* Property Gallery - Images First */}
                <PropertyGallery images={property.images || []} title={property.title} />

                {/* Title Section - Below Gallery */}
                <div className="mb-8">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">{property.title}</h1>
                        {property.category && categoryConfig[property.category] && (() => {
                            const CategoryIcon = categoryConfig[property.category].icon;
                            return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                                    <CategoryIcon className="h-3.5 w-3.5" />
                                    {categoryConfig[property.category].label}
                                </span>
                            );
                        })()}
                        {(property.family_friendly || property.amenities?.some((a: string) => a.toLowerCase().includes("family") || a.includes("عائل"))) && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/10 text-secondary text-sm font-medium rounded-full border border-secondary/20">
                                <Users className="h-3.5 w-3.5" />
                                مناسب للعائلات
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-current text-gray-900" />
                                <span className="font-semibold">4.9</span>
                                <span className="text-gray-500">· 23 تقييم</span>
                            </div>
                            <span className="text-gray-300">·</span>
                            <div className="flex items-center gap-1 text-gray-600 underline cursor-pointer hover:text-gray-900">
                                <MapPin className="h-4 w-4" />
                                <span>{property.city}</span>
                            </div>
                        </div>
                        <PropertyActions propertyId={property.id} initialFavorited={initialFavorited} />
                    </div>

                    {/* Compact Stats Row */}
                    <div className="flex flex-wrap items-center gap-6 mt-4">
                        <div className="flex items-center gap-1.5">
                            <Users className="h-6 w-6 text-secondary" />
                            <span className="text-gray-700 font-medium">{property.max_guests || 4} ضيوف</span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-1.5">
                            <BedDouble className="h-6 w-6 text-secondary" />
                            <span className="text-gray-700 font-medium">{property.bedrooms || 2} غرفة نوم</span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-1.5">
                            <Bath className="h-6 w-6 text-secondary" />
                            <span className="text-gray-700 font-medium">{property.bathrooms || 1} حمام</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
                    {/* Details Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Description */}
                        <div className="pb-8 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">عن هذا المكان</h2>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line text-base text-right">
                                {property.description || "مكان مريح ومجهز بالكامل لإقامة مميزة. يتميز بموقع استراتيجي وتصميم عصري يجمع بين الأناقة والراحة."}
                            </p>
                        </div>

                        {/* Amenities */}
                        <div className="pb-8 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">ما يقدمه هذا المكان</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {property.amenities?.map((amenity: string) => {
                                    const IconComponent = getAmenityIcon(amenity);
                                    return (
                                        <div key={amenity} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <IconComponent className="h-5 w-5 text-primary shrink-0" />
                                            <span className="text-gray-700 text-sm">{amenity}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Meet your Host */}
                        {property.host && (
                            <div className="mb-8 pb-8 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">تعرّف على المضيف</h2>
                                <div className="flex items-center gap-5">
                                    <Link href={`/profile/${property.host_id}`} className="shrink-0">
                                        {property.host.avatar_url ? (
                                            <img
                                                src={property.host.avatar_url}
                                                alt={property.host.full_name || "المضيف"}
                                                className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                                                <User className="h-8 w-8 text-primary" />
                                            </div>
                                        )}
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {property.host.full_name || "مضيف"}
                                            </h3>
                                            {property.host.is_identity_verified && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                                    <BadgeCheck className="h-3.5 w-3.5" />
                                                    موثّق
                                                </span>
                                            )}
                                        </div>
                                        <Link
                                            href={`/profile/${property.host_id}`}
                                            className="inline-flex items-center gap-2 px-5 py-2 mt-2 border border-secondary text-secondary text-sm font-medium rounded-lg hover:bg-secondary/10 transition-colors"
                                        >
                                            عرض الملف الشخصي
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Map Section */}
                        <div className="pb-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">أين ستكون</h2>
                            <p className="text-gray-600 mb-6">{property.city}</p>
                            <div className="rounded-2xl overflow-hidden">
                                <PropertyMap lat={property.location_lat} lng={property.location_lng} />
                            </div>
                        </div>
                    </div>

                    {/* Booking Widget */}
                    <BookingWidget key={property.id} property={property} />
                </div>
                {/* Bottom spacer for mobile booking bar */}
                <div className="h-20 md:hidden" />
            </main>

            <MobileBookingBar price={property.price_per_night} />
        </div>
    );
}
