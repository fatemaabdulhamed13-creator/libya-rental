'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Toggle favorite with optimistic UI support
 * Set DEBUG_FAVORITES=true in .env.local for detailed logs
 */
export async function toggleFavorite(propertyId: string) {
  const DEBUG = process.env.NEXT_PUBLIC_DEBUG_FAVORITES === 'true';

  if (DEBUG) {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   TOGGLE FAVORITE - DEBUG MODE         ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('📌 Property ID (received):', propertyId);
    console.log('📌 Property ID Type:', typeof propertyId);
  }

  // STEP 1: VALIDATE INPUT
  if (!propertyId) {
    const error = 'Property ID is null/undefined';
    if (DEBUG) console.error('❌ VALIDATION FAILED:', error);
    throw new Error(error);
  }

  if (typeof propertyId !== 'string') {
    const error = `Property ID must be string, got ${typeof propertyId}`;
    if (DEBUG) console.error('❌ VALIDATION FAILED:', error);
    throw new Error(error);
  }

  // Check if it's a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(propertyId)) {
    const error = `Property ID is not a valid UUID: "${propertyId}"`;
    if (DEBUG) console.error('❌ VALIDATION FAILED:', error);
    throw new Error(error);
  }

  if (DEBUG) console.log('✅ Input validation passed');

  // STEP 2: CREATE SUPABASE CLIENT
  if (DEBUG) console.log('\n📡 STEP 2: Creating Supabase client...');
  const supabase = await createClient();
  if (DEBUG) console.log('✅ Supabase client created');

  // STEP 3: GET AUTHENTICATED USER
  if (DEBUG) console.log('\n🔐 STEP 3: Getting authenticated user...');
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    if (DEBUG) {
      console.error('❌ AUTH ERROR:');
      console.error('   Message:', authError.message);
      console.error('   Name:', authError.name);
      console.error('   Status:', authError.status);
    }
    throw new Error(`Authentication failed: ${authError.message}`);
  }

  if (!authData) {
    if (DEBUG) console.error('❌ AUTH DATA IS NULL');
    throw new Error('Authentication returned null data');
  }

  if (!authData.user) {
    if (DEBUG) console.error('❌ USER IS NULL - Not authenticated');
    throw new Error('User not authenticated - please log in first');
  }

  const userId = authData.user.id;
  if (DEBUG) {
    console.log('✅ User authenticated');
    console.log('   User ID:', userId);
    console.log('   Email:', authData.user.email);
  }

  // STEP 4: CHECK IF FAVORITE EXISTS
  if (DEBUG) {
    console.log('\n🔍 STEP 4: Checking if favorite exists...');
    console.log('   Query: SELECT id FROM favorites');
    console.log('   WHERE user_id =', userId);
    console.log('   AND property_id =', propertyId);
  }

  const { data: existingData, error: selectError } = await (supabase as any)
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('property_id', propertyId)
    .maybeSingle();

  if (selectError) {
    if (DEBUG) {
      console.error('❌ SELECT ERROR:');
      console.error('   Code:', selectError.code);
      console.error('   Message:', selectError.message);
      console.error('   Details:', selectError.details);
      console.error('   Hint:', selectError.hint);
    }
    throw new Error(`Database SELECT failed: ${selectError.message}`);
  }

  const exists = !!existingData;
  if (DEBUG) {
    console.log('✅ Query completed');
    console.log('   Result:', exists ? 'FAVORITE EXISTS' : 'FAVORITE DOES NOT EXIST');
    if (existingData) {
      console.log('   Existing favorite ID:', existingData.id);
    }
  }

  // STEP 5: TOGGLE FAVORITE
  if (exists) {
    // DELETE FAVORITE
    if (DEBUG) {
      console.log('\n🗑️  STEP 5: DELETING FAVORITE...');
      console.log('   DELETE FROM favorites');
      console.log('   WHERE user_id =', userId);
      console.log('   AND property_id =', propertyId);
    }

    const { data: deleteData, error: deleteError } = await (supabase as any)
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('property_id', propertyId)
      .select(); // Force return value

    if (deleteError) {
      console.error('❌ DELETE ERROR:');
      console.error('   Code:', deleteError.code);
      console.error('   Message:', deleteError.message);
      console.error('   Details:', deleteError.details);
      console.error('   Hint:', deleteError.hint);
      throw new Error(`Database DELETE failed: ${deleteError.message}`);
    }

    console.log('✅ DELETE query executed');
    console.log('   Deleted rows:', deleteData);

    if (!deleteData || deleteData.length === 0) {
      console.warn('⚠️  WARNING: DELETE returned no data');
      console.warn('   This might mean the row was already deleted');
    }

    console.log('✅✅✅ FAVORITE REMOVED SUCCESSFULLY');
    revalidatePath('/favorites');
    return { success: true, isFavorited: false };

  } else {
    // ═══════════════════════════════════════
    // INSERT FAVORITE
    // ═══════════════════════════════════════
    console.log('\n➕ STEP 5: INSERTING FAVORITE...');

    const insertPayload = {
      user_id: userId,
      property_id: propertyId
    };

    console.log('   INSERT INTO favorites');
    console.log('   Payload:', JSON.stringify(insertPayload, null, 2));
    console.log('   user_id type:', typeof userId);
    console.log('   property_id type:', typeof propertyId);

    // THIS IS THE CRITICAL LINE - Forces Supabase to return the inserted row
    const { data: insertData, error: insertError } = await (supabase as any)
      .from('favorites')
      .insert(insertPayload)
      .select(); // ← CRITICAL: Forces return value

    console.log('\n📥 INSERT RESPONSE:');
    console.log('   Error:', insertError);
    console.log('   Data:', insertData);

    // ═══════════════════════════════════════
    // ERROR HANDLING
    // ═══════════════════════════════════════
    if (insertError) {
      console.error('\n❌❌❌ INSERT ERROR DETECTED ❌❌❌');
      console.error('   Code:', insertError.code);
      console.error('   Message:', insertError.message);
      console.error('   Details:', insertError.details);
      console.error('   Hint:', insertError.hint);

      // Check for specific error codes
      if (insertError.code === '23505') {
        console.error('   ⚠️  DUPLICATE KEY ERROR - Favorite already exists');
        throw new Error('Favorite already exists (database constraint violation)');
      }

      if (insertError.code === '42501') {
        console.error('   ⚠️  PERMISSION DENIED - RLS is blocking the insert');
        console.error('   💡 Check Supabase Dashboard → Table Editor → favorites → RLS Policies');
        throw new Error('Permission denied - Row Level Security is blocking this insert. Check your RLS policies.');
      }

      if (insertError.code === '23503') {
        console.error('   ⚠️  FOREIGN KEY VIOLATION - property_id does not exist');
        throw new Error(`Property with ID "${propertyId}" does not exist in the properties table`);
      }

      throw new Error(`Database INSERT failed: ${insertError.message} (Code: ${insertError.code})`);
    }

    // ═══════════════════════════════════════
    // DATA VALIDATION
    // ═══════════════════════════════════════
    console.log('\n🔍 VALIDATING INSERT RESULT...');

    if (!insertData) {
      console.error('❌❌❌ INSERT DATA IS NULL ❌❌❌');
      console.error('   The query returned no error BUT also no data');
      console.error('   This usually means RLS is silently blocking the insert');
      console.error('   💡 Check: Supabase → Authentication → Policies → favorites table');
      throw new Error('Insert appeared to succeed but returned no data - Row Level Security is likely blocking the insert');
    }

    if (Array.isArray(insertData) && insertData.length === 0) {
      console.error('❌❌❌ INSERT DATA IS EMPTY ARRAY ❌❌❌');
      console.error('   The query returned an empty array');
      console.error('   This usually means RLS is silently blocking the insert');
      throw new Error('Insert appeared to succeed but returned empty array - Row Level Security is likely blocking the insert');
    }

    console.log('✅ Insert data validation passed');
    console.log('   Inserted row:', JSON.stringify(insertData, null, 2));

    console.log('\n✅✅✅ FAVORITE ADDED SUCCESSFULLY');
    revalidatePath('/favorites');
    return { success: true, isFavorited: true };
  }
}

/**
 * Get all favorites for current user
 */
export async function getFavorites() {
  console.log('\n📋 GET FAVORITES LIST');

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    console.log('⚠️  No authenticated user');
    return { properties: [] };
  }

  console.log('✅ Fetching favorites for user:', authData.user.id);

  const { data, error } = await (supabase as any)
    .from('favorites')
    .select(`
      property_id,
      properties (
        id,
        title,
        city,
        price_per_night,
        images,
        location_lat,
        location_lng
      )
    `)
    .eq('user_id', authData.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ GET FAVORITES ERROR:', error);
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    console.error('   Details:', error.details);
    console.error('   Hint:', error.hint);
    return { properties: [] };
  }

  console.log('✅ Query successful');
  console.log('   Raw data:', JSON.stringify(data, null, 2));
  console.log('   Data count:', data?.length || 0);

  const properties = data?.map((f: any) => f.properties).filter(Boolean) || [];
  console.log('✅ Found', properties.length, 'favorites');
  console.log('   Properties:', JSON.stringify(properties, null, 2));
  return { properties };
}

/**
 * Check if a property is favorited
 */
export async function isFavorited(propertyId: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) return false;

  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', authData.user.id)
    .eq('property_id', propertyId)
    .maybeSingle();

  return !!data;
}

/**
 * Check multiple properties at once (for lists)
 * Returns a Set of property IDs that are favorited
 */
export async function getFavoritedPropertyIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) return new Set();

  const { data } = await (supabase as any)
    .from('favorites')
    .select('property_id')
    .eq('user_id', authData.user.id);

  return new Set(data?.map((f: any) => f.property_id) || []);
}
