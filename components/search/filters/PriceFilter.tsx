"use client";

interface PriceFilterProps {
    minPrice: string;
    maxPrice: string;
    onMinChange: (v: string) => void;
    onMaxChange: (v: string) => void;
}

const PRESETS = [
    { label: "أقل من 200 د.ل",   min: "",    max: "200"  },
    { label: "200 — 500 د.ل",    min: "200", max: "500"  },
    { label: "500 — 1000 د.ل",   min: "500", max: "1000" },
    { label: "أكثر من 1000 د.ل", min: "1000", max: ""   },
];

export default function PriceFilter({ minPrice, maxPrice, onMinChange, onMaxChange }: PriceFilterProps) {
    return (
        <div className="space-y-4">
            {/* Quick presets */}
            <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p) => {
                    const isActive = p.min === minPrice && p.max === maxPrice;
                    return (
                        <button
                            key={p.label}
                            onClick={() => {
                                onMinChange(isActive ? "" : p.min);
                                onMaxChange(isActive ? "" : p.max);
                            }}
                            className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-right ${
                                isActive
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-400"
                            }`}
                        >
                            {p.label}
                        </button>
                    );
                })}
            </div>

            {/* Custom range */}
            <div className="pt-2">
                <p className="text-xs font-medium text-gray-500 mb-2">أو أدخل نطاقاً مخصصاً</p>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        placeholder="من"
                        value={minPrice}
                        onChange={(e) => onMinChange(e.target.value)}
                        className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-right"
                    />
                    <span className="text-gray-400">—</span>
                    <input
                        type="number"
                        placeholder="إلى"
                        value={maxPrice}
                        onChange={(e) => onMaxChange(e.target.value)}
                        className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-right"
                    />
                    <span className="text-xs text-gray-500 shrink-0">د.ل</span>
                </div>
            </div>
        </div>
    );
}
