"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Star, CreditCard, Banknote, Calendar as CalendarIcon } from "lucide-react";
import { eachDayOfInterval, parseISO, format } from "date-fns";
import { ar } from "date-fns/locale";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { GuestSelector } from "@/components/property/BookingWidget";

function calculateDays(start: string, end: string) {
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

export default function BookingForm({ property }: { property: any }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [blockedDatesRaw, setBlockedDatesRaw] = useState<any[]>([]);
    const [loadingDates, setLoadingDates] = useState(true);
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const maxGuests = property.max_guests || 10;

    // Fetch blocked dates on mount and restore dates from URL if present
    useEffect(() => {
        fetchBlockedDates();

        // Restore dates from URL params (after login redirect)
        const urlStartDate = searchParams.get('checkIn');
        const urlEndDate = searchParams.get('checkOut');
        const urlAdults = searchParams.get('adults');
        const urlChildren = searchParams.get('children');
        const urlPayment = searchParams.get('payment');

        if (urlStartDate && urlEndDate) {
            setSelectedRange({
                from: new Date(urlStartDate),
                to: new Date(urlEndDate)
            });
        }
        if (urlAdults) setAdults(parseInt(urlAdults));
        if (urlChildren) setChildren(parseInt(urlChildren));
        if (urlPayment) setPaymentMethod(urlPayment as "cash" | "bank_transfer");
    }, [property.id, searchParams]);

    async function fetchBlockedDates() {
        setLoadingDates(true);
        try {
            const { data, error } = await (supabase as any)
                .rpc("get_property_blocked_dates", { p_property_id: property.id });

            if (error) throw error;

            // Store raw data for calendar display
            setBlockedDatesRaw(data || []);
        } catch (err) {
            console.error("Error fetching blocked dates:", err);
        } finally {
            setLoadingDates(false);
        }
    }

    // Convert blocked dates to Date objects for DayPicker.
    // Only confirmed bookings and host manual blocks disable dates.
    // Pending bookings no longer block the calendar.
    const allBlockedDates: Date[] = [];

    blockedDatesRaw.forEach((block: any) => {
        // status 'confirmed' = confirmed booking, 'blocked' = host manual block
        if (block.status === 'confirmed' || block.status === 'blocked') {
            const dates = eachDayOfInterval({
                start: parseISO(block.start_date),
                end: parseISO(block.end_date),
            });
            allBlockedDates.push(...dates);
        }
    });

    // Check if selected dates overlap with blocked dates (backup validation)
    function hasBlockedDates() {
        if (!selectedRange?.from || !selectedRange?.to) return false;

        const selectedDates = eachDayOfInterval({
            start: selectedRange.from,
            end: selectedRange.to
        });

        return selectedDates.some(date =>
            allBlockedDates.some(blocked =>
                format(blocked, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
            )
        );
    }

    const handleBooking = async () => {
        if (!selectedRange?.from || !selectedRange?.to) {
            alert("الرجاء اختيار تواريخ الحجز");
            return;
        }

        const startDate = format(selectedRange.from, "yyyy-MM-dd");
        const endDate = format(selectedRange.to, "yyyy-MM-dd");

        // Check if dates are blocked (backup client-side check)
        if (hasBlockedDates()) {
            alert("التواريخ المحددة غير متاحة. الرجاء اختيار تواريخ أخرى.");
            return;
        }

        setLoading(true);
        try {
            // Check if user is authenticated
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                // User not logged in - redirect to login with return URL
                // Preserve booking details in URL params
                const returnUrl = `${pathname}?checkIn=${startDate}&checkOut=${endDate}&adults=${adults}&children=${children}&payment=${paymentMethod}`;

                // Store the return URL and redirect to login
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('returnUrl', returnUrl);
                }

                router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
                setLoading(false);
                return;
            }

            // Server-side overlap check (includes confirmed + pending + manual blocks)
            const { data: overlapCheck, error: overlapError } = await (supabase as any)
                .rpc('check_booking_overlap', {
                    p_property_id: property.id,
                    p_start_date: startDate,
                    p_end_date: endDate
                });

            if (overlapError) {
                console.error("Overlap check error:", overlapError);
                alert("حدث خطأ أثناء التحقق من التوفر. الرجاء المحاولة مرة أخرى.");
                setLoading(false);
                return;
            }

            // If overlap exists, show error
            if (overlapCheck && overlapCheck.length > 0 && overlapCheck[0].has_overlap) {
                alert(overlapCheck[0].overlap_type || "التواريخ المحددة غير متاحة. الرجاء اختيار تواريخ أخرى.");
                setLoading(false);
                return;
            }

            const days = calculateDays(startDate, endDate);
            const totalPrice = days * property.price_per_night;
            const totalGuests = adults + children;

            // Create booking with new fields
            const { data: booking, error } = await (supabase as any).from("bookings").insert({
                property_id: property.id,
                guest_id: user.id,
                host_id: property.host_id,
                start_date: startDate,
                end_date: endDate,
                total_price: totalPrice,
                payment_method: paymentMethod,
                num_guests: totalGuests,
                status: 'pending'
                // booking_code and expires_at will be auto-generated by database trigger
            }).select().single();

            if (error) throw error;

            // After successful booking, redirect to WhatsApp immediately
            if (booking && property.host?.phone_number) {
                const bookingCode = booking.booking_code;
                const cleanNumber = property.host.phone_number.replace(/[\s\-\(\)]/g, "");

                const message = `مرحباً، أريد حجز ${property.title} من ${startDate} إلى ${endDate} - كود الحجز: ${bookingCode}`;
                const encodedMessage = encodeURIComponent(message);
                const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

                // Use window.location.href to trigger native WhatsApp app on mobile
                // This replaces the current page, making pending requests "invisible"
                window.location.href = whatsappUrl;
            } else {
                // Fallback if no phone number (shouldn't happen)
                alert("تم إنشاء طلب الحجز بنجاح!");
            }

        } catch (error: any) {
            alert("خطأ: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const days = (selectedRange?.from && selectedRange?.to)
        ? calculateDays(
            format(selectedRange.from, "yyyy-MM-dd"),
            format(selectedRange.to, "yyyy-MM-dd")
        )
        : 0;
    const total = days * property.price_per_night;
    const serviceFee = Math.round(total * 0.05); // 5% service fee
    const grandTotal = total + serviceFee;

    return (
        <div className="sticky top-24">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
                {/* Price Header */}
                <div className="flex items-baseline justify-between mb-6">
                    <div>
                        <span className="text-2xl font-bold text-secondary">{property.price_per_night} د.ل</span>
                        <span className="text-gray-500 mr-1">/ ليلة</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-current text-gray-900" />
                        <span className="font-semibold">4.9</span>
                        <span className="text-gray-500">· 23 تقييم</span>
                    </div>
                </div>

                {/* Selected Dates Display */}
                {selectedRange?.from && (
                    <div className="border border-gray-300 rounded-xl mb-4 p-4">
                        <div className="flex items-center gap-3 text-sm">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            <div>
                                <span className="font-semibold text-gray-900">
                                    {format(selectedRange.from, "d MMMM yyyy", { locale: ar })}
                                </span>
                                {selectedRange.to && (
                                    <>
                                        <span className="text-gray-500 mx-2">←</span>
                                        <span className="font-semibold text-gray-900">
                                            {format(selectedRange.to, "d MMMM yyyy", { locale: ar })}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Calendar - Inline and Always Visible */}
                <div className="mb-4 border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <div className="p-4 bg-gradient-to-r from-teal-50 to-[#F5F0E8] border-b border-gray-200">
                        <h3 className="text-sm font-bold text-teal-900 flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            اختر تواريخ الإقامة
                        </h3>
                    </div>
                    <div className="p-4 calendar-container" dir="ltr">
                        {loadingDates ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <DayPicker
                                mode="range"
                                selected={selectedRange}
                                onSelect={setSelectedRange}
                                disabled={[
                                    { before: new Date() },
                                    ...allBlockedDates
                                ]}
                                locale={ar}
                                numberOfMonths={1}
                                className="rdp-booking"
                                modifiers={{
                                    unavailable: allBlockedDates,
                                }}
                                modifiersClassNames={{
                                    unavailable: "rdp-day-unavailable",
                                }}
                            />
                        )}
                    </div>

                </div>

                {/* Guest Selection */}
                <div className="border border-gray-300 rounded-xl mb-4">
                    <GuestSelector
                        maxGuests={maxGuests}
                        adults={adults}
                        children={children}
                        onAdultsChange={setAdults}
                        onChildrenChange={setChildren}
                    />
                </div>

                {/* Payment Method Selection - Modern Style */}
                <div className="mb-6">
                    <Label className="text-[10px] font-bold uppercase text-gray-700 tracking-wider mb-2 block">طريقة الدفع</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setPaymentMethod("cash")}
                            className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === "cash"
                                ? "border-gray-900 bg-gray-50"
                                : "border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            <Banknote className={`h-5 w-5 ${paymentMethod === "cash" ? "text-gray-900" : "text-gray-400"}`} />
                            <span className={`text-sm ${paymentMethod === "cash" ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                                نقداً
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod("bank_transfer")}
                            className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === "bank_transfer"
                                ? "border-gray-900 bg-gray-50"
                                : "border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            <CreditCard className={`h-5 w-5 ${paymentMethod === "bank_transfer" ? "text-gray-900" : "text-gray-400"}`} />
                            <span className={`text-sm ${paymentMethod === "bank_transfer" ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                                تحويل
                            </span>
                        </button>
                    </div>
                </div>

                {/* Reserve Button - Golden Sunset */}
                <button
                    onClick={handleBooking}
                    disabled={loading || days <= 0}
                    className="w-full py-3.5 px-6 rounded-xl font-semibold text-white text-base transition-all bg-secondary hover:bg-secondary/90 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                    {loading ? (
                        <Loader2 className="animate-spin mx-auto h-5 w-5" />
                    ) : days > 0 ? (
                        "إرسال طلب الحجز"
                    ) : (
                        "اختر التواريخ للحجز"
                    )}
                </button>

                {days > 0 && (
                    <p className="text-center text-sm text-gray-500 mt-3">لن يتم خصم أي مبلغ الآن</p>
                )}

                {/* Price Breakdown - Only show when dates selected */}
                {days > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                        <div className="flex justify-between text-gray-700">
                            <span className="underline cursor-pointer hover:text-gray-900">
                                {property.price_per_night} د.ل × {days} ليالٍ
                            </span>
                            <span>{total} د.ل</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                            <span className="underline cursor-pointer hover:text-gray-900">رسوم الخدمة</span>
                            <span>{serviceFee} د.ل</span>
                        </div>
                        <div className="flex justify-between pt-4 border-t border-gray-200 font-semibold text-gray-900">
                            <span>الإجمالي</span>
                            <span>{grandTotal} د.ل</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Report Listing Link */}
            <div className="text-center mt-6">
                <button className="text-sm text-gray-500 underline hover:text-gray-700 transition-colors">
                    الإبلاغ عن هذا المكان
                </button>
            </div>

            {/* Custom Calendar Styles - Teal/Dark Green Theme */}
            <style jsx global>{`
                .rdp-booking {
                    --rdp-cell-size: 45px;
                    --rdp-accent-color: #0F766E;
                    --rdp-background-color: #E0F2F1;
                    font-family: inherit;
                    margin: 0 auto;
                }

                .rdp-booking .rdp-months {
                    justify-content: center;
                }

                .rdp-booking .rdp-month {
                    margin: 0;
                }

                .rdp-booking .rdp-caption {
                    margin-bottom: 1rem;
                }

                .rdp-booking .rdp-caption_label {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #111827;
                }

                .rdp-booking .rdp-nav_button {
                    width: 32px;
                    height: 32px;
                }

                .rdp-booking .rdp-nav_button:hover {
                    background-color: #F3F4F6;
                }

                .rdp-booking .rdp-head_cell {
                    color: #9CA3AF;
                    font-weight: 600;
                    font-size: 0.75rem;
                }

                /* Available dates - white bg, dark text (default, no override needed) */
                .rdp-booking .rdp-day {
                    border-radius: 8px;
                    font-size: 0.875rem;
                    transition: background-color 0.15s;
                    color: #111827;
                }

                .rdp-booking .rdp-day:hover:not(.rdp-day_disabled):not(.rdp-day_unavailable) {
                    background-color: #F3F4F6;
                }

                /* Selected range - brand teal, white text */
                .rdp-booking .rdp-day_selected,
                .rdp-booking .rdp-day_range_start,
                .rdp-booking .rdp-day_range_end {
                    background-color: #0F766E !important;
                    color: white !important;
                    font-weight: 600;
                }

                .rdp-booking .rdp-day_range_middle {
                    background-color: #CCFBF1 !important;
                    color: #134E4A !important;
                    font-weight: 400;
                    border-radius: 0 !important;
                }

                /* Today - subtle border only, no fill */
                .rdp-booking .rdp-day_today {
                    border: 2px solid #0F766E !important;
                    background-color: transparent !important;
                    color: #0F766E;
                    font-weight: 700;
                }

                /* Unavailable (all blocked types) - light grey, grey text, no interaction */
                .rdp-day-unavailable,
                .rdp-booking .rdp-day_disabled {
                    background-color: #F3F4F6 !important;
                    color: #D1D5DB !important;
                    cursor: not-allowed !important;
                    opacity: 1 !important;
                }

                .rdp-day-unavailable:hover,
                .rdp-booking .rdp-day_disabled:hover {
                    background-color: #F3F4F6 !important;
                }

                @media (max-width: 640px) {
                    .rdp-booking {
                        --rdp-cell-size: 40px;
                    }

                    .rdp-booking .rdp-caption_label {
                        font-size: 0.875rem;
                    }

                    .rdp-booking .rdp-day {
                        font-size: 0.75rem;
                    }
                }
            `}</style>
        </div>
    );
}
