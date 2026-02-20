"use client";

interface FilterDropdownProps {
    title?: string;
    children: React.ReactNode;
    onApply: () => void;
}

/**
 * Desktop-only panel that appears below the FilterChips row.
 * Visibility is controlled by the parent — this component is always visible when rendered.
 */
export default function FilterDropdown({ title, children, onApply }: FilterDropdownProps) {
    return (
        <div className="border-t border-gray-100 px-6 py-5 bg-white">
            {title && (
                <h4 className="text-sm font-semibold text-gray-700 mb-4">{title}</h4>
            )}
            {children}
            <button
                onClick={onApply}
                className="mt-5 w-full py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm"
            >
                تطبيق
            </button>
        </div>
    );
}
