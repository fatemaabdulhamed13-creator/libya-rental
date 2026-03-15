"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Checkbox from "@/components/ui/checkbox";
import ImageUpload from "@/components/image-upload";
import {
    Loader2, Plus, Minus, Zap, Wifi, Wind, Waves,
    Utensils, Tv, Car, Flame, WashingMachine, Home as HomeIcon
} from "lucide-react";

// Dynamic import for LocationPicker to prevent SSR issues with MapLibre
const LocationPicker = dynamic(() => import("@/components/location-picker"), {
    ssr: false,
    loading: () => (
        <div className="h-[400px] rounded-xl border-2 border-gray-200 flex items-center justify-center bg-gray-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    ),
});

// Property categories for Libyan market
const CATEGORIES = [
    { value: "istiraha", label: "استراحة (Istiraha)" },
    { value: "apartment", label: "شقة (Apartment)" },
    { value: "villa", label: "فيلا (Villa)" },
    { value: "chalet", label: "شاليه (Chalet)" },
    { value: "studio", label: "استوديو (Studio)" },
];

// Major Libyan cities
const CITIES = [
    "طرابلس (Tripoli)",
    "بنغازي (Benghazi)",
    "مصراتة (Misrata)",
    "الزاوية (Zawiya)",
    "الخمس (Khoms)",
    "زليتن (Zliten)",
    "غريان (Gharyan)",
    "البيضاء (Bayda)",
    "طبرق (Tobruk)",
    "سبها (Sabha)",
];

// Amenities with icons and priority levels
const AMENITIES = [
    { id: "generator", label: "مولد كهربائي", icon: Zap, priority: 1 },
    { id: "wifi", label: "واي فاي", icon: Wifi, priority: 1 },
    { id: "ac", label: "مكيف هواء", icon: Wind, priority: 1 },
    { id: "pool", label: "مسبح", icon: Waves, priority: 1 },
    { id: "kitchen", label: "مطبخ", icon: Utensils, priority: 2 },
    { id: "tv", label: "تلفاز", icon: Tv, priority: 2 },
    { id: "parking", label: "موقف سيارات", icon: Car, priority: 2 },
    { id: "heating", label: "تدفئة", icon: Flame, priority: 2 },
    { id: "washer", label: "غسالة", icon: WashingMachine, priority: 2 },
];

export default function CreateListingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Image URLs from Supabase Storage
    const [images, setImages] = useState<string[]>([]);

    // Selected amenity IDs (e.g., ["wifi", "ac"])
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

    // Map coordinates (default: Tripoli)
    const [locationLat, setLocationLat] = useState(32.8872);
    const [locationLng, setLocationLng] = useState(13.1913);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        city: "",
        price_per_night: "",
        max_guests: 1,
        bedrooms: 1,
        bathrooms: 1,
        family_friendly: false,
    });

    // Split amenities by priority for grid layout
    const priorityOneAmenities = AMENITIES.filter(a => a.priority === 1);
    const priorityTwoAmenities = AMENITIES.filter(a => a.priority === 2);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleCounter = (field: "max_guests" | "bedrooms" | "bathrooms", delta: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: Math.max(1, prev[field] + delta)
        }));
    };

    const toggleAmenity = (amenityId: string) => {
        setSelectedAmenities(prev =>
            prev.includes(amenityId)
                ? prev.filter(id => id !== amenityId)
                : [...prev, amenityId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("يجب تسجيل الدخول أولاً");

            // Convert amenity IDs to labels for database storage
            // We store labels (e.g., "واي فاي") instead of IDs for readability
            const amenityLabels = selectedAmenities.map(id =>
                AMENITIES.find(a => a.id === id)?.label || id
            );

            // CRITICAL: Images are uploaded synchronously by ImageUpload component
            // The 'images' state already contains the full Supabase Storage URLs
            // No need to await here - they're already uploaded
            const { data, error } = await supabase.from("properties").insert({
                host_id: user.id,
                title: formData.title,
                description: formData.description,
                category: formData.category,
                city: formData.city,
                price_per_night: parseInt(formData.price_per_night),
                max_guests: formData.max_guests,
                bedrooms: formData.bedrooms,
                bathrooms: formData.bathrooms,
                family_friendly: formData.family_friendly,
                images: images, // Already uploaded URLs
                amenities: amenityLabels,
                location_lat: locationLat,
                location_lng: locationLng,
                status: 'pending', // CRITICAL: New properties need admin approval
            }).select();

            if (error) throw error;

            const newPropertyId = data?.[0]?.id;

            if (newPropertyId) {
                alert("تم إنشاء العقار بنجاح! الآن حدد التواريخ المتاحة.");
                router.push(`/host/properties/${newPropertyId}/calendar`);
            } else {
                router.push("/host/properties");
            }

            router.refresh();
        } catch (error: any) {
            alert("حدث خطأ: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-8" dir="rtl">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                        <HomeIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-teal-900">إنشاء عقار جديد</h1>
                        <p className="text-gray-600 mt-1">أضف عقارك واستقبل الحجوزات</p>
                    </div>
                </div>

                <Card className="border-0 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-teal-50 to-[#F5F0E8] pb-6">
                        <CardTitle className="text-2xl text-teal-900">تفاصيل العقار</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Images Upload */}
                            <div className="space-y-3">
                                <Label className="text-lg font-semibold">صور العقار *</Label>
                                <p className="text-sm text-gray-500">أضف صورًا واضحة وجذابة للعقار</p>
                                <ImageUpload
                                    value={images}
                                    onChange={(urls) => setImages(urls)}
                                    bucket="property-images"
                                />
                            </div>

                            {/* Category & City */}
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-3">
                                    <Label htmlFor="category">نوع العقار *</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                                        required
                                    >
                                        <SelectTrigger className="h-12 rounded-xl text-right">
                                            <SelectValue placeholder="اختر النوع" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="city">المدينة *</Label>
                                    <Select
                                        value={formData.city}
                                        onValueChange={(value) => setFormData({ ...formData, city: value })}
                                        required
                                    >
                                        <SelectTrigger className="h-12 rounded-xl text-right">
                                            <SelectValue placeholder="اختر المدينة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CITIES.map((city) => (
                                                <SelectItem key={city} value={city}>
                                                    {city}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Location Map Picker */}
                            <div className="space-y-3">
                                <LocationPicker
                                    selectedCity={formData.city}
                                    onLocationChange={(lat, lng) => {
                                        setLocationLat(lat);
                                        setLocationLng(lng);
                                    }}
                                    initialLat={locationLat}
                                    initialLng={locationLng}
                                />
                            </div>

                            {/* Title */}
                            <div className="space-y-3">
                                <Label htmlFor="title">عنوان العقار *</Label>
                                <Input
                                    id="title"
                                    placeholder="شقة فاخرة في وسط طرابلس..."
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="h-12 rounded-xl text-right"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-3">
                                <Label htmlFor="description">الوصف *</Label>
                                <Textarea
                                    id="description"
                                    placeholder="صف العقار والخدمات المتاحة..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    className="rounded-xl text-right h-32 resize-none"
                                />
                            </div>

                            {/* Price */}
                            <div className="space-y-3">
                                <Label htmlFor="price_per_night">السعر لليلة (د.ل) *</Label>
                                <Input
                                    id="price_per_night"
                                    type="number"
                                    min="1"
                                    placeholder="0"
                                    value={formData.price_per_night}
                                    onChange={handleChange}
                                    required
                                    className="h-12 rounded-xl text-right"
                                />
                            </div>

                            {/* Counters: Responsive Layout - Compact List (Mobile) / Big Cards (Desktop) */}
                            <div className="space-y-3">
                                <Label className="text-lg font-semibold">التفاصيل</Label>

                                {/* Container: Single Box (Mobile) / 3-Column Grid (Desktop) */}
                                <div className="rounded-xl border border-gray-300 bg-white divide-y divide-gray-200 md:grid md:grid-cols-3 md:gap-4 md:border-0 md:divide-y-0">
                                    {/* Max Guests Counter */}
                                    <div className="flex items-center justify-between p-3 md:border md:border-gray-200 md:rounded-2xl md:p-6 md:flex-col md:items-center md:justify-center md:bg-gray-50 md:min-h-[140px] hover:md:border-primary transition-colors">
                                        <div className="text-right md:text-center md:mb-4">
                                            <p className="font-medium text-gray-900 md:text-lg md:font-semibold">عدد الضيوف</p>
                                            <p className="hidden md:block text-sm text-gray-500 mt-1">الحد الأقصى للإقامة</p>
                                        </div>
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-full md:h-10 md:w-10"
                                                onClick={() => handleCounter("max_guests", -1)}
                                            >
                                                <Minus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                            </Button>
                                            <span className="text-base font-semibold w-6 text-center md:text-xl md:w-8">{formData.max_guests}</span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-full md:h-10 md:w-10"
                                                onClick={() => handleCounter("max_guests", 1)}
                                            >
                                                <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Bedrooms Counter */}
                                    <div className="flex items-center justify-between p-3 md:border md:border-gray-200 md:rounded-2xl md:p-6 md:flex-col md:items-center md:justify-center md:bg-gray-50 md:min-h-[140px] hover:md:border-primary transition-colors">
                                        <div className="text-right md:text-center md:mb-4">
                                            <p className="font-medium text-gray-900 md:text-lg md:font-semibold">غرف النوم</p>
                                            <p className="hidden md:block text-sm text-gray-500 mt-1">العدد</p>
                                        </div>
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-full md:h-10 md:w-10"
                                                onClick={() => handleCounter("bedrooms", -1)}
                                            >
                                                <Minus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                            </Button>
                                            <span className="text-base font-semibold w-6 text-center md:text-xl md:w-8">{formData.bedrooms}</span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-full md:h-10 md:w-10"
                                                onClick={() => handleCounter("bedrooms", 1)}
                                            >
                                                <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Bathrooms Counter */}
                                    <div className="flex items-center justify-between p-3 md:border md:border-gray-200 md:rounded-2xl md:p-6 md:flex-col md:items-center md:justify-center md:bg-gray-50 md:min-h-[140px] hover:md:border-primary transition-colors">
                                        <div className="text-right md:text-center md:mb-4">
                                            <p className="font-medium text-gray-900 md:text-lg md:font-semibold">دورات المياه</p>
                                            <p className="hidden md:block text-sm text-gray-500 mt-1">العدد</p>
                                        </div>
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-full md:h-10 md:w-10"
                                                onClick={() => handleCounter("bathrooms", -1)}
                                            >
                                                <Minus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                            </Button>
                                            <span className="text-base font-semibold w-6 text-center md:text-xl md:w-8">{formData.bathrooms}</span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-full md:h-10 md:w-10"
                                                onClick={() => handleCounter("bathrooms", 1)}
                                            >
                                                <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Amenities - Compact Mobile Grid */}
                            <div className="space-y-3">
                                <Label className="text-lg font-semibold">المرافق والخدمات</Label>

                                {/* Priority 1 Amenities - 3 cols mobile, 4 cols desktop */}
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                    {priorityOneAmenities.map((amenity) => {
                                        const Icon = amenity.icon;
                                        const isSelected = selectedAmenities.includes(amenity.id);
                                        return (
                                            <button
                                                key={amenity.id}
                                                type="button"
                                                onClick={() => toggleAmenity(amenity.id)}
                                                className={`
                                                    flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all
                                                    ${isSelected
                                                        ? 'bg-primary/10 border-primary text-primary'
                                                        : 'bg-white border-gray-200 text-gray-700 hover:border-primary/50'
                                                    }
                                                `}
                                            >
                                                <Icon className="h-5 w-5" />
                                                <span className="text-xs font-medium text-center leading-tight">{amenity.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Priority 2 Amenities - 3 cols mobile, 5 cols desktop */}
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                    {priorityTwoAmenities.map((amenity) => {
                                        const Icon = amenity.icon;
                                        const isSelected = selectedAmenities.includes(amenity.id);
                                        return (
                                            <button
                                                key={amenity.id}
                                                type="button"
                                                onClick={() => toggleAmenity(amenity.id)}
                                                className={`
                                                    flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all
                                                    ${isSelected
                                                        ? 'bg-primary/10 border-primary text-primary'
                                                        : 'bg-white border-gray-200 text-gray-700 hover:border-primary/50'
                                                    }
                                                `}
                                            >
                                                <Icon className="h-5 w-5" />
                                                <span className="text-xs font-medium text-center leading-tight">{amenity.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Family Friendly Checkbox */}
                            <Checkbox
                                id="family_friendly"
                                checked={formData.family_friendly}
                                onChange={(checked) => setFormData({ ...formData, family_friendly: checked })}
                                label="مناسب للعائلات"
                                description="هل هذا العقار مناسب للعائلات والأطفال؟"
                            />

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 text-lg rounded-xl bg-accent hover:bg-[#EA580C]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin ml-2" />
                                        جاري النشر...
                                    </>
                                ) : (
                                    "نشر العقار"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
