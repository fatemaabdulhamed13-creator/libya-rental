"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useState } from "react";

export default function PropertyCard({ property, children }: { property: any; children: React.ReactNode }) {
    const [isFavorite, setIsFavorite] = useState(false);

    return (
        <Link
            href={`/properties/${property.id}`}
            className="group block cursor-pointer active:scale-95 transition-transform"
        >
            {/* Image Container */}
            <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
                {children}
                {/* Heart Icon */}
                <button
                    className="absolute top-3 left-3 p-2 md:hover:scale-110 transition-transform z-10"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsFavorite(!isFavorite);
                    }}
                >
                    <Heart
                        className={`h-6 w-6 drop-shadow-lg transition-colors ${isFavorite
                            ? "fill-primary text-primary"
                            : "text-white md:hover:fill-primary md:hover:text-primary"
                            }`}
                    />
                </button>
            </div>
        </Link>
    );
}
