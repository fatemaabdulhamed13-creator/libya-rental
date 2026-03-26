"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ImagePlus, X } from "lucide-react";
import imageCompression from "browser-image-compression";

interface ImageUploadProps {
    value: string[];
    onChange: (value: string[]) => void;
    bucket: string;
    /** Maximum number of photos allowed. Defaults to 15. */
    max?: number;
}

const COMPRESSION_OPTIONS = {
    maxSizeMB: 1,             // cap at 1 MB (post-compression)
    maxWidthOrHeight: 1920,   // no dimension above 1920 px
    useWebWorker: true,       // non-blocking — keeps UI responsive
    fileType: "image/webp",   // always output WebP
};

export default function ImageUpload({ value, onChange, bucket, max = 15 }: ImageUploadProps) {
    const [status, setStatus] = useState<"idle" | "compressing" | "uploading">("idle");
    const [progressIndex, setProgressIndex] = useState(0);
    const [progressTotal, setProgressTotal] = useState(0);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const supabase = createClient();
            const files = e.target.files;
            if (!files || files.length === 0) return;

            const remaining = max - value.length;
            if (remaining <= 0) {
                alert(`الحد الأقصى هو ${max} صورة. يرجى حذف صورة أولاً.`);
                return;
            }

            // Trim selection to however many slots are left
            const filesToProcess = Array.from(files).slice(0, remaining);
            if (files.length > remaining) {
                alert(`تم اختيار ${files.length} صور، لكن المساحة المتبقية ${remaining}. سيتم رفع الأولى فقط.`);
            }

            setProgressTotal(filesToProcess.length);
            const newUrls: string[] = [];

            for (let i = 0; i < filesToProcess.length; i++) {
                const original = filesToProcess[i];
                setProgressIndex(i + 1);

                // ── 1. Compress + convert to WebP ──────────────────────────────
                setStatus("compressing");
                const compressed = await imageCompression(original, COMPRESSION_OPTIONS);

                // ── 2. Upload with .webp extension ─────────────────────────────
                setStatus("uploading");
                const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(fileName, compressed, { contentType: "image/webp", upsert: false });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
                if (data) newUrls.push(data.publicUrl);
            }

            onChange([...value, ...newUrls]);
        } catch (error: any) {
            alert("خطأ في رفع الصورة: " + error.message);
        } finally {
            setStatus("idle");
            setProgressIndex(0);
            setProgressTotal(0);
            e.target.value = "";
        }
    };

    const handleRemove = (url: string) => {
        onChange(value.filter((v) => v !== url));
    };

    const busy = status !== "idle";
    const atLimit = value.length >= max;

    const statusLabel = busy
        ? status === "compressing"
            ? `ضغط الصورة ${progressIndex} من ${progressTotal}...`
            : `رفع الصورة ${progressIndex} من ${progressTotal}...`
        : atLimit
            ? `اكتمل الحد (${max} صورة)`
            : `إضافة صور (${value.length} / ${max})`;

    return (
        <div className="space-y-4">
            {/* Thumbnail grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {value.map((url) => (
                    <div key={url} className="relative aspect-video rounded-md overflow-hidden border">
                        <div className="absolute top-2 right-2 z-10">
                            <Button
                                type="button"
                                onClick={() => handleRemove(url)}
                                variant="destructive"
                                size="icon"
                                className="h-6 w-6"
                                disabled={busy}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <img
                            src={url}
                            alt="Property"
                            className="object-cover w-full h-full"
                        />
                    </div>
                ))}
            </div>

            {/* Upload button */}
            <div className="flex items-center gap-4">
                <Button
                    type="button"
                    disabled={busy || atLimit}
                    variant="secondary"
                    className="w-full h-32 border-dashed border-2 flex flex-col gap-2"
                    onClick={() => document.getElementById("image-upload")?.click()}
                >
                    {busy ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                        <ImagePlus className="h-6 w-6" />
                    )}
                    <span className="text-sm">{statusLabel}</span>
                    {status === "compressing" && (
                        <span className="text-xs text-muted-foreground">يتم تحويل الصور إلى WebP وضغطها قبل الرفع</span>
                    )}
                    {atLimit && !busy && (
                        <span className="text-xs text-muted-foreground">احذف صورة لإضافة أخرى</span>
                    )}
                </Button>
                <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleUpload}
                    disabled={busy || atLimit}
                />
            </div>
        </div>
    );
}
