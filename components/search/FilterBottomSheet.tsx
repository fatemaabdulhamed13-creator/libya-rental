"use client";

import { X } from "lucide-react";

interface FilterBottomSheetProps {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    onApply: () => void;
}

export default function FilterBottomSheet({ title, children, onClose, onApply }: FilterBottomSheetProps) {
    return (
        <>
            {/* Backdrop — click to close */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
                onClick={onClose}
            />

            {/* Sheet — above backdrop */}
            <div
                className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl z-[60] max-h-[88vh] flex flex-col lg:hidden"
                dir="rtl"
            >
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-gray-300" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <button
                        onClick={onClose}
                        className="p-2 -m-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="إغلاق"
                    >
                        <X className="h-6 w-6 text-gray-600" />
                    </button>
                    <h3 className="font-semibold text-base text-gray-900">{title}</h3>
                    {/* Spacer to visually center title */}
                    <div className="w-10" />
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 pb-6">
                    {children}
                </div>

                {/* Sticky apply button */}
                <div className="px-6 pb-10 pt-4 border-t border-gray-100 bg-white">
                    <button
                        onClick={onApply}
                        className="w-full py-4 bg-primary text-white font-bold text-base rounded-2xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                    >
                        تطبيق
                    </button>
                </div>
            </div>
        </>
    );
}
