import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ChatWindow from "@/components/chat/chat-window";
import Navbar from "@/components/navbar";

export default async function ChatPage({ params }: { params: { bookingId: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch booking to verify participation and get context
    const { data: booking, error } = await (supabase as any)
        .from("bookings")
        .select(`
        *,
        property:properties(title),
        guest:profiles!guest_id(full_name, avatar_url),
        host:profiles!host_id(full_name, avatar_url)
    `)
        .eq("id", params.bookingId)
        .single();

    if (error || !booking) {
        notFound();
    }

    // Security check: User must be guest or host
    if (booking.guest_id !== user.id && booking.host_id !== user.id) {
        redirect("/");
    }

    const otherUser = booking.guest_id === user.id ? booking.host : booking.guest;
    const role = booking.guest_id === user.id ? 'guest' : 'host';

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <Navbar />
            <div className="flex-1 container mx-auto p-4 flex flex-col max-w-4xl">
                <div className="bg-white border-b p-4 flex items-center justify-between rounded-t-xl shadow-sm">
                    <div>
                        <h1 className="font-bold text-lg">{booking.property.title}</h1>
                        <p className="text-sm text-muted-foreground">
                            محادثة مع {otherUser?.full_name || "المستخدم"}
                        </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        رقم الحجز: {booking.id.substring(0, 8)}
                    </div>
                </div>

                <div className="flex-1 bg-white border-x border-b rounded-b-xl shadow-sm overflow-hidden relative">
                    <ChatWindow
                        bookingId={booking.id}
                        currentUser={user}
                        otherUser={otherUser}
                    />
                </div>
            </div>
        </div>
    );
}
