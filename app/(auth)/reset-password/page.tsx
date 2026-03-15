"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-50" />}>
            <ResetPasswordContent />
        </Suspense>
    );
}

function ResetPasswordContent() {
    const supabase = createClient();

    // "request" = send reset email | "update" = set new password (after clicking email link)
    const [mode, setMode] = useState<"request" | "update">("request");

    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Detect if the user arrived via the password-reset email link.
    // Supabase fires PASSWORD_RECOVERY when the recovery token is exchanged.
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setMode("update");
            }
        });
        return () => subscription.unsubscribe();
    }, [supabase]);

    // ── Step 1: Request reset email ──────────────────────────────────────────
    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await resetPasswordAction(email);

        if ("error" in result) {
            setError(result.error);
        } else {
            setSuccess(true);
        }

        setLoading(false);
    };

    // ── Step 2: Set the new password ─────────────────────────────────────────
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError("كلمتا المرور غير متطابقتين.");
            return;
        }
        if (newPassword.length < 6) {
            setError("يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.");
            return;
        }

        setLoading(true);

        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (updateError) {
            setError(updateError.message);
        } else {
            setSuccess(true);
        }

        setLoading(false);
    };

    // ── Success screens ───────────────────────────────────────────────────────
    if (success && mode === "request") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-8 pb-8 text-center">
                        <Mail className="h-14 w-14 text-primary mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">تحقق من بريدك الإلكتروني</h2>
                        <p className="text-sm text-muted-foreground mb-1">أرسلنا رابط إعادة تعيين كلمة المرور إلى</p>
                        <p className="text-sm font-semibold text-primary mb-4">{email}</p>
                        <p className="text-xs text-muted-foreground">
                            اضغط على الرابط في البريد لإعادة تعيين كلمة المرور. ينتهي الرابط خلال ساعة.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Link href="/login" className="text-sm text-primary hover:underline font-medium">
                            العودة إلى تسجيل الدخول
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (success && mode === "update") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-8 pb-8 text-center">
                        <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">تم تغيير كلمة المرور</h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
                        </p>
                        <Button asChild className="w-full">
                            <Link href="/login">تسجيل الدخول</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ── Step 1: Email form ────────────────────────────────────────────────────
    if (mode === "request") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold text-primary">إعادة تعيين كلمة المرور</CardTitle>
                        <CardDescription>
                            أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة التعيين
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleRequest} className="space-y-4">
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
                            {error && (
                                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{error}</span>
                                </div>
                            )}
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "جاري الإرسال..." : "أرسل رابط إعادة التعيين"}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Link href="/login" className="text-sm text-muted-foreground hover:underline">
                            العودة إلى تسجيل الدخول
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // ── Step 2: New password form (after clicking email link) ─────────────────
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-primary">كلمة مرور جديدة</CardTitle>
                    <CardDescription>اختر كلمة مرور قوية لحسابك</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className="text-right"
                                dir="rtl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
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
                            {loading ? "جاري الحفظ..." : "حفظ كلمة المرور"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
