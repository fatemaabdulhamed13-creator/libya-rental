import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, MessageCircle } from "lucide-react";

const YEAR = new Date().getFullYear();

export default function Footer() {
    return (
        <footer className="bg-[#163333] border-t-4 border-[#e09b53]" dir="rtl">
            <div className="container mx-auto px-6 lg:px-20 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                    {/* ── Col 1: Brand ─────────────────────────────────────── */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-white rounded-xl p-1 inline-flex">
                                <Image
                                    src="/brand-logo-v1.png"
                                    alt="Libya Rental Logo"
                                    width={40}
                                    height={40}
                                    className="object-contain"
                                />
                            </div>
                            <span className="text-lg font-bold text-white">ليبيا رنتل</span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            بوابتك لأفضل الاستراحات والعقارات في ليبيا
                        </p>
                    </div>

                    {/* ── Col 2: Explore ───────────────────────────────────── */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">استكشف</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/" className="hover:text-yellow-500 transition-colors">الرئيسية</Link></li>
                            <li><Link href="/search" className="hover:text-yellow-500 transition-colors">البحث</Link></li>
                            <li><Link href="/host/properties/new" className="hover:text-yellow-500 transition-colors">أضف عقارك</Link></li>
                            <li><Link href="/favorites" className="hover:text-yellow-500 transition-colors">المفضلة</Link></li>
                        </ul>
                    </div>

                    {/* ── Col 3: Support ───────────────────────────────────── */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">الدعم</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/contact" className="hover:text-yellow-500 transition-colors">اتصل بنا</Link></li>
                            <li><Link href="/terms" className="hover:text-yellow-500 transition-colors">الشروط والأحكام</Link></li>
                            <li><Link href="/privacy" className="hover:text-yellow-500 transition-colors">سياسة الخصوصية</Link></li>
                        </ul>
                    </div>

                    {/* ── Col 4: Socials ───────────────────────────────────── */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">تواصل معنا</h3>
                        <div className="flex items-center gap-3">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                                aria-label="Instagram"
                                className="p-2 rounded-lg bg-slate-800 text-gray-400 hover:text-yellow-500 hover:bg-slate-700 transition-all">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                                aria-label="Facebook"
                                className="p-2 rounded-lg bg-[#1e4040] text-gray-400 hover:text-yellow-500 hover:bg-[#245050] transition-all">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="https://wa.me" target="_blank" rel="noopener noreferrer"
                                aria-label="WhatsApp"
                                className="p-2 rounded-lg bg-[#1e4040] text-gray-400 hover:text-yellow-500 hover:bg-[#245050] transition-all">
                                <MessageCircle className="h-5 w-5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* ── Copyright bar ────────────────────────────────────────── */}
                <div className="border-t border-[#2a5050] mt-10 pt-6 text-center">
                    <p className="text-xs text-gray-500">
                        © {YEAR} ليبيا رنتل. جميع الحقوق محفوظة.
                    </p>
                </div>
            </div>
        </footer>
    );
}
