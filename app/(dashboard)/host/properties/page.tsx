"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Home as HomeIcon, Edit, Calendar } from "lucide-react";
import VerificationBanner from "@/components/verification-banner";

export default function HostPropertiesPage() {
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isIdentityVerified, setIsIdentityVerified] = useState(false);

    useEffect(() => {
        const fetchProperties = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch user's verification status
            const { data: profile } = await (supabase
                .from("profiles") as any)
                .select("is_identity_verified")
                .eq("id", user.id)
                .single();

            if (profile) {
                setIsIdentityVerified(profile.is_identity_verified || false);
            }

            const { data, error } = await supabase
                .from("properties")
                .select("*")
                .eq("host_id", user.id)
                .order("created_at", { ascending: false });

            if (data) setProperties(data);
            setLoading(false);
        };

        fetchProperties();
    }, []);

    return (
        <div className="space-y-6">
            {/* Verification Banner for Unverified Hosts */}
            <VerificationBanner isIdentityVerified={isIdentityVerified} />

            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">عقاراتي</h1>
                <Link href="/host/properties/new">
                    <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span>إضافة عقار جديد</span>
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
            ) : properties.length === 0 ? (
                <Card className="text-center py-12">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                            <HomeIcon className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>لا توجد عقارات مضافة</CardTitle>
                        <CardDescription>ابدأ بتأجير منزلك واستقبل الضيوف اليوم.</CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Link href="/host/properties/new">
                            <Button variant="outline">إضافة أول عقار</Button>
                        </Link>
                    </CardFooter>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => (
                        <Card key={property.id} className="overflow-hidden">
                            {/* Image Thumbnail */}
                            <div className="aspect-video bg-gray-200 relative">
                                {property.images && property.images[0] ? (
                                    <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gray-100">
                                        لا توجد صور
                                    </div>
                                )}
                            </div>
                            <CardHeader>
                                <CardTitle className="truncate">{property.title}</CardTitle>
                                <CardDescription>{property.city}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="font-bold text-lg text-primary">{property.price_per_night} د.ل / ليلة</p>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <Link href={`/host/properties/${property.id}/edit`} className="flex-1">
                                    <Button variant="outline" size="sm" className="w-full">
                                        <Edit className="h-4 w-4 ml-2" />
                                        تعديل
                                    </Button>
                                </Link>
                                <Link href={`/host/properties/${property.id}/calendar`}>
                                    <Button variant="default" size="sm" className="bg-accent hover:bg-[#EA580C]">
                                        <Calendar className="h-4 w-4 ml-2" />
                                        التقويم
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
