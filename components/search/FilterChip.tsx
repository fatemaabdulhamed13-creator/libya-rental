"use client";

import { X, ChevronDown } from "lucide-react";

interface FilterChipProps {
    label: string;
    isActive?: boolean;
    isOpen?: boolean;
    onClick: () => void;
    onClear?: (e: React.MouseEvent) => void;
}

export default function FilterChip({ label, isActive, isOpen, onClick, onClear }: FilterChipProps) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border-2
                whitespace-nowrap transition-all shrink-0 active:scale-95
                ${isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : isOpen
                    ? "border-gray-400 bg-gray-100 text-gray-900"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }
            `}
        >
            <span>{label}</span>

            {isActive && onClear ? (
                /* X to clear the filter — stopPropagation prevents chip from re-opening */
                <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); onClear(e); }}
                    className="flex-shrink-0 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                >
                    <X className="h-3.5 w-3.5" />
                </span>
            ) : (
                <ChevronDown
                    className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            )}
        </button>
    );
}
