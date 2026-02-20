"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";
import ImageUpload from "@/components/image-upload";
import Navbar from "@/components/navbar";

export default function GuestTripsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // Simple state to track which booking is currently uploading proof
    const [uploadingFor, setUploadingFor] = useState<string | null>(null);

    const fetchBookings = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from("bookings")
            .select(`
        *,
        property:properties(title, host_id),
        host:profiles!host_id(bank_details)
      `)
            .eq("guest_id", user.id)
            .eq("status", "confirmed")  // Only show confirmed bookings
            .order("created_at", { ascending: false });

        if (data) setBookings(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleProofUploaded = async (bookingId: string, urls: string[]) => {
        if (urls.length === 0) return;

        const supabase = createClient();
        const { error } = await (supabase
            .from("bookings") as any)
            .update({
                payment_proof_url: urls[0],
                status: 'host_verifying'
            } as any)
            .eq("id", bookingId);

        if (!error) {
            setUploadingFor(null);
            fetchBookings();
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'قيد المراجعة';
            case 'awaiting_payment': return 'بانتظار الدفع';
            case 'host_verifying': return 'جاري التحقق';
            case 'confirmed': return 'مؤكد';
            case 'rejected': return 'مرفوض';
            case 'cancelled': return 'ملغى';
            case 'expired': return 'منتهي الصلاحية';
            default: return status;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">حجوزاتي</h1>

                <div className="space-y-4">
                    {bookings.map((booking) => (
                        <Card key={booking.id} className="p-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-xl">{booking.property.title}</h3>
                                    <p className="text-sm text-muted-foreground">{booking.start_date} - {booking.end_date}</p>

                                    {/* Booking Code */}
                                    {booking.booking_code && (
                                        <p className="text-sm">
                                            <span className="text-gray-600">كود الحجز:</span>{' '}
                                            <code className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono font-semibold text-gray-900">
                                                {booking.booking_code}
                                            </code>
                                        </p>
                                    )}

                                    <p className="font-medium mt-1">
                                        الحالة: <span className="text-primary">{getStatusLabel(booking.status)}</span>
                                    </p>
                                </div>
                                <div className="text-left">
                                    <p className="font-bold">{booking.total_price} د.ل</p>
                                </div>
                            </div>

                            {booking.status === 'awaiting_payment' && booking.payment_method === 'bank_transfer' && (
                                <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <h4 className="font-bold text-blue-800 mb-2">مطلوب الدفع لتاكيد الحجز</h4>
                                    <div className="text-sm text-blue-700 mb-4 space-y-1">
                                        <p>الرجاء تحويل المبلغ إلى الحساب التالي:</p>
                                        <p><strong>المصرف:</strong> {booking.host?.bank_details?.bank_name}</p>
                                        <p><strong>IBAN/رقم الحساب:</strong> {booking.host?.bank_details?.iban}</p>
                                        <p><strong>اسم المستفيد:</strong> {booking.host?.bank_details?.account_name}</p>
                                    </div>

                                    {uploadingFor === booking.id ? (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">ارفق صورة الإيصال:</p>
                                            <ImageUpload
                                                value={[]}
                                                onChange={(urls) => handleProofUploaded(booking.id, urls)}
                                                bucket="payment-proofs"
                                            />
                                            <Button variant="ghost" size="sm" onClick={() => setUploadingFor(null)}>إلغاء</Button>
                                        </div>
                                    ) : (
                                        <Button onClick={() => setUploadingFor(booking.id)} className="w-full sm:w-auto">
                                            <Upload className="h-4 w-4 ml-2" />
                                            إرفاق الإيصال
                                        </Button>
                                    )}
                                </div>
                            )}

                            {(booking.status === 'pending' || booking.status === 'awaiting_payment') && (
                                <div className="mt-4 flex gap-2">
                                    <Link href={`/messages/${booking.id}`}>
                                        <Button variant="outline" size="sm">مراسلة المضيف</Button>
                                    </Link>
                                    {/* Cancel button logic could go here */}
                                </div>
                            )}
                        </Card>
                    ))}

                    {!loading && bookings.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground mb-4">لم تقم بأي حجوزات بعد</p>
                            <Link href="/search">
                                <Button>تصفح العقارات</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
