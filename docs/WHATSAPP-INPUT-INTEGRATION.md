# WhatsApp Input Component - Integration Guide

## ✅ Component Features

### 🎯 Self-Verifying Design
- **Country code selector** (Libya +218 default, 9 other countries)
- **Auto-cleaning** (removes leading 0, spaces, dashes)
- **Test button** (opens WhatsApp to verify)
- **Mandatory checkbox** (must test before submitting)
- **Real-time preview** (shows final clean number)

### 🎨 Visual Design
- **Green WhatsApp theme** (#25D366)
- **Professional UI** with Lucide icons
- **Clear validation states** (success/error/pending)
- **Responsive** (works on mobile/desktop)

---

## 📖 How to Use

### Basic Usage

```tsx
import WhatsAppInput from "@/components/ui/WhatsAppInput";

function MyForm() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  return (
    <form>
      <WhatsAppInput
        value={phoneNumber}
        onChange={setPhoneNumber}
        onValidationChange={setIsPhoneValid}
        label="رقم الواتساب"
        required
      />

      <button
        type="submit"
        disabled={!isPhoneValid}
      >
        حفظ
      </button>
    </form>
  );
}
```

---

## 🔧 Integration Examples

### Example 1: Add Property Form

```tsx
"use client";

import { useState } from "react";
import WhatsAppInput from "@/components/ui/WhatsAppInput";

export default function AddPropertyForm() {
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    whatsappNumber: "",
  });
  const [isWhatsAppValid, setIsWhatsAppValid] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isWhatsAppValid) {
      alert("الرجاء التحقق من رقم الواتساب");
      return;
    }

    // Submit form
    console.log("Submitting:", formData);
    // API call here...
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Other fields */}
      <div>
        <label>عنوان العقار</label>
        <input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      {/* WhatsApp Input */}
      <WhatsAppInput
        value={formData.whatsappNumber}
        onChange={(value) => setFormData({ ...formData, whatsappNumber: value })}
        onValidationChange={setIsWhatsAppValid}
        label="رقم الواتساب للتواصل"
        required
      />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isWhatsAppValid}
        className={`px-6 py-3 rounded-lg font-semibold ${
          isWhatsAppValid
            ? "bg-primary text-white"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {isWhatsAppValid ? "نشر العقار" : "اختبر رقم الواتساب أولاً"}
      </button>
    </form>
  );
}
```

---

### Example 2: Edit Profile Form

```tsx
"use client";

import { useState, useEffect } from "react";
import WhatsAppInput from "@/components/ui/WhatsAppInput";

export default function EditProfileForm({ currentUser }: { currentUser: any }) {
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phone_number || "");
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [hasPhoneChanged, setHasPhoneChanged] = useState(false);

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    // Check if phone number changed from original
    setHasPhoneChanged(value !== currentUser.phone_number);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If phone changed, must re-verify
    if (hasPhoneChanged && !isPhoneValid) {
      alert("الرجاء اختبار رقم الواتساب الجديد");
      return;
    }

    // Save changes
    console.log("Saving phone:", phoneNumber);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <WhatsAppInput
        value={phoneNumber}
        onChange={handlePhoneChange}
        onValidationChange={setIsPhoneValid}
        label="رقم الواتساب"
        required
        error={hasPhoneChanged && !isPhoneValid ? "يجب اختبار الرقم الجديد" : undefined}
      />

      <button
        type="submit"
        disabled={hasPhoneChanged && !isPhoneValid}
      >
        حفظ التغييرات
      </button>
    </form>
  );
}
```

---

### Example 3: Multi-Step Form (Host Onboarding)

```tsx
"use client";

import { useState } from "react";
import WhatsAppInput from "@/components/ui/WhatsAppInput";

export default function HostOnboarding() {
  const [step, setStep] = useState(1);
  const [hostData, setHostData] = useState({
    name: "",
    whatsappNumber: "",
    propertyTitle: "",
  });
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  const canProceedToNextStep = () => {
    if (step === 1) {
      return hostData.name.length > 0;
    }
    if (step === 2) {
      return isPhoneValid; // Must verify WhatsApp
    }
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-4">
          <h2>الخطوة 1: معلومات أساسية</h2>
          <input
            placeholder="الاسم الكامل"
            value={hostData.name}
            onChange={(e) => setHostData({ ...hostData, name: e.target.value })}
          />
        </div>
      )}

      {/* Step 2: WhatsApp Number */}
      {step === 2 && (
        <div className="space-y-4">
          <h2>الخطوة 2: رقم الواتساب</h2>
          <p className="text-gray-600">
            سيستخدم الضيوف هذا الرقم للتواصل معك مباشرة
          </p>

          <WhatsAppInput
            value={hostData.whatsappNumber}
            onChange={(value) => setHostData({ ...hostData, whatsappNumber: value })}
            onValidationChange={setIsPhoneValid}
            required
          />
        </div>
      )}

      {/* Step 3: Property Details */}
      {step === 3 && (
        <div className="space-y-4">
          <h2>الخطوة 3: تفاصيل العقار</h2>
          {/* ... */}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4 mt-8">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)}>
            رجوع
          </button>
        )}

        <button
          onClick={() => setStep(step + 1)}
          disabled={!canProceedToNextStep()}
          className={`flex-1 py-3 rounded-lg font-semibold ${
            canProceedToNextStep()
              ? "bg-primary text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {step === 2 && !isPhoneValid
            ? "اختبر رقم الواتساب للمتابعة"
            : "التالي"}
        </button>
      </div>
    </div>
  );
}
```

---

## 🎨 Component API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `""` | The phone number value (clean format: "218912345678") |
| `onChange` | `(value: string) => void` | - | Callback when number changes |
| `onValidationChange` | `(isValid: boolean) => void` | - | Callback when validation status changes |
| `label` | `string` | `"رقم الواتساب"` | Label text |
| `required` | `boolean` | `false` | Show required asterisk |
| `error` | `string` | - | Error message to display |

---

## 🔍 How It Works

### User Flow:

1. **Select Country Code** (default: Libya +218)
2. **Enter Phone Number**
   - Component auto-removes leading 0
   - Component auto-removes spaces/dashes
   - Preview shows clean number: `+218912345678`
3. **Click "Test Link"**
   - Opens `https://wa.me/218912345678` in new tab
   - User verifies WhatsApp opens correctly
4. **Check Confirmation Box**
   - "I tested this link and it works"
   - Enables form submission
5. **Submit Form**
   - Clean number saved: `218912345678`

### Auto-Cleaning Examples:

| User Input | Auto-Cleaned | Final Output |
|------------|--------------|--------------|
| `091 234 5678` | `91234567` | `21891234567` |
| `0912-345-678` | `912345678` | `218912345678` |
| `  912 345 678  ` | `912345678` | `218912345678` |

---

## 🎯 Validation States

### ❌ Not Valid (Cannot Submit):
- Number not entered
- Number entered but not tested
- Test button clicked but checkbox not checked

### ✅ Valid (Can Submit):
- Number entered
- Test link clicked
- Checkbox checked ("I verified it works")

---

## 🛠️ Customization

### Change Default Country:

Edit line 21 in `WhatsAppInput.tsx`:
```tsx
const [countryCode, setCountryCode] = useState("20"); // Egypt
```

### Add More Countries:

Edit the `COUNTRY_CODES` array:
```tsx
const COUNTRY_CODES: CountryCode[] = [
  { code: "218", flag: "🇱🇾", name: "Libya", nameAr: "ليبيا" },
  { code: "1", flag: "🇺🇸", name: "USA", nameAr: "أمريكا" },
  // Add more...
];
```

### Change Green Color:

Find and replace `#25D366` with your preferred color.

---

## 📊 Testing Checklist

### ✅ Functionality:
- [ ] Country code selector works
- [ ] Leading 0 is auto-removed
- [ ] Spaces/dashes are auto-removed
- [ ] Clean number preview shows correctly
- [ ] Test button opens WhatsApp
- [ ] Checkbox must be checked to submit
- [ ] Form is disabled until validated

### ✅ Edge Cases:
- [ ] Empty input (shows helper text)
- [ ] Invalid number format (auto-cleans)
- [ ] User unchecks checkbox (form disabled again)
- [ ] User changes number after testing (test reset)

### ✅ Visual:
- [ ] Green WhatsApp theme
- [ ] Icons appear correctly
- [ ] Responsive on mobile
- [ ] Success/error states clear

---

## 🚨 Common Issues

### Issue: "Number works in WhatsApp but form won't submit"
**Solution:** Make sure the checkbox is checked!

### Issue: "Country code keeps resetting"
**Solution:** Store the full number (with country code) in your state.

### Issue: "Number has leading zeros in database"
**Solution:** The component auto-removes them. Check your onChange handler.

---

## 📱 Example Database Schema

```sql
-- profiles table
ALTER TABLE profiles
ADD COLUMN whatsapp_number TEXT;

-- Example stored value: "218912345678" (clean, no +)
```

When displaying or using the number:
```tsx
// In WhatsApp link
<a href={`https://wa.me/${profile.whatsapp_number}`}>

// Display to user
<span>+{profile.whatsapp_number}</span>
```

---

## 🎉 Benefits

1. ✅ **No Paid APIs** - Pure client-side validation
2. ✅ **User Self-Verifies** - They test it themselves
3. ✅ **100% Accurate** - If they check the box, it works
4. ✅ **Professional UI** - Matches WhatsApp branding
5. ✅ **Error-Proof** - Can't submit invalid number

---

**The component is ready to use!** Just import and add to your forms. 🚀
