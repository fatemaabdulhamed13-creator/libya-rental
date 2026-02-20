"use client";

import { Waves, Palmtree, Building2, Home } from "lucide-react";

const TYPES = [
    { id: "beachfront", label: "على البحر", icon: Waves     },
    { id: "istiraha",   label: "استراحة",   icon: Palmtree  },
    { id: "apartment",  label: "شقة",       icon: Building2 },
    { id: "villa",      label: "فيلا",      icon: Home      },
    { id: "chalet",     label: "شاليه",     icon: Waves     },
];

interface PropertyTypeFilterProps {
    value: string;
    onChange: (type: string) => void;
}

export default function PropertyTypeFilter({ value, onChange }: PropertyTypeFilterProps) {
    return (
        <div className="grid grid-cols-2 gap-2">
            {TYPES.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    onClick={() => onChange(id === value ? "" : id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        value === id
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-white border-gray-200 text-gray-700 hover:border-gray-400"
                    }`}
                >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{label}</span>
                </button>
            ))}
        </div>
    );
}
