"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, ShieldCheck, TrendingUp, Star, User, Phone, Building2, CreditCard, Wallet, Sparkles, Home, Gift, Palmtree, Sun, Award, CheckCircle2 } from "lucide-react";
import WhatsAppInput from "@/components/ui/WhatsAppInput";

interface BankDetails {
    [key: string]: string;
    bank_name: string;
    iban: string;
    account_name: string;
}

export default function ProfileForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [originalIsHost, setOriginalIsHost] = useState(false); // Track original host status
    const [identityFile, setIdentityFile] = useState<File | null>(null);
    const [identityFilePreview, setIdentityFilePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        phone_number: "",
        is_host: false,
        is_identity_verified: false,
        verification_status: "unverified",
        bank_details: {
            bank_name: "",
            iban: "",
            account_name: "",
        } as BankDetails,
    });
    const [isWhatsAppValid, setIsWhatsAppValid] = useState(false);

    useEffect(() => {
        const getProfile = async () => {
            try {
                // Fetch profile via API route (service role — bypasses RLS SELECT issues)
                const res = await fetch('/api/profile/me')

                if (res.status === 401) {
                    router.push('/login')
                    return
                }

                if (!res.ok) {
                    console.error('[PROFILE] Failed to fetch profile:', res.status)
                    setLoading(false)
                    return
                }

                const { profile, userId } = await res.json()

                // Set user object from the API response
                setUser({ id: userId })

                if (profile) {
                    const isHost = profile.is_host || false
                    setOriginalIsHost(isHost)
                    setFormData({
                        full_name: profile.full_name || '',
                        phone_number: profile.phone_number || '',
                        is_host: isHost,
                        is_identity_verified: profile.is_identity_verified || false,
                        verification_status: profile.verification_status || 'unverified',
                        bank_details: (profile.bank_details as unknown as BankDetails) || {
                            bank_name: '',
                            iban: '',
                            account_name: '',
                        },
                    })
                    if (profile.identity_document_url) {
                        setIdentityFilePreview(profile.identity_document_url)
                    }
                }
                // If profile is null (new user), form stays at empty defaults — that's correct
            } catch (err) {
                console.error('[PROFILE] Unexpected error loading profile:', err)
            } finally {
                setLoading(false)
            }
        }

        getProfile()
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            bank_details: {
                ...formData.bank_details,
                [e.target.name]: e.target.value,
            },
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type (images and PDFs only)
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (!validTypes.includes(file.type)) {
                alert("يرجى رفع صورة (JPG, PNG) أو ملف PDF فقط");
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت");
                return;
            }

            setIdentityFile(file);

            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setIdentityFilePreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                setIdentityFilePreview("PDF");
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const supabase = createClient();
            const becomingHost = !originalIsHost && formData.is_host;

            // ── STEP 1: Identity document upload ────────────────────────────────
            let identityDocumentUrl: string | null = null;
            let verificationStatus = formData.verification_status || "unverified";

            if (formData.is_host && identityFile) {
                setUploading(true);
                try {
                    const fileExt = identityFile.name.split('.').pop();
                    const filePath = `${user.id}/${user.id}-${Date.now()}.${fileExt}`;
                    const bucketName = 'property-images';

                    const { error: uploadError } = await supabase.storage
                        .from(bucketName)
                        .upload(filePath, identityFile, { cacheControl: '3600', upsert: false });

                    if (uploadError) {
                        alert("فشل رفع الهوية: " + uploadError.message);
                        return;
                    }

                    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(filePath);
                    if (!publicUrl) {
                        alert("فشل في إنشاء رابط الهوية. يرجى المحاولة مرة أخرى.");
                        return;
                    }

                    identityDocumentUrl = publicUrl;
                    verificationStatus = "pending";
                } catch (uploadErr: any) {
                    alert("حدث خطأ أثناء رفع الهوية: " + uploadErr.message);
                    return;
                } finally {
                    setUploading(false);
                }
            }

            // ── STEP 2: POST to our API route (same-origin — no CORS preflight) ──
            // Direct Supabase writes from the browser hang because the network
            // blocks OPTIONS preflight for non-GET requests to external origins.
            // The API route at /api/profile/update calls Supabase server-side.
            const body: Record<string, unknown> = {
                full_name: formData.full_name,
                phone_number: formData.phone_number,
                is_host: formData.is_host,
                bank_details: formData.is_host ? formData.bank_details : null,
            }
            if (formData.is_host) {
                body.verification_status = verificationStatus
                if (identityDocumentUrl) body.identity_document_url = identityDocumentUrl
            }

            console.log('🔵 [PROFILE] Posting to /api/profile/update:', body)

            const res = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            const json = await res.json()

            if (!res.ok) {
                console.error('❌ [PROFILE] API error:', json)
                alert('خطأ في الحفظ: ' + (json.error ?? res.statusText) + (json.code ? '\n\nCode: ' + json.code : ''))
                return
            }

            console.log('✅ [PROFILE] API success:', json)
            const savedData = json.data

            // ── STEP 3: Sync local state ──────────────────────────────────────────
            setOriginalIsHost(formData.is_host);
            setIdentityFile(null);

            if (savedData) {
                setFormData(prev => ({
                    ...prev,
                    verification_status: savedData.verification_status || prev.verification_status,
                    is_identity_verified: savedData.is_identity_verified || prev.is_identity_verified,
                }));
                if (savedData.identity_document_url) {
                    setIdentityFilePreview(savedData.identity_document_url);
                }
            }

            alert("تم حفظ التغييرات بنجاح ✓");

            if (becomingHost) {
                setTimeout(() => { window.location.href = "/host/properties"; }, 1500);
            } else {
                window.dispatchEvent(new Event('profile-updated'));
            }

        } catch (error: any) {
            console.error('❌ [PROFILE] Unexpected error:', error);
            alert("حدث خطأ غير متوقع: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <Card className="overflow-hidden border-0 shadow-xl">
            {/* Decorative Header with Gradient */}
            <div className="relative bg-gradient-to-r from-[#0F766E] via-[#0D9488] to-[#E6D5B8] p-8 pb-12">
                {/* Decorative Icons */}
                <div className="absolute top-4 left-4 opacity-20">
                    <Palmtree className="h-16 w-16 text-white" />
                </div>
                <div className="absolute top-6 right-8 opacity-20">
                    <Sun className="h-12 w-12 text-white" />
                </div>
                <div className="absolute bottom-4 right-16 opacity-15">
                    <Home className="h-10 w-10 text-white" />
                </div>

                <CardHeader className="relative z-10 p-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-3xl text-white font-bold">بياناتي الشخصية</CardTitle>
                    </div>
                    <CardDescription className="text-white/90 text-base">
                        قم بتحديث معلوماتك وابدأ رحلتك في استضافة الضيوف
                    </CardDescription>
                </CardHeader>
            </div>

            <CardContent className="pt-8 pb-6 px-6 md:px-8">
                <form onSubmit={handleSave} className="space-y-8">
                    {/* Personal Information Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                <User className="h-4 w-4 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">المعلومات الأساسية</h3>
                        </div>

                        {/* Full Name Input with Icon */}
                        <div className="space-y-2">
                            <Label htmlFor="full_name" className="flex items-center gap-2 text-gray-700 font-medium">
                                <User className="h-4 w-4 text-gray-500" />
                                الاسم الكامل
                            </Label>
                            <div className="relative">
                                <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="text-right pr-4 pl-12 h-12 border-gray-300 focus:border-primary focus:ring-primary rounded-xl"
                                    placeholder="أدخل اسمك الكامل"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* WhatsApp Number Input - Self Verifying */}
                        <WhatsAppInput
                            value={formData.phone_number}
                            onChange={(value) => setFormData({ ...formData, phone_number: value })}
                            onValidationChange={setIsWhatsAppValid}
                            label="رقم الواتساب"
                            required={formData.is_host}
                        />
                    </div>

                    {/* Become a Host Section */}
                    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-secondary bg-gradient-to-br from-teal-50 via-[#F5F0E8] to-[#E6D5B8] p-6 transition-all hover:border-primary hover:shadow-md">
                        {/* Decorative Background Icons */}
                        <div className="absolute top-2 right-2 opacity-10">
                            <Gift className="h-20 w-20 text-secondary" />
                        </div>
                        <div className="absolute bottom-2 left-2 opacity-10">
                            <Sparkles className="h-16 w-16 text-orange-500" />
                        </div>

                        <div className="relative z-10 flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                                <input
                                    type="checkbox"
                                    id="is_host"
                                    checked={formData.is_host}
                                    onChange={(e) => setFormData({ ...formData, is_host: e.target.checked })}
                                    className="h-5 w-5 rounded border-primary text-primary focus:ring-primary cursor-pointer"
                                />
                            </div>
                            <div className="flex-1">
                                <Label htmlFor="is_host" className="cursor-pointer block">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Home className="h-5 w-5 text-primary" />
                                        <span className="text-lg font-bold text-gray-900">أريد أن أصبح مضيفاً</span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        ابدأ باستقبال الضيوف واكسب دخلاً إضافياً من منزلك
                                    </p>
                                </Label>
                            </div>
                            {formData.is_host && (
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-pulse">
                                        <CheckCircle2 className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {formData.is_host && (
                        <div className="space-y-8 border-t-2 border-gray-100 pt-8 mt-8">
                            {/* Bank Details Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg">
                                        <Wallet className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">بيانات الحساب المصرفي</h3>
                                        <p className="text-sm text-gray-500">لاستلام أرباحك من الحجوزات</p>
                                    </div>
                                </div>

                                {/* Bank Name */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-gray-700 font-medium">
                                        <Building2 className="h-4 w-4 text-gray-500" />
                                        اسم المصرف
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            name="bank_name"
                                            value={formData.bank_details.bank_name}
                                            onChange={handleBankChange}
                                            placeholder="مصرف الجمهورية"
                                            required={formData.is_host}
                                            className="text-right pr-4 pl-12 h-12 border-gray-300 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl"
                                        />
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                            <Building2 className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* IBAN */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-gray-700 font-medium">
                                        <CreditCard className="h-4 w-4 text-gray-500" />
                                        رقم الإيبان (IBAN) أو رقم الحساب
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            name="iban"
                                            value={formData.bank_details.iban}
                                            onChange={handleBankChange}
                                            required={formData.is_host}
                                            className="text-left pr-12 pl-4 h-12 border-gray-300 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl font-mono"
                                            dir="ltr"
                                            placeholder="LY00 0000 0000 0000 0000 0000"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <CreditCard className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Account Name */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-gray-700 font-medium">
                                        <User className="h-4 w-4 text-gray-500" />
                                        اسم صاحب الحساب (كما في المصرف)
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            name="account_name"
                                            value={formData.bank_details.account_name}
                                            onChange={handleBankChange}
                                            required={formData.is_host}
                                            className="text-right pr-4 pl-12 h-12 border-gray-300 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl"
                                            placeholder="الاسم الكامل"
                                        />
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Optional ID Upload Section - Tier 2 */}
                            <div className="relative overflow-hidden rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 shadow-sm">
                                {/* Decorative Background */}
                                <div className="absolute top-0 right-0 opacity-10">
                                    <Award className="h-32 w-32 text-green-600" />
                                </div>
                                <div className="absolute bottom-0 left-0 opacity-10">
                                    <ShieldCheck className="h-24 w-24 text-emerald-600" />
                                </div>

                                <div className="relative z-10 space-y-6">
                                    {/* Header */}
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
                                                <ShieldCheck className="h-6 w-6 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-xl font-bold text-gray-900">التوثيق بالهوية</h3>
                                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                                                    اختياري
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                ارفع هويتك الوطنية أو جواز السفر للحصول على شارة "موثق"
                                            </p>
                                        </div>
                                    </div>

                                    {/* Incentive Callout */}
                                    <div className="bg-white/60 backdrop-blur-sm border border-green-200 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow">
                                                    <TrendingUp className="h-5 w-5 text-white" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-green-900 mb-1 flex items-center gap-2">
                                                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                                    احصل على 50% حجوزات أكثر
                                                </h4>
                                                <p className="text-sm text-green-700">
                                                    المضيفون الموثقون يحصلون على ثقة أعلى وحجوزات أكثر من الضيوف
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* File Upload */}
                                    <div className="space-y-3">
                                        <Label htmlFor="identity_file" className="flex items-center gap-2 text-gray-700 font-medium">
                                            <Upload className="h-4 w-4 text-gray-500" />
                                            رفع الهوية الوطنية أو جواز السفر
                                        </Label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="identity_file"
                                                accept="image/jpeg,image/png,image/jpg,application/pdf"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="identity_file"
                                                className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed border-green-300 bg-white/50 rounded-2xl cursor-pointer hover:border-green-500 hover:bg-white/80 transition-all group"
                                            >
                                                {identityFilePreview ? (
                                                    <div className="text-center p-4">
                                                        {identityFilePreview === "PDF" ? (
                                                            <>
                                                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-3">
                                                                    <Upload className="h-8 w-8 text-white" />
                                                                </div>
                                                                <p className="text-sm font-semibold text-green-600">✓ تم رفع ملف PDF</p>
                                                                <p className="text-xs text-gray-500 mt-1">انقر لتغيير الملف</p>
                                                            </>
                                                        ) : (
                                                            <div className="relative">
                                                                <img
                                                                    src={identityFilePreview}
                                                                    alt="Preview"
                                                                    className="max-h-28 rounded-xl mx-auto shadow-md"
                                                                />
                                                                <p className="text-xs text-gray-500 mt-3">انقر لتغيير الصورة</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-center p-4">
                                                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-3 group-hover:from-green-100 group-hover:to-emerald-100 transition-all">
                                                            <Upload className="h-8 w-8 text-gray-400 group-hover:text-green-600 transition-colors" />
                                                        </div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">اضغط لرفع الملف</p>
                                                        <p className="text-xs text-gray-500">JPG, PNG أو PDF (حد أقصى 5MB)</p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <Sparkles className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-blue-700">
                                                سيتم مراجعة الهوية من قبل الإدارة خلال 24 ساعة للحصول على شارة التوثيق
                                            </p>
                                        </div>

                                        {/* Verification Status Badge */}
                                        {identityFilePreview && (
                                            <div className="mt-4">
                                                {formData.verification_status === "verified" && (
                                                    <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border-2 border-green-200 rounded-lg">
                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-green-900">✓ تم التوثيق</p>
                                                            <p className="text-xs text-green-700">هويتك موثقة بنجاح</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {formData.verification_status === "pending" && (
                                                    <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                                                        <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-yellow-900">⏳ قيد المراجعة</p>
                                                            <p className="text-xs text-yellow-700">جاري مراجعة هويتك من قبل الإدارة</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {formData.verification_status === "unverified" && identityFilePreview && (
                                                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
                                                        <ShieldCheck className="h-5 w-5 text-gray-400" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-700">لم يتم التوثيق بعد</p>
                                                            <p className="text-xs text-gray-500">سيتم مراجعة هويتك قريباً</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-6 space-y-4">
                        {/* Validation Message */}
                        {formData.phone_number && !isWhatsAppValid && (
                            <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <Phone className="h-5 w-5 text-yellow-600" />
                                <p className="text-sm text-yellow-800">
                                    يجب اختبار رقم الواتساب قبل الحفظ
                                </p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={saving || (!!formData.phone_number && !isWhatsAppValid)}
                            className="w-full h-14 text-lg font-bold bg-primary hover:bg-[#0D5F58] text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <div className="flex items-center justify-center gap-3">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>جاري الحفظ...</span>
                                </div>
                            ) : formData.phone_number && !isWhatsAppValid ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Phone className="h-5 w-5" />
                                    <span>اختبر رقم الواتساب أولاً</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <Sparkles className="h-5 w-5" />
                                    <span>حفظ التغييرات</span>
                                    <Sparkles className="h-5 w-5" />
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
