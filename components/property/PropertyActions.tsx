"use client";

import { useState } from "react";
import { Share, Check } from "lucide-react";
import FavoriteButton from "./FavoriteButton";

interface PropertyActionsProps {
  propertyId: string;
  initialFavorited?: boolean;
}

export default function PropertyActions({ propertyId, initialFavorited = false }: PropertyActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-green-600">تم النسخ</span>
          </>
        ) : (
          <>
            <Share className="h-4 w-4" />
            <span>مشاركة</span>
          </>
        )}
      </button>

      {/* REAL FavoriteButton that calls server action */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
        <FavoriteButton propertyId={propertyId} initialFavorited={initialFavorited} />
        <span className="text-sm font-medium">حفظ</span>
      </div>
    </div>
  );
}
