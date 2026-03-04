import Navbar from "@/components/navbar";
import CategoryBar from "@/components/category-bar";
import HeroSearchButton from "@/components/hero-search";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { MapPin, Home } from "lucide-react";
import Image from "next/image";
import { getFavoritedPropertyIds } from "@/app/actions/favorites";
import HomePropertyCard from "@/components/HomePropertyCard";

// Configurable city images - easy to update
const CITIES = [
  {
    label: 'طرابلس',
    img: '/images/tripoli.jpg',   // <--- Path matches "images" folder
    description: 'العاصمة وعروس البحر'
  },
  {
    label: 'بنغازي',
    img: '/images/benghazi.jpg',
    description: 'الأصالة والتاريخ'
  },
  {
    label: 'مصراتة',
    img: '/images/misrata.jpg',
    description: 'رمال الذهب والتجارة'
  },
  {
    label: 'الخمس',
    img: '/images/khoms.jpg',
    description: 'الآثار والشواطئ الخلابة'
  }
];


export const revalidate = 300; // re-validate every 5 minutes

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  // Build the family section query, honouring the category-bar filter
  let familyQuery = supabase
    .from("properties")
    .select("*")
    .eq("status", "approved")
    .eq("family_friendly", true)
    .order("created_at", { ascending: false })
    .limit(6);
  if (category) familyQuery = familyQuery.eq("category", category);

  const [weekendResult, familyResult, favoritedIds] = await Promise.all([
    // Weekend section: RPC returns properties with ≥1 free Thu/Fri/Sat in the next 30 days
    // Cast to any: this function is not in the auto-generated Supabase types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc("get_weekend_available_properties", {
      p_limit: 6,
      p_category: category ?? null,
    }),

    // Family section: properties explicitly flagged as family-friendly
    familyQuery,

    getFavoritedPropertyIds(),
  ]);

  const weekendProperties = weekendResult.data || [];
  const familyProperties = familyResult.data || [];

  return (
    <main className="min-h-screen bg-white" dir="rtl">
      <Navbar />
      <CategoryBar />

      {/* Hero Section */}
      <div className="relative min-h-[60vh] md:min-h-[550px] flex items-center">

        {/* Hero background image */}
        <Image
          src="/images/hero-bg.webp"
          alt="Libya"
          fill
          priority
          className="object-cover object-center"
        />

        {/* Dark overlay — keep this even with a real photo for text legibility */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="relative z-10 w-full py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-md">
                اكتشف
                <span className="text-secondary"> أجمل </span>
                الإقامات في ليبيا
              </h1>
              <p className="text-lg md:text-xl text-white/80 drop-shadow-sm">
                من شواطئ طرابلس إلى جبال نالوت، استمتع بإقامة مميزة مع ليبيا رنتل
              </p>

              {/* Hero Search Button - Opens Modal */}
              <HeroSearchButton />
            </div>
          </div>
        </div>
      </div>

      {/* Explore by City Section */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">استكشف حسب المدينة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CITIES.map((city) => (
            <Link
              key={city.label}
              href={`/search?city=${city.label}`}
              className="group relative aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-xl active:scale-95 transition-all"
            >
              <Image
                src={city.img}
                alt={city.label}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 right-4 text-white">
                <h3 className="text-xl font-bold">{city.label}</h3>
                <p className="text-sm text-white/80">{city.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Weekend Getaways Section */}
      {weekendProperties.length > 0 && (
        <section className="py-12">
          {/* Header stays container-constrained */}
          <div className="container mx-auto px-4 md:px-6 lg:px-8 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">عطلة نهاية الأسبوع</h2>
              <Link href="/search?weekend=true" className="text-primary hover:underline font-medium">
                عرض الكل
              </Link>
            </div>
          </div>
          {/* Full-bleed carousel — first card aligns with header text via matching pl */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-6 pb-4 pl-4 md:pl-6 lg:pl-8 pr-4">
              {weekendProperties.map((property: any) => (
                <HomePropertyCard
                  key={property.id}
                  property={property}
                  initialFavorited={favoritedIds.has(property.id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Perfect for Families Section */}
      {familyProperties.length > 0 && (
        <section className="py-12">
          {/* Header stays container-constrained */}
          <div className="container mx-auto px-4 md:px-6 lg:px-8 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">مثالية للعائلات</h2>
              <Link href="/search?families=true" className="text-primary hover:underline font-medium">
                عرض الكل
              </Link>
            </div>
          </div>
          {/* Full-bleed carousel */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-6 pb-4 pl-4 md:pl-6 lg:pl-8 pr-4">
              {familyProperties.map((property: any) => (
                <HomePropertyCard
                  key={property.id}
                  property={property}
                  initialFavorited={favoritedIds.has(property.id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Host CTA Section */}
      <section className="bg-gradient-to-r from-teal-50 to-[#F5F0E8] py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-right space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                شارك مكانك واكسب
              </h2>
              <p className="text-lg text-gray-600">
                انضم إلى آلاف المضيفين الذين يحققون دخلاً إضافياً من خلال استضافة الضيوف
              </p>
              <Link href="/host/properties/new">
                <button className="mt-4 px-8 py-4 rounded-xl font-semibold text-white text-base transition-all 
                                                    bg-accent hover:bg-[#EA580C]
                                                    shadow-lg hover:shadow-xl">
                  ابدأ الاستضافة
                </button>
              </Link>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-2">٥٠٠+</div>
                  <div className="text-gray-600 text-sm">مضيف نشط</div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-2">٢٠٠٠+</div>
                  <div className="text-gray-600 text-sm">حجز ناجح</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2024 ليبيا رنتل - جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
