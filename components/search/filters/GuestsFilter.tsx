"use client";

import { Minus, Plus } from "lucide-react";

interface GuestsFilterProps {
    value: string;
    onChange: (guests: string) => void;
}

export default function GuestsFilter({ value, onChange }: GuestsFilterProps) {
    const count = parseInt(value) || 0;

    function decrement() {
        if (count <= 1) onChange("");
        else onChange(String(count - 1));
    }

    function increment() {
        onChange(String(count + 1));
    }

    return (
        <div className="flex items-center justify-between py-3">
            <div>
                <p className="font-medium text-gray-900 text-sm">عدد الضيوف</p>
                <p className="text-xs text-gray-500 mt-0.5">
                    {count === 0 ? "أي عدد" : `${count}+ ضيف`}
                </p>
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={decrement}
                    disabled={count === 0}
                    className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center
                               hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <Minus className="h-4 w-4" />
                </button>
                <span className="w-5 text-center font-semibold text-gray-900 text-lg select-none">
                    {count || "·"}
                </span>
                <button
                    onClick={increment}
                    className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center
                               hover:border-gray-500 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
