export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    phone_number: string | null
                    is_host: boolean
                    bank_details: Json | null // { bank_name: string, iban: string, account_name: string }
                    is_identity_verified: boolean
                    verification_status: string
                    created_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    phone_number?: string | null
                    is_host?: boolean
                    bank_details?: Json | null
                    is_identity_verified?: boolean
                    verification_status?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    phone_number?: string | null
                    is_host?: boolean
                    bank_details?: Json | null
                    is_identity_verified?: boolean
                    verification_status?: string
                    created_at?: string
                }
            }
            properties: {
                Row: {
                    id: string
                    host_id: string
                    title: string
                    description: string | null
                    price_per_night: number
                    location_lat: number
                    location_lng: number
                    city: string
                    images: string[]
                    amenities: string[]
                    max_guests: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    host_id: string
                    title: string
                    description?: string | null
                    price_per_night: number
                    location_lat: number
                    location_lng: number
                    city: string
                    images?: string[]
                    amenities?: string[]
                    max_guests: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    host_id?: string
                    title?: string
                    description?: string | null
                    price_per_night?: number
                    location_lat?: number
                    location_lng?: number
                    city?: string
                    images?: string[]
                    amenities?: string[]
                    max_guests?: number
                    created_at?: string
                }
            }
            bookings: {
                Row: {
                    id: string
                    property_id: string
                    guest_id: string
                    host_id: string
                    start_date: string
                    end_date: string
                    total_price: number
                    status: 'pending' | 'awaiting_payment' | 'host_verifying' | 'confirmed' | 'completed' | 'cancelled' | 'rejected' | 'expired'
                    payment_method: 'cash' | 'bank_transfer'
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
                    status?: 'pending' | 'awaiting_payment' | 'host_verifying' | 'confirmed' | 'completed' | 'cancelled' | 'rejected' | 'expired'
                    payment_method: 'cash' | 'bank_transfer'
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
                    status?: 'pending' | 'awaiting_payment' | 'host_verifying' | 'confirmed' | 'completed' | 'cancelled' | 'rejected' | 'expired'
                    payment_method?: 'cash' | 'bank_transfer'
                    payment_proof_url?: string | null
                    booking_code?: string
                    num_guests?: number
                    expires_at?: string | null
                    created_at?: string
                }
            }
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
            }
        }
    }
}
