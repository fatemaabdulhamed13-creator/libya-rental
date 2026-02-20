"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import FavoriteButton from "@/components/property/FavoriteButton";

interface PropertyCardProps {
    property: {
        id: string;
        title: string;
        city: string;
        price_per_night: number;
        images: string[];
        location_lat: number;
        location_lng: number;
    };
    isHovered?: boolean;
    onHover?: (id: string | null) => void;
    initialFavorited?: boolean;
}

export default function PropertyCard({ property, isHovered, onHover, initialFavorited = false }: PropertyCardProps) {
    return (
        <div
            className={`
                group block rounded-xl overflow-hidden transition-all duration-200
                ${isHovered ? 'ring-2 ring-primary shadow-xl scale-[1.02]' : 'md:hover:shadow-lg'}
            `}
            onMouseEnter={() => onHover?.(property.id)}
            onMouseLeave={() => onHover?.(null)}
        >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
                <Link href={`/properties/${property.id}`}>
                    {property.images?.[0] ? (
                        <Image
                            src={property.images[0]}
                            alt={property.title}
                            fill
                            className="object-cover md:group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <MapPin className="h-12 w-12 text-gray-400" />
                        </div>
                    )}
                </Link>

                {/* REAL Favorite Button */}
                <div
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full transition-colors"
                    onClick={(e) => e.stopPropagation()}
                >
                    <FavoriteButton
                        propertyId={property.id}
                        initialFavorited={initialFavorited}
                    />
                </div>
            </div>

            {/* Content */}
            <Link href={`/properties/${property.id}`} className="block p-4 bg-white">
                {/* City Badge */}
                <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                        <MapPin className="h-3 w-3" />
                        {property.city}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1 text-right">
                    {property.title}
                </h3>

                {/* Price */}
                <div className="flex items-baseline justify-end gap-1">
                    <span className="text-2xl font-bold text-secondary">
                        {property.price_per_night}
                    </span>
                    <span className="text-sm text-muted-foreground">د.ل / ليلة</span>
                </div>
            </Link>
        </div>
    );
}
