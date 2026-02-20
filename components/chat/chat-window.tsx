"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon, Loader2, Paperclip } from "lucide-react";
import { format } from "date-fns";

export default function ChatWindow({ bookingId, currentUser, otherUser }: any) {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // Initial Fetch
        const fetchMessages = async () => {
            const { data } = await supabase
                .from("messages")
                .select("*")
                .eq("booking_id", bookingId)
                .order("created_at", { ascending: true });

            if (data) setMessages(data);
            scrollToBottom();
        };

        fetchMessages();

        // Realtime Subscription
        const channel = supabase
            .channel(`chat:${bookingId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `booking_id=eq.${bookingId}`
            }, (payload) => {
                setMessages((prev) => [...prev, payload.new]);
                scrollToBottom();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [bookingId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage;
        setNewMessage(""); // Optimistic clear

        const { error } = await (supabase.from("messages") as any).insert({
            booking_id: bookingId,
            sender_id: currentUser.id,
            content: content,
        });

        if (error) {
            alert("Error sending message");
            setNewMessage(content); // Restore if error
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${bookingId}/${fileName}`; // Organize by booking

            const { error: uploadError } = await supabase.storage
                .from('chat-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('chat-images')
                .getPublicUrl(filePath);

            // Send message with image
            const { error: msgError } = await (supabase.from("messages") as any).insert({
                booking_id: bookingId,
                sender_id: currentUser.id,
                content: "Sent an image", // Placeholder text
                image_url: data.publicUrl
            });

            if (msgError) throw msgError;

        } catch (error: any) {
            alert("Upload failed: " + error.message);
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white border rounded-tl-none'}`}>
                                {!isMe && <p className="text-xs text-muted-foreground mb-1">{otherUser.full_name}</p>}

                                {msg.image_url ? (
                                    <div className="mb-2 rounded-md overflow-hidden bg-black/10">
                                        <img src={msg.image_url} alt="Shared image" className="max-w-full h-auto" />
                                    </div>
                                ) : null}

                                <p>{msg.content}</p>
                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-gray-400'}`}>
                                    {format(new Date(msg.created_at), "p")}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        disabled={uploading}
                        onClick={() => document.getElementById("chat-image-upload")?.click()}
                    >
                        {uploading ? <Loader2 className="animate-spin h-5 w-5" /> : <ImageIcon className="h-5 w-5 text-gray-500" />}
                    </Button>
                    <input
                        type="file"
                        id="chat-image-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                    />

                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="اكتب رسالتك..."
                        className="flex-1 text-right"
                        dir="rtl"
                        disabled={uploading}
                    />

                    <Button type="submit" size="icon" disabled={!newMessage.trim() || uploading}>
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
