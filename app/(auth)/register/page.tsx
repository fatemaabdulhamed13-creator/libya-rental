"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

    // Check for redirect URL on mount
    useEffect(() => {
        const redirect = searchParams.get('redirect');
        if (redirect) {
            setRedirectUrl(decodeURIComponent(redirect));
        } else if (typeof window !== 'undefined') {
            const storedUrl = sessionStorage.getItem('returnUrl');
            if (storedUrl) {
                setRedirectUrl(storedUrl);
            }
        }
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Sign up user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        full_name: formData.fullName,
                        phone_number: formData.phone,
                    } as any,
                },
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Create Profile (Trigger might handle this, but explicit is safer for custom fields if trigger is basic)
                // With the 'profiles' table extending auth.users via trigger, we might need to update it.
                // Assuming the migration uses a trigger to create the profile row, we update it here.
                // Or if no trigger, we insert it. Let's assume standard Supabase "User Management Starter" trigger exists or we do it manually.
                // Given our schema, we should update the profile with the extra fields.

                const { error: profileError } = await (supabase
                    .from("profiles") as any)
                    .update({
                        full_name: formData.fullName,
                        phone_number: formData.phone,
                    })
                    .eq("id", authData.user.id);

                if (profileError) {
                    // If update fails (maybe row doesn't exist yet due to race condition with trigger), try insert
                    // Actually, best practice is to handle this in a Postgres Trigger.
                    // For now, let's assume the user has set up the trigger or we just upsert.
                    const { error: upsertError } = await supabase.from('profiles').upsert({
                        id: authData.user.id,
                        full_name: formData.fullName,
                        phone_number: formData.phone,
                        avatar_url: '',
                    } as any)
                    if (upsertError) console.error("Profile creation error:", upsertError);
                }
            }

            // Redirect to verification page with return URL if present
            const verifyUrl = redirectUrl
                ? `/verify-request?email=${encodeURIComponent(formData.email)}&redirect=${encodeURIComponent(redirectUrl)}`
                : `/verify-request?email=${encodeURIComponent(formData.email)}`;

            router.push(verifyUrl);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-primary">إنشاء حساب جديد</CardTitle>
                    <CardDescription>انضم إلى مجتمع ليبيا رنتل</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Show message if redirected from booking */}
                    {redirectUrl && (
                        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 text-sm p-3 rounded-md flex items-start gap-2">
                            <Info className="h-5 w-5 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium mb-1">أنشئ حساباً للمتابعة</p>
                                <p className="text-xs">سيتم حفظ تفاصيل حجزك وإكمال العملية بعد إنشاء الحساب</p>
                            </div>
                        </div>
                    )}
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">الاسم الكامل</Label>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="محمد علي"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                className="text-right"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">البريد الإلكتروني</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="text-right"
                                dir="rtl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">رقم الهاتف</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="0912345678"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="text-right"
                                dir="rtl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">كلمة المرور</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="text-right"
                                dir="rtl"
                            />
                        </div>
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                <span>{error}</span>
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "جاري الإنشاء..." : "تسجيل حساب"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        لديك حساب بالفعل؟{" "}
                        <Link
                            href={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login"}
                            className="text-primary hover:underline font-medium"
                        >
                            سجل دخولك هنا
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
