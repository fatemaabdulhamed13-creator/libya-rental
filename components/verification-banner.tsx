"use client";

import Link from "next/link";
import { ShieldAlert, Upload, TrendingUp } from "lucide-react";

interface VerificationBannerProps {
    isIdentityVerified: boolean;
}

export default function VerificationBanner({ isIdentityVerified }: VerificationBannerProps) {
    // Only show banner if NOT verified
    if (isIdentityVerified) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-teal-50 via-[#F5F0E8] to-[#E6D5B8] border-2 border-primary/20 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <ShieldAlert className="h-6 w-6 text-white" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                        احصل على التوثيق لتتميز عن المنافسين
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 md:mb-0">
                        المضيفون الموثقون يحصلون على <span className="font-bold text-orange-600">50% حجوزات أكثر</span> ويبنون ثقة أكبر مع الضيوف
                    </p>
                </div>

                {/* CTA Button */}
                <Link href="/profile?tab=verification">
                    <button className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all 
                        bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 
                        hover:from-amber-600 hover:via-orange-600 hover:to-orange-700
                        shadow-md hover:shadow-lg hover:scale-[1.02]">
                        <Upload className="h-4 w-4" />
                        <span>ارفع هويتك الآن</span>
                    </button>
                </Link>
            </div>

            {/* Stats Row */}
            <div className="mt-4 pt-4 border-t border-amber-200 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    <span>زيادة في معدل الحجز</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                    <ShieldAlert className="h-4 w-4 text-orange-500" />
                    <span>ثقة أعلى من الضيوف</span>
                </div>
            </div>
        </div>
    );
}
