import ProfileForm from "@/components/profile/profile-form";
import Navbar from "@/components/navbar";

export default function ProfilePage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8 text-right">الملف الشخصي</h1>
                <div className="max-w-2xl mx-auto">
                    <ProfileForm />
                </div>
            </div>
        </div>
    );
}
