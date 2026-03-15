"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signUpAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-50" />}>
            <RegisterContent />
        </Suspense>
    );
}

function RegisterContent() {
    const searchParams = useSearchParams();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
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

        const result = await signUpAction(formData.email, formData.password, {
            full_name: formData.fullName,
            phone_number: formData.phone,
        });

        if ("error" in result) {
            setError(result.error);
        } else {
            setSuccess(true);
        }

        setLoading(false);
    };

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-8 pb-8 text-center">
                        <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">تحقق من بريدك الإلكتروني</h2>
                        <p className="text-sm text-muted-foreground mb-1">
                            أرسلنا رابط تأكيد إلى
                        </p>
                        <p className="text-sm font-semibold text-primary mb-4">{formData.email}</p>
                        <p className="text-xs text-muted-foreground">
                            اضغط على الرابط في البريد لتفعيل حسابك والبدء.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-primary">إنشاء حساب جديد</CardTitle>
                    <CardDescription>انضم إلى مجتمع استراحة</CardDescription>
                </CardHeader>
                <CardContent>
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
