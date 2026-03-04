"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle } from "lucide-react";

export default function VerifyRequestPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-50" />}>
            <VerifyRequestContent />
        </Suspense>
    );
}

function VerifyRequestContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email");

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-primary">تحقق من بريدك الإلكتروني</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">
                        لقد أرسلنا رابط تأكيد إلى:
                    </p>
                    {email && (
                        <p className="font-bold text-lg dir-ltr">{email}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                        الرجاء النقر على الرابط في البريد الإلكتروني لتفعيل حسابك.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Link href="/login" className="w-full">
                        <Button variant="outline" className="w-full">
                            العودة لتسجيل الدخول
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
