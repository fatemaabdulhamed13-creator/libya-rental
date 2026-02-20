"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchModal } from "@/hooks/use-search-modal";
import { useSearch } from "@/contexts/search-context";
import { Button } from "@/components/ui/button";
import { X, MapPin, Calendar, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import "react-day-picker/dist/style.css";

const LIBYAN_CITIES = [
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

type SearchStep = "location" | "dates" | "guests";

export default function SearchModal() {
    const router = useRouter();
    const { isOpen, closeModal, initialStep } = useSearchModal();
    const { location, setLocation, checkIn, setCheckIn, checkOut, setCheckOut, guests, setGuests } = useSearch();
    const [currentStep, setCurrentStep] = useState<SearchStep>("location");

    // Set initial step when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(initialStep);
        }
    }, [isOpen, initialStep]);

    const handleClose = () => {
        closeModal();
    };

    const handleSearch = () => {
        const params = new URLSearchParams();
        // Extract just the Arabic city name: "طرابلس (Tripoli)" → "طرابلس"
        if (location) params.set("city", location.split(" (")[0].trim());
        if (checkIn)  params.set("checkIn",  format(checkIn,  "yyyy-MM-dd"));
        if (checkOut) params.set("checkOut", format(checkOut, "yyyy-MM-dd"));
        if (guests > 1) params.set("guests", guests.toString());

        closeModal();
        router.push(`/search?${params.toString()}`);
    };

    const handleNext = () => {
        if (currentStep === "location") setCurrentStep("dates");
        else if (currentStep === "dates") setCurrentStep("guests");
    };

    const handleBack = () => {
        if (currentStep === "guests") setCurrentStep("dates");
        else if (currentStep === "dates") setCurrentStep("location");
    };

    const canProceed = () => {
        if (currentStep === "location") return location !== "";
        if (currentStep === "dates") return checkIn !== null && checkOut !== null;
        return true;
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-0 md:p-4 pointer-events-none">
                <div
                    className="bg-white w-full h-full md:h-auto md:max-w-2xl md:rounded-2xl shadow-2xl pointer-events-auto animate-in slide-in-from-bottom md:zoom-in-95 overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-600" />
                        </button>
                        <h2 className="text-lg font-bold text-gray-900">ابحث عن إقامتك</h2>
                        <div className="w-9" /> {/* Spacer */}
                    </div>

                    {/* Step Indicators */}
                    <div className="flex items-center justify-center gap-2 p-4 border-b border-gray-100">
                        <div className={`h-2 w-16 rounded-full transition-colors ${currentStep === "location" ? "bg-primary" : "bg-gray-200"}`} />
                        <div className={`h-2 w-16 rounded-full transition-colors ${currentStep === "dates" ? "bg-primary" : "bg-gray-200"}`} />
                        <div className={`h-2 w-16 rounded-full transition-colors ${currentStep === "guests" ? "bg-primary" : "bg-gray-200"}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Location Step */}
                        {currentStep === "location" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-primary/10 rounded-full">
                                        <MapPin className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">إلى أين تريد الذهاب؟</h3>
                                        <p className="text-sm text-gray-500">اختر المدينة</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {LIBYAN_CITIES.map((city) => (
                                        <button
                                            key={city}
                                            onClick={() => setLocation(city)}
                                            className={`p-4 rounded-xl border-2 text-right transition-all hover:scale-105 ${location === city
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-gray-200 hover:border-primary/50"
                                                }`}
                                        >
                                            <div className="font-medium">{city}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Dates Step */}
                        {currentStep === "dates" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-primary/10 rounded-full">
                                        <Calendar className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">متى تريد السفر؟</h3>
                                        <p className="text-sm text-gray-500">اختر تواريخ الوصول والمغادرة</p>
                                    </div>
                                </div>

                                {/* Selected Dates Display */}
                                {(checkIn || checkOut) && (
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-4">
                                        <div className="flex-1 text-right">
                                            <p className="text-xs text-gray-500 mb-1">تاريخ الوصول</p>
                                            <p className="font-medium text-gray-900">
                                                {checkIn ? format(checkIn, "PPP", { locale: ar }) : "غير محدد"}
                                            </p>
                                        </div>
                                        <div className="h-8 w-px bg-gray-300" />
                                        <div className="flex-1 text-right">
                                            <p className="text-xs text-gray-500 mb-1">تاريخ المغادرة</p>
                                            <p className="font-medium text-gray-900">
                                                {checkOut ? format(checkOut, "PPP", { locale: ar }) : "غير محدد"}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-center" dir="ltr">
                                    <DayPicker
                                        mode="range"
                                        selected={{ from: checkIn || undefined, to: checkOut || undefined }}
                                        onSelect={(range) => {
                                            setCheckIn(range?.from || null);
                                            setCheckOut(range?.to || null);
                                        }}
                                        disabled={{ before: new Date() }}
                                        numberOfMonths={1}
                                        className="border border-gray-200 rounded-xl p-4"
                                        classNames={{
                                            day_selected: "bg-primary text-white hover:bg-primary",
                                            day_today: "font-bold text-primary",
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Guests Step */}
                        {currentStep === "guests" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-primary/10 rounded-full">
                                        <Users className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">كم عدد الضيوف؟</h3>
                                        <p className="text-sm text-gray-500">حدد عدد الأشخاص</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-6 rounded-xl border-2 border-gray-200 bg-gray-50">
                                    <div className="text-right flex-1">
                                        <p className="font-semibold text-gray-900 text-lg">عدد الضيوف</p>
                                        <p className="text-sm text-gray-500">البالغين والأطفال</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-12 w-12 rounded-full border-2"
                                            onClick={() => setGuests(Math.max(1, guests - 1))}
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </Button>
                                        <span className="text-2xl font-bold w-12 text-center">{guests}</span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-12 w-12 rounded-full border-2"
                                            onClick={() => setGuests(guests + 1)}
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 md:p-6 border-t border-gray-200 bg-white">
                        <div className="flex items-center gap-3">
                            {currentStep !== "location" && (
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    className="flex-1 h-12 rounded-xl"
                                >
                                    رجوع
                                </Button>
                            )}
                            {currentStep !== "guests" ? (
                                <Button
                                    onClick={handleNext}
                                    disabled={!canProceed()}
                                    className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90"
                                >
                                    التالي
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSearch}
                                    className="flex-1 h-12 rounded-xl bg-accent hover:bg-accent/90"
                                >
                                    بحث
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
