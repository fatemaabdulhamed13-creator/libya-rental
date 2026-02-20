"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ImagePlus, X } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
    value: string[];
    onChange: (value: string[]) => void;
    bucket: string;
}

export default function ImageUpload({ value, onChange, bucket }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const supabase = createClient();
            const files = e.target.files;
            if (!files || files.length === 0) return;

            const newUrls: string[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, file);

                if (uploadError) {
                    throw uploadError;
                }

                const { data } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(filePath);

                if (data) {
                    newUrls.push(data.publicUrl);
                }
            }

            onChange([...value, ...newUrls]);
        } catch (error: any) {
            alert("Error uploading image: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = (url: string) => {
        onChange(value.filter((val) => val !== url));
    };

    return (
        <div className="space-y-4">
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
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <img // Using img tag for simplicity with external URLs, or configure next/image domains
                            src={url}
                            alt="Property"
                            className="object-cover w-full h-full"
                        />
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-4">
                <Button
                    type="button"
                    disabled={uploading}
                    variant="secondary"
                    className="w-full h-32 border-dashed border-2 flex flex-col gap-2"
                    onClick={() => document.getElementById("image-upload")?.click()}
                >
                    {uploading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                        <ImagePlus className="h-6 w-6" />
                    )}
                    <span>{uploading ? "جاري الرفع..." : "إضافة صور"}</span>
                </Button>
                <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                />
            </div>
        </div>
    );
}
