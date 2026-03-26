"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/navbar";
import {
    ShieldCheck,
    CheckCircle,
    XCircle,
    Loader2,
    User,
    Crown,
    FileText,
    Building2,
    X,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ADMIN EMAIL - Only this email can access the dashboard
const ADMIN_EMAIL = "fatemaabdulhamed13@gmail.com";

interface PendingProfile {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    identity_document_url: string;
    verification_status: string;
    created_at: string;
}

interface PendingProperty {
    id: string;
    title: string;
    city: string;
    price_per_night: number;
    images: string[];
    status: string;
    host_id: string;
    created_at: string;
    host?: {
        full_name: string;
    };
}

type TabType = "users" | "properties";

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("users");

    // User verification state
    const [pendingProfiles, setPendingProfiles] = useState<PendingProfile[]>([]);
    const [processingUserId, setProcessingUserId] = useState<string | null>(null);

    // Property verification state
    const [pendingProperties, setPendingProperties] = useState<PendingProperty[]>([]);
    const [processingPropertyId, setProcessingPropertyId] = useState<string | null>(null);

    // Image lightbox state
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Check admin access
    useEffect(() => {
        const checkAdmin = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                console.log("❌ No user - redirecting to login");
                router.push("/login");
                return;
            }

            // CRITICAL: Check if user email is admin email
            if (user.email !== ADMIN_EMAIL) {
                console.log("❌ Unauthorized access attempt by:", user.email);
                router.push("/");
                return;
            }

            console.log("✅ Admin authenticated:", user.email);
            await Promise.all([
                fetchPendingVerifications(),
                fetchPendingProperties()
            ]);
            setLoading(false);
        };

        checkAdmin();
    }, [router]);

    // Fetch pending ID verifications
    const fetchPendingVerifications = async () => {
        try {
            const res = await fetch('/api/admin/pending-profiles', { cache: 'no-store' })
            if (!res.ok) {
                console.error('Error fetching pending verifications:', await res.text())
                return
            }
            const { profiles } = await res.json()
            const profilesWithIds = (profiles || []).map((profile: any) => ({
                ...profile,
                email: profile.id.substring(0, 8) + '...',
            }))
            setPendingProfiles(profilesWithIds as PendingProfile[])
        } catch (error) {
            console.error('Error in fetchPendingVerifications:', error)
        }
    };

    // Fetch pending properties
    const fetchPendingProperties = async () => {
        try {
            const supabase = createClient();

            // STEP 1: Fetch pending properties (no join to avoid users table)
            const { data: properties, error: propError } = await supabase
                .from("properties")
                .select("id, title, city, price_per_night, images, status, host_id, created_at")
                .eq("status", "pending")
                .order("created_at", { ascending: false });

            if (propError) {
                console.error("❌ Error fetching properties:", propError);
                alert("Error loading properties: " + propError.message);
                return;
            }

            if (!properties || properties.length === 0) {
                console.log("✅ No pending properties");
                setPendingProperties([]);
                return;
            }

            // STEP 2: Fetch host profiles separately (avoids users table completely)
            const hostIds = [...new Set((properties as any[]).map((p: any) => p.host_id).filter(Boolean))];

            const { data: profiles, error: profileError } = await supabase
                .from("profiles")
                .select("id, full_name")
                .in("id", hostIds);

            if (profileError) {
                console.warn("⚠️ Could not fetch host names:", profileError);
                // Continue without host names
                setPendingProperties((properties as any[]).map((p: any) => ({ ...p, host: { full_name: "Unknown" } })) as PendingProperty[]);
                return;
            }

            // STEP 3: Merge profiles with properties
            const profilesMap = new Map((profiles as any[])?.map((p: any) => [p.id, p]) || []);
            const enrichedProperties = (properties as any[]).map((prop: any) => ({
                ...prop,
                host: profilesMap.get(prop.host_id) || { full_name: "Unknown Host" }
            }));

            console.log("✅ Fetched pending properties:", enrichedProperties.length);
            setPendingProperties(enrichedProperties as PendingProperty[]);
        } catch (error: any) {
            console.error("❌ Exception in fetchPendingProperties:", error);
            alert("Error: " + error.message);
        }
    };

    // Approve User ID
    const handleApproveUser = async (profileId: string) => {
        if (!confirm("Are you sure you want to approve this ID?")) return;

        setProcessingUserId(profileId);
        try {
            const res = await fetch('/api/admin/pending-profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId, action: 'approve' }),
            })
            const json = await res.json()
            if (!res.ok) { alert('Failed to approve: ' + json.error); return }
            alert('✅ ID Approved Successfully!')
            await fetchPendingVerifications()
        } catch (error: any) {
            alert('Error: ' + error.message)
        } finally {
            setProcessingUserId(null)
        }
    };

    // Reject User ID
    const handleRejectUser = async (profileId: string) => {
        if (!confirm("Are you sure you want to reject this ID?")) return;

        setProcessingUserId(profileId);
        try {
            const res = await fetch('/api/admin/pending-profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId, action: 'reject' }),
            })
            const json = await res.json()
            if (!res.ok) { alert('Failed to reject: ' + json.error); return }
            alert('❌ ID Rejected')
            await fetchPendingVerifications()
        } catch (error: any) {
            alert('Error: ' + error.message)
        } finally {
            setProcessingUserId(null)
        }
    };

    // Approve Property
    const handleApproveProperty = async (propertyId: string) => {
        if (!confirm("Approve this property? It will go live on the homepage immediately.")) return;

        setProcessingPropertyId(propertyId);
        try {
            const supabase = createClient();

            console.log("🔵 Approving property:", propertyId);

            const { error } = await supabase
                .from("properties")
                .update({ status: "approved" })
                .eq("id", propertyId);

            if (error) {
                console.error("❌ Approval failed:", error);
                alert("Failed to approve: " + error.message);
                setProcessingPropertyId(null);
                return;
            }

            console.log("✅ Property approved successfully");

            // Optimistically remove from pending list
            setPendingProperties(prev => prev.filter(p => p.id !== propertyId));

            // Show success and refresh
            alert("✅ Property is now live! Visible on homepage.");

            // Refresh the list to ensure sync
            await fetchPendingProperties();
        } catch (error: any) {
            console.error("❌ Error:", error);
            alert("Error: " + error.message);
        } finally {
            setProcessingPropertyId(null);
        }
    };

    // Reject Property
    const handleRejectProperty = async (propertyId: string) => {
        const reason = prompt("Reason for rejection (optional):");
        if (reason === null) return; // User clicked cancel

        setProcessingPropertyId(propertyId);
        try {
            const supabase = createClient();

            console.log("🔵 Rejecting property:", propertyId);

            const { error } = await supabase
                .from("properties")
                .update({ status: "rejected" })
                .eq("id", propertyId);

            if (error) {
                console.error("❌ Rejection failed:", error);
                alert("Failed to reject: " + error.message);
                setProcessingPropertyId(null);
                return;
            }

            console.log("✅ Property rejected successfully");

            // Optimistically remove from pending list
            setPendingProperties(prev => prev.filter(p => p.id !== propertyId));

            // Show confirmation and refresh
            alert("❌ Property rejected" + (reason ? `: ${reason}` : ""));

            // Refresh the list to ensure sync
            await fetchPendingProperties();
        } catch (error: any) {
            console.error("❌ Error:", error);
            alert("Error: " + error.message);
        } finally {
            setProcessingPropertyId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-600">Loading Admin Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                            <Crown className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Control Center</h1>
                            <p className="text-gray-600">Manage user verifications and property approvals</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-600 font-medium">Pending User IDs</p>
                                    <p className="text-3xl font-bold text-blue-900">{pendingProfiles.length}</p>
                                </div>
                                <ShieldCheck className="h-12 w-12 text-blue-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-600 font-medium">Pending Properties</p>
                                    <p className="text-3xl font-bold text-purple-900">{pendingProperties.length}</p>
                                </div>
                                <Building2 className="h-12 w-12 text-purple-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs Navigation */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`px-6 py-3 font-semibold text-sm transition-all ${activeTab === "users"
                            ? "border-b-2 border-primary text-primary"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            <span>Verify Users</span>
                            {pendingProfiles.length > 0 && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                    {pendingProfiles.length}
                                </span>
                            )}
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab("properties")}
                        className={`px-6 py-3 font-semibold text-sm transition-all ${activeTab === "properties"
                            ? "border-b-2 border-primary text-primary"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>Verify Properties</span>
                            {pendingProperties.length > 0 && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                                    {pendingProperties.length}
                                </span>
                            )}
                        </div>
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === "users" && (
                    <Card className="border-0 shadow-xl">
                        <CardHeader className="bg-gradient-to-r from-teal-50 to-blue-50 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-6 w-6 text-primary" />
                                Pending ID Verifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {pendingProfiles.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                                    <p className="text-lg text-gray-600">No pending verifications!</p>
                                    <p className="text-sm text-gray-500 mt-2">All caught up 🎉</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {pendingProfiles.map((profile) => (
                                        <AdminUserCard
                                            key={profile.id}
                                            profile={profile}
                                            isProcessing={processingUserId === profile.id}
                                            onApprove={handleApproveUser}
                                            onReject={handleRejectUser}
                                            onImageClick={setLightboxImage}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === "properties" && (
                    <Card className="border-0 shadow-xl">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-6 w-6 text-purple-600" />
                                Pending Property Approvals
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {pendingProperties.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                                    <p className="text-lg text-gray-600">No pending properties!</p>
                                    <p className="text-sm text-gray-500 mt-2">All listings approved 🎉</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {pendingProperties.map((property) => (
                                        <AdminPropertyCard
                                            key={property.id}
                                            property={property}
                                            isProcessing={processingPropertyId === property.id}
                                            onApprove={handleApproveProperty}
                                            onReject={handleRejectProperty}
                                            onImageClick={setLightboxImage}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Image Lightbox Modal */}
            {lightboxImage && (
                <ImageLightbox
                    imageUrl={lightboxImage}
                    onClose={() => setLightboxImage(null)}
                />
            )}
        </div>
    );
}

// ===== SUB-COMPONENTS =====

interface AdminUserCardProps {
    profile: PendingProfile;
    isProcessing: boolean;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onImageClick: (url: string) => void;
}

function AdminUserCard({ profile, isProcessing, onApprove, onReject, onImageClick }: AdminUserCardProps) {
    const getDocumentUrl = (path: string) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;

        const supabase = createClient();
        const { data } = supabase.storage
            .from("property-images")
            .getPublicUrl(path);

        return data.publicUrl;
    };

    const documentUrl = getDocumentUrl(profile.identity_document_url);

    return (
        <Card className="border-2 border-gray-200 hover:border-primary transition-colors">
            <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* User Info */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                User Information
                            </h3>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">Name:</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {profile.full_name || "N/A"}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">Status:</span>
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                                        {profile.verification_status}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Submitted:</span>
                                    <span className="text-sm text-gray-900">
                                        {new Date(profile.created_at).toLocaleDateString('en-GB')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 border-t space-y-3">
                            <Button
                                onClick={() => onApprove(profile.id)}
                                disabled={isProcessing}
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve ID
                                    </>
                                )}
                            </Button>

                            <Button
                                onClick={() => onReject(profile.id)}
                                disabled={isProcessing}
                                variant="destructive"
                                className="w-full"
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject ID
                            </Button>
                        </div>
                    </div>

                    {/* Document Preview */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Identity Document
                        </h3>
                        {documentUrl ? (
                            <div className="space-y-3">
                                <div
                                    className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 cursor-pointer hover:border-primary transition-colors"
                                    onClick={() => onImageClick(documentUrl)}
                                >
                                    <img
                                        src={documentUrl}
                                        alt="Identity Document"
                                        className="w-full h-auto max-h-96 object-contain"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                                        <p className="text-white font-semibold opacity-0 hover:opacity-100">
                                            Click to enlarge
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-64 bg-gray-100 rounded-xl">
                                <p className="text-gray-600">No document available</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface AdminPropertyCardProps {
    property: PendingProperty;
    isProcessing: boolean;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onImageClick: (url: string) => void;
}

function AdminPropertyCard({ property, isProcessing, onApprove, onReject, onImageClick }: AdminPropertyCardProps) {
    const mainImage = property.images?.[0] || null;

    return (
        <Card className="border-2 border-gray-200 hover:border-purple-300 transition-all hover:shadow-lg">
            <CardContent className="p-0">
                {/* Property Image */}
                <div
                    className="relative h-48 bg-gray-200 cursor-pointer"
                    onClick={() => mainImage && onImageClick(mainImage)}
                >
                    {mainImage ? (
                        <img
                            src={mainImage}
                            alt={property.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="h-12 w-12 text-gray-400" />
                        </div>
                    )}
                    {/* Price Badge */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
                        <span className="text-sm font-bold text-primary">{property.price_per_night} د.ل</span>
                        <span className="text-xs text-gray-600"> / night</span>
                    </div>
                </div>

                {/* Property Details */}
                <div className="p-4 space-y-3">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg line-clamp-1">
                            {property.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">📍 {property.city}</p>
                        <p className="text-sm text-gray-600">
                            🏠 Host: {property.host?.full_name || "Unknown"}
                        </p>
                    </div>

                    {/* View Full Listing Link */}
                    <a
                        href={`/properties/${property.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        <ExternalLink className="h-4 w-4" />
                        View Full Listing
                    </a>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t space-y-2">
                        <Button
                            onClick={() => onApprove(property.id)}
                            disabled={isProcessing}
                            className="w-full bg-green-600 hover:bg-green-700 text-white text-sm"
                            size="sm"
                        >
                            {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={() => onReject(property.id)}
                            disabled={isProcessing}
                            variant="destructive"
                            className="w-full text-sm"
                            size="sm"
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface ImageLightboxProps {
    imageUrl: string;
    onClose: () => void;
}

function ImageLightbox({ imageUrl, onClose }: ImageLightboxProps) {
    return (
        <div
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
            >
                <X className="h-6 w-6 text-gray-900" />
            </button>

            <div className="max-w-5xl max-h-[90vh] overflow-auto">
                <img
                    src={imageUrl}
                    alt="Full size view"
                    className="w-full h-auto"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
}
