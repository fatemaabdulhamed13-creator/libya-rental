"use client";

import { useState } from "react";
import Image from "next/image";
import { Home, Grid, ImageOff } from "lucide-react";

interface PropertyGalleryProps {
    images: string[];
    title: string;
}

function Placeholder({ size = "lg" }: { size?: "lg" | "sm" }) {
    return (
        <div className="w-full h-full bg-gradient-to-br from-primary/5 via-gray-50 to-accent/5 flex flex-col items-center justify-center gap-2">
            {size === "lg" ? (
                <>
                    <Home className="h-14 w-14 text-gray-300" />
                    <span className="text-sm text-gray-400">لا توجد صور</span>
                </>
            ) : (
                <ImageOff className="h-6 w-6 text-gray-300" />
            )}
        </div>
    );
}

export default function PropertyGallery({ images, title }: PropertyGalleryProps) {
    const [showAll, setShowAll] = useState(false);
    const validImages = images.filter(Boolean);

    return (
        <>
            {/* Bento Grid - 1 large + 4 small */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[300px] md:h-[450px] mb-10 rounded-2xl overflow-hidden relative">
                {/* Main Large Image */}
                <div className="md:col-span-2 md:row-span-2 relative group cursor-pointer">
                    {validImages[0] ? (
                        <Image
                            src={validImages[0]}
                            alt={title}
                            fill
                            priority
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                    ) : (
                        <Placeholder size="lg" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>

                {/* Secondary Images */}
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="relative group cursor-pointer hidden md:block">
                        {validImages[i] ? (
                            <Image
                                src={validImages[i]}
                                alt={`${title} - ${i + 1}`}
                                fill
                                sizes="25vw"
                                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            />
                        ) : (
                            <Placeholder size="sm" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    </div>
                ))}

                {/* Show All Photos Button */}
                {validImages.length > 5 && (
                    <button
                        onClick={() => setShowAll(true)}
                        className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-900 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Grid className="h-4 w-4" />
                        عرض كل الصور
                    </button>
                )}
            </div>

            {/* Full Gallery Modal */}
            {showAll && (
                <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                        <button
                            onClick={() => setShowAll(false)}
                            className="text-sm font-medium hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                        >
                            ✕ إغلاق
                        </button>
                        <span className="text-sm text-gray-500">{validImages.length} صور</span>
                    </div>
                    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
                        {validImages.map((src, i) => (
                            <div key={i} className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
                                <Image
                                    src={src}
                                    alt={`${title} - ${i + 1}`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 768px"
                                    className="object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
