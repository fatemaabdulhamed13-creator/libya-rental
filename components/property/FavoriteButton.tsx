'use client';

import { Heart } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toggleFavorite } from '@/app/actions/favorites';

interface FavoriteButtonProps {
  propertyId: string;
  initialFavorited?: boolean;
}

export default function FavoriteButton({ propertyId, initialFavorited = false }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🖱️  Button clicked - Property:', propertyId);

    // Save current state in case we need to revert
    const previousState = isFavorited;

    // OPTIMISTIC UPDATE - Change immediately for instant feedback
    setIsFavorited(!isFavorited);

    startTransition(async () => {
      try {
        console.log('📤 Calling server action...');
        const result = await toggleFavorite(propertyId) as any;

        console.log('📥 Server response:', result);

        if (!result.success) {
          // REVERT on error
          console.error('🔴 Server action failed, reverting...');
          setIsFavorited(previousState);

          // Show error to user
          const errorMessage = result.error || 'Unknown error';
          if (result.requiresLogin) {
            alert('⚠️ يجب تسجيل الدخول أولاً لحفظ المفضلة');
          } else {
            alert(`⚠️ خطأ: ${errorMessage}`);
          }
          return;
        }

        // SUCCESS - Confirm the state matches server
        if (result.isFavorited !== undefined) {
          console.log('✅ Server confirmed:', result.isFavorited);
          // Update to match server (in case of race conditions)
          setIsFavorited(result.isFavorited);
        }

      } catch (error: any) {
        // REVERT on network error
        console.error('❌ Network error, reverting:', error);
        setIsFavorited(previousState);
        alert(`⚠️ خطأ في الاتصال: ${error.message}`);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="p-2 hover:scale-110 rounded-full transition-all disabled:opacity-50 disabled:cursor-wait"
      aria-label={isFavorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
      title={isFavorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
    >
      <Heart
        className={`w-6 h-6 transition-all duration-200 ${
          isPending
            ? 'animate-pulse'
            : ''
        } ${
          isFavorited
            ? 'fill-red-500 text-red-500'
            : 'text-gray-600 hover:text-red-500'
        }`}
      />
    </button>
  );
}
