"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Home } from "lucide-react";
import FavoriteButton from "./property/FavoriteButton";
import { useSearchParams } from "next/navigation";

interface HomePropertyCardProps {
  property: any;
  initialFavorited: boolean;
}

export default function HomePropertyCard({ property, initialFavorited }: HomePropertyCardProps) {
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const href = `/properties/${property.id}${qs ? `?${qs}` : ""}`;

  return (
    <div className="flex-shrink-0 w-[75vw] md:w-72 group active:scale-95 transition-transform">
      {/* Image */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-muted">
        <Link href={href}>
          {property.images?.[0] ? (
            <Image
              src={property.images[0]}
              alt={property.title}
              fill
              className="object-cover md:group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Home className="h-12 w-12 text-muted-foreground" />
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

      {/* Info */}
      <Link href={href}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
              <MapPin className="h-3 w-3" />
              {property.city}
            </span>
          </div>
          <h3 className="font-semibold text-foreground line-clamp-1 text-right">
            {property.title}
          </h3>
          <p className="text-muted-foreground text-sm">{property.max_guests} ضيوف</p>
          <p className="pt-1">
            <span className="font-bold text-secondary">{property.price_per_night} د.ل</span>
            <span className="text-muted-foreground text-sm"> / ليلة</span>
          </p>
        </div>
      </Link>
    </div>
  );
}
