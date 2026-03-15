export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

/**
 * Booking status enum.
 * Matches the `booking_status` PostgreSQL enum defined in migrations.
 */
export type BookingStatus =
    | 'pending'
    | 'awaiting_payment'
    | 'host_verifying'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
    | 'rejected'
    | 'expired'

/**
 * Payment method enum.
 * Matches the `payment_method` PostgreSQL enum.
 */
export type PaymentMethod = 'cash' | 'bank_transfer'

/**
 * Property moderation status.
 * New listings start as 'pending' and need admin approval.
 */
export type PropertyStatus = 'pending' | 'approved' | 'rejected'

/**
 * Identity verification status for user profiles.
 */
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'

/**
 * Property category – matches the CATEGORIES array in the create-listing form.
 */
export type PropertyCategory = 'istiraha' | 'apartment' | 'villa' | 'chalet' | 'studio' | (string & {})

export interface Database {
    public: {
        Tables: {
            /* ─────────────────────────── profiles ─────────────────────────── */
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    full_name: string | null
                    avatar_url: string | null
                    phone_number: string | null
                    is_host: boolean
                    bank_details: Json | null
                    is_identity_verified: boolean
                    identity_document_url: string | null
                    verification_status: VerificationStatus
                    created_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    phone_number?: string | null
                    is_host?: boolean
                    bank_details?: Json | null
                    is_identity_verified?: boolean
                    identity_document_url?: string | null
                    verification_status?: VerificationStatus
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    phone_number?: string | null
                    is_host?: boolean
                    bank_details?: Json | null
                    is_identity_verified?: boolean
                    identity_document_url?: string | null
                    verification_status?: VerificationStatus
                    created_at?: string
                }
                Relationships: []
            }

            /* ─────────────────────────── properties ───────────────────────── */
            properties: {
                Row: {
                    id: string
                    host_id: string
                    title: string
                    description: string | null
                    category: PropertyCategory
                    city: string
                    price_per_night: number
                    max_guests: number
                    bedrooms: number
                    bathrooms: number
                    family_friendly: boolean
                    images: string[]
                    amenities: string[]
                    location_lat: number
                    location_lng: number
                    status: PropertyStatus
                    created_at: string
                }
                Insert: {
                    id?: string
                    host_id: string
                    title: string
                    description?: string | null
                    category?: PropertyCategory
                    city: string
                    price_per_night: number
                    max_guests?: number
                    bedrooms?: number
                    bathrooms?: number
                    family_friendly?: boolean
                    images?: string[]
                    amenities?: string[]
                    location_lat: number
                    location_lng: number
                    status?: PropertyStatus
                    created_at?: string
                }
                Update: {
                    id?: string
                    host_id?: string
                    title?: string
                    description?: string | null
                    category?: PropertyCategory
                    city?: string
                    price_per_night?: number
                    max_guests?: number
                    bedrooms?: number
                    bathrooms?: number
                    family_friendly?: boolean
                    images?: string[]
                    amenities?: string[]
                    location_lat?: number
                    location_lng?: number
                    status?: PropertyStatus
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'properties_host_id_fkey'
                        columns: ['host_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                ]
            }

            /* ─────────────────────────── bookings ─────────────────────────── */
            bookings: {
                Row: {
                    id: string
                    property_id: string
                    guest_id: string
                    host_id: string
                    start_date: string
                    end_date: string
                    total_price: number
                    status: BookingStatus
                    payment_method: PaymentMethod
                    payment_proof_url: string | null
                    booking_code: string
                    num_guests: number
                    expires_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    guest_id: string
                    host_id: string
                    start_date: string
                    end_date: string
                    total_price: number
                    status?: BookingStatus
                    payment_method: PaymentMethod
                    payment_proof_url?: string | null
                    booking_code?: string
                    num_guests?: number
                    expires_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    guest_id?: string
                    host_id?: string
                    start_date?: string
                    end_date?: string
                    total_price?: number
                    status?: BookingStatus
                    payment_method?: PaymentMethod
                    payment_proof_url?: string | null
                    booking_code?: string
                    num_guests?: number
                    expires_at?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'bookings_property_id_fkey'
                        columns: ['property_id']
                        isOneToOne: false
                        referencedRelation: 'properties'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'bookings_guest_id_fkey'
                        columns: ['guest_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'bookings_host_id_fkey'
                        columns: ['host_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                ]
            }

            /* ─────────────────────────── messages ─────────────────────────── */
            messages: {
                Row: {
                    id: string
                    booking_id: string
                    sender_id: string
                    content: string
                    image_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    booking_id: string
                    sender_id: string
                    content: string
                    image_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    booking_id?: string
                    sender_id?: string
                    content?: string
                    image_url?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'messages_booking_id_fkey'
                        columns: ['booking_id']
                        isOneToOne: false
                        referencedRelation: 'bookings'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'messages_sender_id_fkey'
                        columns: ['sender_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                ]
            }

            /* ─────────────────────────── favorites ────────────────────────── */
            favorites: {
                Row: {
                    id: string
                    user_id: string
                    property_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    property_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    property_id?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'favorites_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'favorites_property_id_fkey'
                        columns: ['property_id']
                        isOneToOne: false
                        referencedRelation: 'properties'
                        referencedColumns: ['id']
                    },
                ]
            }

            /* ─────────────────────────── availability ─────────────────────── */
            availability: {
                Row: {
                    id: string
                    property_id: string
                    start_date: string
                    end_date: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    start_date: string
                    end_date: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    start_date?: string
                    end_date?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'availability_property_id_fkey'
                        columns: ['property_id']
                        isOneToOne: false
                        referencedRelation: 'properties'
                        referencedColumns: ['id']
                    },
                ]
            }
        }

        Views: {
            public_profiles_view: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    is_host: boolean
                    is_identity_verified: boolean
                    verification_status: VerificationStatus
                    created_at: string
                }
                Relationships: []
            }
        }

        Functions: {
            /** Check for booking date overlaps (confirmed, pending, and manual blocks). */
            check_booking_overlap: {
                Args: {
                    p_property_id: string
                    p_start_date: string
                    p_end_date: string
                    p_exclude_booking_id?: string
                }
                Returns: Json
            }
            /** Return all blocked date ranges for a property (bookings + manual blocks). */
            get_property_blocked_dates: {
                Args: {
                    p_property_id: string
                }
                Returns: {
                    start_date: string
                    end_date: string
                    block_type: 'booking' | 'manual_block'
                    block_id: string
                    status: string
                }[]
            }
            /** Mark pending bookings past their 48-hour window as expired. */
            expire_pending_bookings: {
                Args: Record<string, never>
                Returns: undefined
            }
            /** Auto-generate a unique booking code (BK-XXXXXXXX). */
            generate_booking_code: {
                Args: Record<string, never>
                Returns: string
            }
            /** Return approved properties with weekend availability in the next 30 days. */
            get_weekend_available_properties: {
                Args: {
                    p_limit?: number
                    p_category?: string | null
                }
                Returns: Database['public']['Tables']['properties']['Row'][]
            }
            /** Check if the current user is an admin. */
            is_admin: {
                Args: Record<string, never>
                Returns: boolean
            }
            /** Update the currently authenticated user's own profile (POST/RPC, bypasses PATCH network issues). */
            update_own_profile: {
                Args: {
                    p_full_name?: string | null
                    p_phone_number?: string | null
                    p_is_host?: boolean | null
                    p_bank_details?: Json | null
                    p_verification_status?: string | null
                    p_identity_document_url?: string | null
                }
                Returns: undefined
            }
        }

        Enums: {
            booking_status: BookingStatus
            payment_method: PaymentMethod
        }

        CompositeTypes: {
            [_ in never]: never
        }
    }
}

/* ──────────────────────── Convenience helpers ─────────────────────── */

/** Shorthand to extract a Row type for any public table. */
export type Tables<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Row']

/** Shorthand to extract an Insert type for any public table. */
export type TablesInsert<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Insert']

/** Shorthand to extract an Update type for any public table. */
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Update']

/** Shorthand for enum types. */
export type Enums<T extends keyof Database['public']['Enums']> =
    Database['public']['Enums'][T]
