"use client";

import { useState, useEffect } from "react";
import { Phone, ExternalLink, Check, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface CountryCode {
  code: string;
  flag: string;
  name: string;
  nameAr: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: "218", flag: "🇱🇾", name: "Libya", nameAr: "ليبيا" },
  { code: "20", flag: "🇪🇬", name: "Egypt", nameAr: "مصر" },
  { code: "216", flag: "🇹🇳", name: "Tunisia", nameAr: "تونس" },
  { code: "213", flag: "🇩🇿", name: "Algeria", nameAr: "الجزائر" },
  { code: "212", flag: "🇲🇦", name: "Morocco", nameAr: "المغرب" },
  { code: "966", flag: "🇸🇦", name: "Saudi Arabia", nameAr: "السعودية" },
  { code: "971", flag: "🇦🇪", name: "UAE", nameAr: "الإمارات" },
  { code: "962", flag: "🇯🇴", name: "Jordan", nameAr: "الأردن" },
  { code: "961", flag: "🇱🇧", name: "Lebanon", nameAr: "لبنان" },
  { code: "965", flag: "🇰🇼", name: "Kuwait", nameAr: "الكويت" },
];

interface WhatsAppInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  label?: string;
  required?: boolean;
  error?: string;
}

export default function WhatsAppInput({
  value,
  onChange,
  onValidationChange,
  label = "رقم الواتساب",
  required = false,
  error,
}: WhatsAppInputProps) {
  const [countryCode, setCountryCode] = useState("218"); // Default Libya
  const [localNumber, setLocalNumber] = useState("");
  const [hasClickedTest, setHasClickedTest] = useState(false); // Track if test button was clicked
  const [isTested, setIsTested] = useState(false);
  const [showTestReminder, setShowTestReminder] = useState(false);

  // Parse initial value if provided
  useEffect(() => {
    if (value) {
      // Try to extract country code from the value
      const matchedCountry = COUNTRY_CODES.find((c) => value.startsWith(c.code));
      if (matchedCountry) {
        setCountryCode(matchedCountry.code);
        setLocalNumber(value.substring(matchedCountry.code.length));
      } else {
        setLocalNumber(value);
      }
    }
  }, []);

  // Clean the local number input
  const cleanNumber = (input: string): string => {
    // Remove all non-numeric characters
    let cleaned = input.replace(/\D/g, "");

    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, "");

    return cleaned;
  };

  // Handle local number change
  const handleLocalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanNumber(e.target.value);
    setLocalNumber(cleaned);

    // Update parent with full number
    const fullNumber = countryCode + cleaned;
    onChange(fullNumber);

    // Reset test status when number changes
    setHasClickedTest(false);
    setIsTested(false);
    setShowTestReminder(false);

    // Update validation
    onValidationChange?.(false);
  };

  // Handle country code change
  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setCountryCode(newCode);

    // Update parent with full number
    const fullNumber = newCode + localNumber;
    onChange(fullNumber);

    // Reset test status
    setHasClickedTest(false);
    setIsTested(false);
    setShowTestReminder(false);
    onValidationChange?.(false);
  };

  // Test WhatsApp link
  const handleTestLink = () => {
    const fullNumber = countryCode + localNumber;

    if (!localNumber) {
      alert("الرجاء إدخال رقم الهاتف أولاً");
      return;
    }

    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${fullNumber}`;
    window.open(whatsappUrl, "_blank");

    // Enable the checkbox
    setHasClickedTest(true);

    // Show reminder to check the checkbox
    setShowTestReminder(true);
  };

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsTested(checked);
    onValidationChange?.(checked);
  };

  const fullNumber = countryCode + localNumber;
  const isNumberEntered = localNumber.length > 0;

  return (
    <div className="space-y-3">
      {/* Label */}
      {label && (
        <Label className="text-sm font-semibold text-gray-900">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </Label>
      )}

      {/* Input Group */}
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <div className="w-32">
          <select
            value={countryCode}
            onChange={handleCountryCodeChange}
            className="w-full h-12 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent bg-white"
          >
            {COUNTRY_CODES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} +{country.code}
              </option>
            ))}
          </select>
        </div>

        {/* Phone Number Input */}
        <div className="flex-1">
          <div className="relative">
            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="tel"
              value={localNumber}
              onChange={handleLocalNumberChange}
              placeholder="912345678"
              className="h-12 pr-10 text-left placeholder:text-right focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* Preview Clean Number */}
      {isNumberEntered && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-xs text-gray-500">الرقم النهائي:</span>
          <code className="text-sm font-mono text-gray-900 font-semibold">+{fullNumber}</code>
        </div>
      )}

      {/* Test Link Button */}
      {isNumberEntered && (
        <button
          type="button"
          onClick={handleTestLink}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
        >
          <ExternalLink className="h-5 w-5" />
          <span>اختبار الرابط في واتساب</span>
        </button>
      )}

      {/* Test Reminder */}
      {showTestReminder && !isTested && (
        <div className="flex items-start gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">
            تأكد من أن الرابط فتح واتساب بشكل صحيح، ثم ضع علامة أدناه
          </p>
        </div>
      )}

      {/* Confirmation Checkbox - DISABLED until test button is clicked */}
      {isNumberEntered && (
        <label className={`flex items-start gap-3 px-4 py-3 border-2 rounded-lg transition-colors ${
          hasClickedTest
            ? "border-gray-200 cursor-pointer hover:bg-gray-50"
            : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
        }`}>
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={isTested}
              onChange={handleCheckboxChange}
              disabled={!hasClickedTest}
              className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-300 checked:border-[#25D366] checked:bg-[#25D366] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            />
            <Check className="absolute h-4 w-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              قمت باختبار الرابط وهو يفتح واتساب بشكل صحيح
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {hasClickedTest
                ? "يجب التأكد من أن الرقم يعمل قبل حفظه"
                : "⚠️ يجب اختبار الرابط أولاً قبل التأكيد"
              }
            </p>
          </div>
        </label>
      )}

      {/* Validation Status */}
      {isTested && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
          <Check className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800 font-medium">
            تم التحقق من الرقم بنجاح ✓
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-gray-500 px-1">
        أدخل رقم واتساب صحيح بدون أصفار في البداية. سيتم إزالة المسافات والشرطات تلقائياً.
      </p>
    </div>
  );
}
