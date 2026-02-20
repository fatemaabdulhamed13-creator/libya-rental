"use client";

import { Check } from "lucide-react";

interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
    id?: string;
}

export default function Checkbox({ checked, onChange, label, description, id }: CheckboxProps) {
    return (
        <div
            className="flex items-center justify-between p-6 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-teal-50 to-[#F5F0E8] cursor-pointer"
            onClick={() => onChange(!checked)}
        >
            <div className="text-right flex-1">
                <label htmlFor={id} className="text-lg font-bold text-gray-900 cursor-pointer">
                    {label}
                </label>
                {description && (
                    <p className="text-sm text-gray-600 mt-1">
                        {description}
                    </p>
                )}
            </div>
            <div
                className={`
                    w-6 h-6 rounded border-2 flex items-center justify-center transition-all
                    ${checked
                        ? 'bg-[#134e4a] border-[#134e4a]'
                        : 'bg-white border-neutral-300'
                    }
                `}
            >
                {checked && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
            </div>
        </div>
    );
}
