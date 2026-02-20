"use client";

import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  phoneNumber: string | null | undefined;
  propertyTitle: string;
}

export default function WhatsAppButton({ phoneNumber, propertyTitle }: WhatsAppButtonProps) {
  // Don't render if no phone number
  if (!phoneNumber) {
    return null;
  }

  const handleClick = () => {
    // Clean phone number (remove spaces, dashes, parentheses, etc.)
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");

    // Pre-filled message
    const message = `مرحباً، أنا مهتم بـ "${propertyTitle}". هل يمكنك تزويدي بمزيد من المعلومات؟`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
    >
      <MessageCircle className="h-5 w-5" />
      <span>تواصل عبر واتساب</span>
    </button>
  );
}
