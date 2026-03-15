"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info } from "lucide-react";

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-50" />}>
            <LoginContent />
        </Suspense>
    );
}

function LoginContent() {
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

    useEffect(() => {
        const redirect = searchParams.get('redirect');
        if (redirect) {
            setRedirectUrl(decodeURIComponent(redirect));
        } else {
            const stored = sessionStorage.getItem('returnUrl');
            if (stored) setRedirectUrl(stored);
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Store the destination so SupabaseAuthListener can read it on SIGNED_IN
        const paramRedirect = searchParams.get('redirect');
        const storedRedirect = sessionStorage.getItem('returnUrl') ?? null;
        const destination = paramRedirect
            ? decodeURIComponent(paramRedirect)
            : (storedRedirect ?? '/');

        // Write destination to sessionStorage so SupabaseAuthListener can use it
        // (it redirects on SIGNED_IN when pathname === '/login')
        if (destination !== '/') {
            sessionStorage.setItem('returnUrl', destination);
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
        }
        // On success: SupabaseAuthListener catches SIGNED_IN and calls window.location.href = "/"
        // Keep spinner until navigation completes.
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-primary">تسجيل الدخول</CardTitle>
                    <CardDescription>أهلاً بك مجدداً في استراحة</CardDescription>
                </CardHeader>
                <CardContent>
                    {redirectUrl && (
                        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 text-sm p-3 rounded-md flex items-start gap-2">
                            <Info className="h-5 w-5 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium mb-1">يرجى تسجيل الدخول للمتابعة</p>
                                <p className="text-xs">سيتم حفظ تفاصيل حجزك وإكمال العملية بعد تسجيل الدخول</p>
                            </div>
                        </div>
                    )}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">البريد الإلكتروني</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="text-right"
                                dir="rtl"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-baseline justify-between w-full" dir="rtl">
                                <Label htmlFor="password">كلمة المرور</Label>
                                <Link
                                    href="/reset-password"
                                    className="text-xs text-gray-400 hover:text-teal-700 underline-offset-4 hover:underline transition-colors"
                                >
                                    هل نسيت كلمة المرور؟
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                            {loading ? "جاري التسجيل..." : "دخول"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        ليس لديك حساب؟{" "}
                        <Link
                            href={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : "/register"}
                            className="text-primary hover:underline font-medium"
                        >
                            أنشئ حساباً جديداً
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
