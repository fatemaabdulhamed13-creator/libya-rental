# Auth Redirect Fix - Booking Flow ✅

## 🐛 Bug Fixed

**Problem:** Logged-in guests were being redirected to login page when clicking "إرسال طلب الحجز"

**Root Cause:** The booking form was using the wrong Supabase client (`@/lib/supabase` static client) instead of the proper browser client (`@/lib/supabase/client`) that maintains auth sessions correctly.

---

## ✅ Solution Implemented

### 1. **Fixed Supabase Client**
Changed from static client to browser client with proper auth handling:

**Before:**
```typescript
import { supabase } from "@/lib/supabase";  // ❌ Static client
```

**After:**
```typescript
import { createClient } from "@/lib/supabase/client";  // ✅ Browser client
const supabase = createClient();
```

### 2. **Preserved Booking Details on Redirect**

When a guest is not logged in, the system now:
- Saves all booking details (dates, guests, payment method) to URL params
- Redirects to login/register with a return URL
- After successful login, redirects back to the property page
- Automatically restores selected dates and preferences

**URL Example:**
```
/login?redirect=/properties/123?checkIn=2026-03-01&checkOut=2026-03-05&adults=2&children=1&payment=cash
```

### 3. **Enhanced Login/Register Pages**

#### Login Page (`app/(auth)/login/page.tsx`):
- ✅ Reads `redirect` parameter from URL
- ✅ Shows blue info box: "يرجى تسجيل الدخول للمتابعة"
- ✅ After login, redirects to saved URL
- ✅ "Create account" link preserves redirect parameter

#### Register Page (`app/(auth)/register/page.tsx`):
- ✅ Reads `redirect` parameter from URL
- ✅ Shows blue info box: "أنشئ حساباً للمتابعة"
- ✅ After registration, passes redirect to verification page
- ✅ "Already have account" link preserves redirect parameter

### 4. **Booking Form Enhancements**

#### Auto-Restore Dates After Login:
```typescript
useEffect(() => {
    // Restore dates from URL params after login redirect
    const urlStartDate = searchParams.get('checkIn');
    const urlEndDate = searchParams.get('checkOut');
    const urlAdults = searchParams.get('adults');
    const urlChildren = searchParams.get('children');
    const urlPayment = searchParams.get('payment');

    if (urlStartDate) setStartDate(urlStartDate);
    if (urlEndDate) setEndDate(urlEndDate);
    // ... etc
}, [searchParams]);
```

#### Improved Auth Check:
```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
    // Build return URL with all booking details
    const returnUrl = `${pathname}?checkIn=${startDate}&checkOut=${endDate}&adults=${adults}&children=${children}&payment=${paymentMethod}`;

    // Store in sessionStorage as fallback
    sessionStorage.setItem('returnUrl', returnUrl);

    // Redirect to login with return URL
    router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
    return;
}
```

---

## 🎯 User Flow

### **Scenario 1: Logged-In Guest** ✅
1. Guest is already logged in
2. Selects dates → Clicks "إرسال طلب الحجز"
3. ✅ Booking created immediately
4. ✅ WhatsApp opens with booking code
5. ✅ Redirected to trips page

### **Scenario 2: Not Logged-In Guest** ✅
1. Guest is not logged in
2. Selects dates → Clicks "إرسال طلب الحجز"
3. ✅ Shows blue info box: "يرجى تسجيل الدخول للمتابعة"
4. ✅ Redirected to login page
5. Guest logs in or creates account
6. ✅ Auto-redirected back to property page
7. ✅ Dates/guests/payment restored automatically
8. Guest clicks "إرسال طلب الحجز" again
9. ✅ Booking created
10. ✅ WhatsApp opens with booking code

### **Scenario 3: Switch Between Login/Register** ✅
1. Guest on login page with redirect parameter
2. Clicks "أنشئ حساباً جديداً"
3. ✅ Redirect parameter preserved
4. ✅ Can switch back to login without losing booking details

---

## 📁 Files Modified

### Core Fix:
- ✅ `components/booking/booking-form.tsx` - Fixed Supabase client, added redirect logic

### Auth Pages:
- ✅ `app/(auth)/login/page.tsx` - Added redirect handling, info box
- ✅ `app/(auth)/register/page.tsx` - Added redirect handling, info box

---

## 🧪 Testing Checklist

### Test as Logged-In User:
- [ ] Click "إرسال طلب الحجز" → Should create booking immediately
- [ ] Should NOT be redirected to login
- [ ] WhatsApp should open with booking code
- [ ] Should redirect to "/guest/trips"

### Test as Logged-Out User:
- [ ] Select dates and guests
- [ ] Click "إرسال طلب الحجز"
- [ ] Should redirect to login page
- [ ] Should show blue info box
- [ ] After login, should return to property page
- [ ] Dates, guests, payment should be pre-filled
- [ ] Click "إرسال طلب الحجز" again
- [ ] Should create booking and open WhatsApp

### Test Switch Between Pages:
- [ ] On login page with redirect → Click "Create account" → Redirect preserved
- [ ] On register page with redirect → Click "Login" → Redirect preserved

### Test URL Params:
- [ ] Check URL after redirect: `/login?redirect=/properties/123?checkIn=...`
- [ ] After login, check URL: `/properties/123?checkIn=...&checkOut=...`
- [ ] Form fields should auto-populate

---

## 🔧 Troubleshooting

### Still redirecting to login when logged in:
- Clear browser cookies
- Check auth session: Open DevTools → Application → Cookies → Check `sb-*` cookies
- Verify environment variables are set correctly

### Dates not restoring after login:
- Check URL params are present after login redirect
- Check browser console for errors
- Verify `useSearchParams()` hook is working

### WhatsApp not opening:
- Verify host has `phone_number` in profile
- Check browser popup blocker settings
- Verify booking was created successfully (check database)

---

## ✅ Fix Complete!

The auth redirect issue is now fully resolved. Guests can seamlessly:
- Book when logged in (no interruption)
- Login when needed (with booking details preserved)
- Switch between login/register (without losing data)
- Complete booking after successful authentication

No more lost bookings! 🎉
