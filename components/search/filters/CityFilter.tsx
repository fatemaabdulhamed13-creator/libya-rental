"use client";

import { Check } from "lucide-react";

const CITIES = [
    "طرابلس",
    "بنغازي",
    "مصراتة",
    "الخمس",
    "الزاوية",
    "زليتن",
    "غريان",
    "البيضاء",
    "طبرق",
    "سبها",
    "صبراتة",
];

interface CityFilterProps {
    value: string;
    onChange: (city: string) => void;
}

export default function CityFilter({ value, onChange }: CityFilterProps) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {CITIES.map((city) => {
                const isSelected = value === city;
                return (
                    <button
                        key={city}
                        onClick={() => onChange(isSelected ? "" : city)}
                        className={`
                            flex items-center justify-between
                            p-4 rounded-xl border-2 text-right
                            transition-all active:scale-95
                            ${isSelected
                                ? "border-primary bg-primary/10 text-primary font-semibold"
                                : "border-gray-200 bg-white text-gray-700 hover:border-primary/40 hover:bg-gray-50"
                            }
                        `}
                    >
                        <span className="text-sm">{city}</span>
                        {isSelected && (
                            <Check className="h-5 w-5 shrink-0 text-primary" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
