import { getFavorites } from '@/app/actions/favorites';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import FavoriteButton from '@/components/property/FavoriteButton';
import Navbar from '@/components/navbar';

export default async function FavoritesPage() {
  // Check authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { properties } = await getFavorites();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">المفضلة</h1>

        {properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">لا توجد عقارات في المفضلة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property: any) => (
              <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden group">
                <div className="relative">
                  <Link href={`/properties/${property.id}`}>
                    <div className="relative h-64 w-full">
                      <Image
                        src={property.images?.[0] || '/images/placeholder.jpg'}
                        alt={property.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Link>
                  <div className="absolute top-2 right-2 bg-white rounded-full shadow-md">
                    <FavoriteButton propertyId={property.id} initialFavorited={true} />
                  </div>
                </div>

                <div className="p-4">
                  <Link href={`/properties/${property.id}`}>
                    <h3 className="font-semibold text-lg mb-2 hover:text-blue-600">
                      {property.title}
                    </h3>
                  </Link>
                  <p className="text-gray-600 text-sm mb-2">{property.city}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{property.price_per_night} د.ل</span>
                    <span className="text-sm text-gray-500">/ ليلة</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
