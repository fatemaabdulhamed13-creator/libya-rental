"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUpload from "@/components/image-upload";
import {
    Loader2, Zap, Wifi, Wind, Waves,
    Utensils, Tv, Car, Flame, WashingMachine
} from "lucide-react";

// Dynamic import for LocationPicker to avoid SSR issues
const LocationPicker = dynamic(() => import("@/components/location-picker"), {
    ssr: false,
    loading: () => (
        <div className="h-[400px] rounded-xl border-2 border-gray-200 flex items-center justify-center bg-gray-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    ),
});

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

const AMENITIES = [
    { id: "generator", label: "مولد كهربائي", icon: Zap },
    { id: "wifi", label: "واي فاي", icon: Wifi },
    { id: "ac", label: "مكيف هواء", icon: Wind },
    { id: "pool", label: "مسبح", icon: Waves },
    { id: "kitchen", label: "مطبخ", icon: Utensils },
    { id: "tv", label: "تلفاز", icon: Tv },
    { id: "parking", label: "موقف سيارات", icon: Car },
    { id: "heating", label: "تدفئة", icon: Flame },
    { id: "washer", label: "غسالة", icon: WashingMachine },
];

export default function PropertyForm({ propertyId }: { propertyId?: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(!!propertyId);
    const [images, setImages] = useState<string[]>([]);
    const [amenities, setAmenities] = useState<string[]>([]);
    const [locationLat, setLocationLat] = useState(32.8872); // Default: Tripoli
    const [locationLng, setLocationLng] = useState(13.1913);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price_per_night: "",
        city: "",
        max_guests: "1",
    });

    // Fetch existing property data if editing
    useEffect(() => {
        if (propertyId) {
            fetchPropertyData();
        }
    }, [propertyId]);

    async function fetchPropertyData() {
        setFetchingData(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("properties")
                .select("*")
                .eq("id", propertyId!)
                .single();

            if (error) throw error;

            if (data) {
                // Populate form data
                setFormData({
                    title: data.title || "",
                    description: data.description || "",
                    price_per_night: data.price_per_night?.toString() || "",
                    city: data.city || "",
                    max_guests: data.max_guests?.toString() || "1",
                });

                // Populate location
                setLocationLat(data.location_lat || 32.8872);
                setLocationLng(data.location_lng || 13.1913);

                // Populate images
                setImages(data.images || []);

                // Populate amenities - FIXED: Convert labels back to IDs
                const amenityLabels = data.amenities || [];
                const amenityIds = amenityLabels.map((label: string) => {
                    const amenity = AMENITIES.find(a => a.label === label);
                    return amenity ? amenity.id : label;
                });
                setAmenities(amenityIds);
            }
        } catch (error: any) {
            alert("حدث خطأ أثناء تحميل البيانات: " + error.message);
        } finally {
            setFetchingData(false);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleAmenityToggle = (amenityId: string) => {
        setAmenities((prev) =>
            prev.includes(amenityId)
                ? prev.filter((id) => id !== amenityId)
                : [...prev, amenityId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Map amenity IDs to labels for storage (to match Create Listing flow)
            const amenityLabels = amenities.map(id => {
                const amenity = AMENITIES.find(a => a.id === id);
                return amenity ? amenity.label : id;
            });

            const propertyData = {
                title: formData.title,
                description: formData.description,
                price_per_night: parseInt(formData.price_per_night),
                city: formData.city,
                max_guests: parseInt(formData.max_guests),
                images: images,
                amenities: amenityLabels,
                location_lat: locationLat,
                location_lng: locationLng,
            };

            if (propertyId) {
                // UPDATE via server API route (avoids browser-client auth issues & RLS)
                const res = await fetch('/api/properties/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ propertyId, propertyData }),
                });

                const json = await res.json();
                if (!res.ok) throw new Error(json.error || 'فشل تحديث العقار');

                alert("تم تحديث العقار بنجاح!");
                router.push("/host/properties");
                router.refresh();
            } else {
                // INSERT new property — use SSR-aware browser client (reads cookie session)
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("يجب تسجيل الدخول أولاً");

                const { data, error } = await supabase.from("properties").insert({
                    host_id: user.id,
                    ...propertyData,
                    status: 'pending', // CRITICAL: New properties need admin approval
                }).select();

                if (error) throw error;

                // Get the newly created property ID
                const newPropertyId = data?.[0]?.id;

                if (newPropertyId) {
                    alert("تم إنشاء العقار بنجاح! الآن حدد التواريخ المتاحة.");
                    router.push(`/host/properties/${newPropertyId}/calendar`);
                } else {
                    router.push("/host/properties");
                }

                router.refresh();
            }
        } catch (error: any) {
            alert("حدث خطأ: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Show loading state while fetching data
    if (fetchingData) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                        <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-right">{propertyId ? "تعديل العقار" : "تفاصيل العقار"}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Images */}
                    <div className="space-y-2">
                        <Label>صور العقار *</Label>
                        <ImageUpload
                            value={images}
                            onChange={(urls) => setImages(urls)}
                            bucket="property-images"
                        />
                    </div>

                    {/* City Dropdown */}
                    <div className="space-y-2">
                        <Label>المدينة *</Label>
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

                    {/* Location Map Picker */}
                    <div className="space-y-2">
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
                    <div className="space-y-2">
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
                    <div className="space-y-2">
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

                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Price */}
                        <div className="space-y-2">
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

                        {/* Max Guests */}
                        <div className="space-y-2">
                            <Label htmlFor="max_guests">عدد الضيوف الأقصى *</Label>
                            <Input
                                id="max_guests"
                                type="number"
                                min="1"
                                placeholder="1"
                                value={formData.max_guests}
                                onChange={handleChange}
                                required
                                className="h-12 rounded-xl text-right"
                            />
                        </div>
                    </div>

                    {/* Amenities - Vector Buttons */}
                    <div className="space-y-3">
                        <Label>المرافق والخدمات</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {AMENITIES.map((amenity) => {
                                const Icon = amenity.icon;
                                const isSelected = amenities.includes(amenity.id);
                                return (
                                    <button
                                        key={amenity.id}
                                        type="button"
                                        onClick={() => handleAmenityToggle(amenity.id)}
                                        className={`
                                            flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                                            min-h-[88px] hover:scale-105
                                            ${isSelected
                                                ? 'bg-primary/10 border-primary text-primary'
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-primary/50'
                                            }
                                        `}
                                    >
                                        <Icon className="h-6 w-6" />
                                        <span className="text-sm font-medium text-center">{amenity.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-lg">
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : propertyId ? (
                            "حفظ التعديلات"
                        ) : (
                            "نشر العقار"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
