"use client";

// Opt out of Next.js Router Cache — prevents stale loading state on soft navigation
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import type { DateRange } from "react-day-picker";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, Loader2, X, CheckCircle2 } from "lucide-react";
import "react-day-picker/dist/style.css";

// Dynamically imported with ssr:false — avoids hydration mismatch on client-side navigation
const DayPicker = nextDynamic(
    () => import("react-day-picker").then((mod) => ({ default: mod.DayPicker })),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ),
    }
);

interface BlockedDate {
    start_date: string;
    end_date: string;
    block_type: "booking" | "manual_block";
    block_id: string;
}

export default function PropertyCalendarPage() {
    const params = useParams();
    const propertyId = params.id as string;

    const [property, setProperty] = useState<any>(null);
    const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
    const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
    const [loading, setLoading] = useState(true);
    const [blocking, setBlocking] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Guard: useParams() may return undefined on the first render during soft navigation
        if (!propertyId) return;
        loadPropertyAndDates();
    }, [propertyId]);

    async function loadPropertyAndDates() {
        setLoading(true);
        setError("");

        try {
            const supabase = createClient();
            // Fetch property details
            const { data: propertyData, error: propertyError } = await (supabase as any)
                .from("properties")
                .select("*")
                .eq("id", propertyId)
                .single();

            if (propertyError) throw propertyError;
            setProperty(propertyData);

            // Fetch blocked dates using RPC function
            const { data: blockedData, error: blockedError } = await supabase
                .rpc("get_property_blocked_dates", { p_property_id: propertyId } as any);

            if (blockedError) throw blockedError;
            setBlockedDates(blockedData || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleBlockDates() {
        if (!selectedRange?.from || !selectedRange?.to) {
            setError("الرجاء تحديد نطاق تاريخ");
            return;
        }

        setBlocking(true);
        setError("");

        try {
            const supabase = createClient();
            const { error: insertError } = await (supabase as any)
                .from("availability")
                .insert({
                    property_id: propertyId,
                    start_date: format(selectedRange.from, "yyyy-MM-dd"),
                    end_date: format(selectedRange.to, "yyyy-MM-dd"),
                });

            if (insertError) throw insertError;

            // Reload dates
            await loadPropertyAndDates();
            setSelectedRange(undefined);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setBlocking(false);
        }
    }

    async function handleUnblockDates(blockId: string) {
        try {
            const supabase = createClient();
            const { error: deleteError } = await (supabase as any)
                .from("availability")
                .delete()
                .eq("id", blockId);

            if (deleteError) throw deleteError;

            // Reload dates
            await loadPropertyAndDates();
        } catch (err: any) {
            setError(err.message);
        }
    }

    // Convert blocked dates to Date objects for DayPicker
    const bookingDates: Date[] = [];
    const manualBlockDates: Date[] = [];

    blockedDates.forEach((block) => {
        const dates = eachDayOfInterval({
            start: parseISO(block.start_date),
            end: parseISO(block.end_date),
        });

        if (block.block_type === "booking") {
            bookingDates.push(...dates);
        } else {
            manualBlockDates.push(...dates);
        }
    });

    const allBlockedDates = [...bookingDates, ...manualBlockDates];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8" dir="rtl">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/host/properties"
                        className="inline-flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 ml-2" />
                        العودة إلى العقارات
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-teal-900">
                                إدارة التقويم
                            </h1>
                            <p className="text-gray-600">{property?.title}</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar */}
                    <Card className="lg:col-span-2 overflow-hidden border-0 shadow-xl">
                        <CardHeader className="bg-gradient-to-r from-teal-50 to-[#F5F0E8] p-6">
                            <h2 className="text-xl font-bold text-teal-900">
                                حدد التواريخ المراد حجبها
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                اختر نطاق تاريخ لمنع الحجوزات
                            </p>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="calendar-container" dir="ltr">
                                <DayPicker
                                    mode="range"
                                    selected={selectedRange}
                                    onSelect={setSelectedRange}
                                    disabled={allBlockedDates}
                                    locale={ar}
                                    numberOfMonths={2}
                                    className="rdp-custom"
                                    modifiers={{
                                        booking: bookingDates,
                                        manualBlock: manualBlockDates,
                                    }}
                                    modifiersClassNames={{
                                        booking: "rdp-day-booking",
                                        manualBlock: "rdp-day-manual-block",
                                    }}
                                />
                            </div>

                            {selectedRange?.from && (
                                <div className="mt-6 p-4 bg-teal-50 rounded-xl border-2 border-primary/20">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">
                                                النطاق المحدد:
                                            </p>
                                            <p className="font-bold text-teal-900">
                                                {format(selectedRange.from, "PPP", { locale: ar })}
                                                {selectedRange.to && (
                                                    <> - {format(selectedRange.to, "PPP", { locale: ar })}</>
                                                )}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleBlockDates}
                                            disabled={blocking || !selectedRange.to}
                                            className="bg-accent hover:bg-[#EA580C]"
                                        >
                                            {blocking ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                                    جاري الحجب...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="h-4 w-4 ml-2" />
                                                    حجب التواريخ
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Legend & Blocked Dates List */}
                    <div className="space-y-6">
                        {/* Legend */}
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="pb-3">
                                <h3 className="font-bold text-gray-900">مفتاح الألوان</h3>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-primary"></div>
                                    <div>
                                        <p className="font-semibold text-sm">حجوزات مؤكدة</p>
                                        <p className="text-xs text-gray-500">لا يمكن إلغاؤها من هنا</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-gray-400"></div>
                                    <div>
                                        <p className="font-semibold text-sm">حجب يدوي</p>
                                        <p className="text-xs text-gray-500">يمكن إلغاؤه</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Manual Blocks List */}
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="pb-3">
                                <h3 className="font-bold text-gray-900">الحجوبات اليدوية</h3>
                            </CardHeader>
                            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                                {blockedDates
                                    .filter((b) => b.block_type === "manual_block")
                                    .map((block) => (
                                        <div
                                            key={block.block_id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                            <div className="text-sm">
                                                <p className="font-semibold text-gray-900">
                                                    {format(parseISO(block.start_date), "PPP", { locale: ar })}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    إلى {format(parseISO(block.end_date), "PPP", { locale: ar })}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleUnblockDates(block.block_id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                {blockedDates.filter((b) => b.block_type === "manual_block").length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        لا توجد حجوبات يدوية
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Done Button - High-End CTA */}
                <div className="mt-8 pb-8 flex justify-center">
                    <Link
                        href="/host/properties"
                        className="w-full md:w-auto md:min-w-[400px] bg-[#134e4a] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#0f3f3c] transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="h-6 w-6" />
                        إتمام
                    </Link>
                </div>
            </div>

            <style jsx global>{`
                .rdp-custom {
                    --rdp-cell-size: 50px;
                    --rdp-accent-color: #0F766E;
                    --rdp-background-color: #E0F2F1;
                    font-family: inherit;
                }

                .rdp-day-booking {
                    background-color: #0F766E !important;
                    color: white !important;
                    font-weight: bold;
                }

                .rdp-day-manual-block {
                    background-color: #9CA3AF !important;
                    color: white !important;
                }

                .rdp-day_selected {
                    background-color: #F97316 !important;
                    color: white !important;
                }

                @media (max-width: 768px) {
                    .rdp-custom {
                        --rdp-cell-size: 40px;
                    }
                }
            `}</style>
        </div>
    );
}
