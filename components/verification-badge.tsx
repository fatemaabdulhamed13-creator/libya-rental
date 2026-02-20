"use client";

import { ShieldCheck } from "lucide-react";

interface VerificationBadgeProps {
    isIdentityVerified: boolean;
    size?: "sm" | "md" | "lg";
    showText?: boolean;
}

export default function VerificationBadge({
    isIdentityVerified,
    size = "md",
    showText = true
}: VerificationBadgeProps) {
    // Only show badge if identity is verified
    if (!isIdentityVerified) {
        return null;
    }

    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6"
    };

    const textSizeClasses = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base"
    };

    return (
        <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200">
            <ShieldCheck className={`${sizeClasses[size]} fill-current`} />
            {showText && (
                <span className={`font-medium ${textSizeClasses[size]} whitespace-nowrap`}>
                    هوية موثقة
                </span>
            )}
        </div>
    );
}
