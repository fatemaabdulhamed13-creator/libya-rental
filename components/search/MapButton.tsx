"use client";

import { Map, List } from "lucide-react";

interface MapButtonProps {
    showMap: boolean;
    onToggle: () => void;
}

export default function MapButton({ showMap, onToggle }: MapButtonProps) {
    return (
        <button
            onClick={onToggle}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gray-900 text-white rounded-full shadow-2xl flex items-center gap-2 font-medium hover:bg-gray-800 active:scale-95 transition-all"
        >
            {showMap ? <List className="h-5 w-5" /> : <Map className="h-5 w-5" />}
            {showMap ? "عرض القائمة" : "عرض الخريطة"}
        </button>
    );
}
