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

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

    // Check for redirect URL on mount
    useEffect(() => {
        const redirect = searchParams.get('redirect');
        if (redirect) {
            setRedirectUrl(decodeURIComponent(redirect));
        } else if (typeof window !== 'undefined') {
            // Fallback to sessionStorage
            const storedUrl = sessionStorage.getItem('returnUrl');
            if (storedUrl) {
                setRedirectUrl(storedUrl);
            }
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Clear stored return URL
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('returnUrl');
            }

            // Redirect to stored URL or home
            if (redirectUrl) {
                router.push(redirectUrl);
            } else {
                router.push("/");
            }
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
                    <CardTitle className="text-2xl font-bold text-primary">تسجيل الدخول</CardTitle>
                    <CardDescription>أهلاً بك مجدداً في ليبيا رنتل</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Show message if redirected from booking */}
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
                            <Label htmlFor="password">كلمة المرور</Label>
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
