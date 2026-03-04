"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Home, Grid, ImageOff, X, ChevronLeft, ChevronRight } from "lucide-react";

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
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const validImages = images.filter(Boolean);
    const isLightboxOpen = lightboxIndex !== null;

    // Open lightbox at a specific index
    const openLightbox = (index: number) => {
        setLightboxIndex(index);
    };

    // Close lightbox
    const closeLightbox = useCallback(() => {
        setLightboxIndex(null);
    }, []);

    // Navigate to previous image
    const goPrev = useCallback(() => {
        setLightboxIndex((i) =>
            i !== null ? (i - 1 + validImages.length) % validImages.length : null
        );
    }, [validImages.length]);

    // Navigate to next image
    const goNext = useCallback(() => {
        setLightboxIndex((i) =>
            i !== null ? (i + 1) % validImages.length : null
        );
    }, [validImages.length]);

    // Keyboard navigation
    useEffect(() => {
        if (!isLightboxOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowLeft") goPrev();
            if (e.key === "ArrowRight") goNext();
        };

        document.addEventListener("keydown", handleKeyDown);
        // Prevent body scroll while lightbox is open
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isLightboxOpen, closeLightbox, goPrev, goNext]);

    return (
        <>
            {/* Bento Grid - 1 large + 4 small */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[300px] md:h-[450px] mb-10 rounded-2xl overflow-hidden relative">
                {/* Main Large Image */}
                <div
                    className="md:col-span-2 md:row-span-2 relative group cursor-pointer"
                    onClick={() => openLightbox(0)}
                >
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
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>

                {/* Secondary Images */}
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="relative group cursor-pointer hidden md:block"
                        onClick={() => openLightbox(i)}
                    >
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
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                ))}

                {/* Show All Photos Button */}
                {validImages.length > 5 && (
                    <button
                        onClick={() => openLightbox(0)}
                        className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-900 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Grid className="h-4 w-4" />
                        عرض كل الصور
                    </button>
                )}
            </div>

            {/* ─── Lightbox Modal ─── */}
            {isLightboxOpen && validImages.length > 0 && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={closeLightbox}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                        aria-label="إغلاق"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    {/* Image Counter */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-black/40 text-white text-sm font-medium">
                        {(lightboxIndex ?? 0) + 1} / {validImages.length}
                    </div>

                    {/* Previous Arrow */}
                    {validImages.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); goPrev(); }}
                            className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                            aria-label="السابق"
                        >
                            <ChevronLeft className="h-7 w-7" />
                        </button>
                    )}

                    {/* Main Image */}
                    <div
                        className="relative w-full max-w-5xl max-h-[85vh] mx-16 aspect-[4/3]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            key={lightboxIndex}
                            src={validImages[lightboxIndex ?? 0]}
                            alt={`${title} - ${(lightboxIndex ?? 0) + 1}`}
                            fill
                            priority
                            sizes="(max-width: 1280px) 90vw, 1024px"
                            className="object-contain"
                        />
                    </div>

                    {/* Next Arrow */}
                    {validImages.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); goNext(); }}
                            className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                            aria-label="التالي"
                        >
                            <ChevronRight className="h-7 w-7" />
                        </button>
                    )}

                    {/* Thumbnail Strip */}
                    {validImages.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 rounded-xl bg-black/40 overflow-x-auto max-w-[90vw]">
                            {validImages.map((src, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                                    className={`relative w-14 h-10 rounded-md overflow-hidden shrink-0 ring-2 transition-all ${i === lightboxIndex
                                            ? "ring-white opacity-100 scale-105"
                                            : "ring-transparent opacity-50 hover:opacity-80"
                                        }`}
                                    aria-label={`صورة ${i + 1}`}
                                >
                                    <Image
                                        src={src}
                                        alt={`thumbnail ${i + 1}`}
                                        fill
                                        sizes="56px"
                                        className="object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
