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
}

const COMPRESSION_OPTIONS = {
    maxSizeMB: 0.5,          // cap at 500 KB
    maxWidthOrHeight: 1920,  // no dimension above 1920 px
    useWebWorker: true,      // non-blocking
};

export default function ImageUpload({ value, onChange, bucket }: ImageUploadProps) {
    const [status, setStatus] = useState<"idle" | "compressing" | "uploading">("idle");

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const supabase = createClient();
            const files = e.target.files;
            if (!files || files.length === 0) return;

            const newUrls: string[] = [];

            for (let i = 0; i < files.length; i++) {
                const original = files[i];

                // ── 1. Compress ──────────────────────────────────────────────
                setStatus("compressing");
                const compressed = await imageCompression(original, COMPRESSION_OPTIONS);

                // ── 2. Upload compressed file ────────────────────────────────
                setStatus("uploading");
                const fileExt = original.name.split(".").pop() ?? "jpg";
                const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(fileName, compressed);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
                if (data) newUrls.push(data.publicUrl);
            }

            onChange([...value, ...newUrls]);
        } catch (error: any) {
            alert("خطأ في رفع الصورة: " + error.message);
        } finally {
            setStatus("idle");
            // Reset input so the same file can be re-selected if needed
            e.target.value = "";
        }
    };

    const handleRemove = (url: string) => {
        onChange(value.filter((v) => v !== url));
    };

    const busy = status !== "idle";

    const statusLabel = {
        idle: "إضافة صور",
        compressing: "جاري ضغط الصور...",
        uploading: "جاري الرفع...",
    }[status];

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
                    disabled={busy}
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
                        <span className="text-xs text-muted-foreground">يتم تقليل حجم الصور قبل الرفع</span>
                    )}
                </Button>
                <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleUpload}
                    disabled={busy}
                />
            </div>
        </div>
    );
}
