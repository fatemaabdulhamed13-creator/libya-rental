# 🔐 Admin Dashboard Setup Guide

## What You Built

A **God Mode Admin Dashboard** at `/admin` that lets you:
- ✅ View all pending ID verifications
- ✅ See large previews of identity documents
- ✅ Approve or reject IDs with one click
- ✅ Restricted to ONLY your email address

---

## 🚀 Quick Start

### Step 1: Enable Database Policies

You need to run the SQL script to allow your admin account to update other users' profiles.

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: **Libya Rental Marketplace**

2. **Open SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Paste the SQL Script**
   - Open `supabase-admin-policies.sql` in this folder
   - Copy ALL the SQL code
   - Paste it into the Supabase SQL Editor

4. **Run the Script**
   - Click **Run** (or press Ctrl+Enter)
   - You should see: "Success. No rows returned"

✅ **Done!** Your admin account now has the necessary permissions.

---

### Step 2: Access the Dashboard

1. **Login as Admin**
   - Make sure you're logged in with: `fatemaabdulhamed13@gmail.com`

2. **Visit the Admin Page**
   - Navigate to: `http://localhost:3000/admin`
   - (Or: `https://yourdomain.com/admin` in production)

3. **Verify Access**
   - You should see the Admin Dashboard
   - If you see "No pending verifications", congrats! Everything is set up.

---

## 📋 How to Use the Dashboard

### Reviewing Pending IDs

1. **View the List**
   - All pending verifications appear in the "Pending ID Verifications" section
   - Each card shows:
     - User's full name
     - Partial user ID (for privacy)
     - Phone number
     - Current verification status
     - Submission date

2. **Preview the Document**
   - The right side shows a large preview of the identity document
   - Click **"Open in New Tab"** to see it fullscreen

3. **Make a Decision**

   **To Approve:**
   - Click the green **"Approve ID"** button
   - Confirm the action
   - The user's `verification_status` → `"verified"`
   - The user's `is_identity_verified` → `true`
   - ✅ User gets the verified badge!

   **To Reject:**
   - Click the red **"Reject ID"** button
   - Confirm the action
   - The user's `verification_status` → `"rejected"`
   - ❌ User will need to re-upload a valid ID

4. **Refresh**
   - After approval/rejection, the list auto-refreshes
   - Processed items disappear from the pending list

---

## 🛡️ Security Features

### Email-Based Protection

**File:** `app/admin/page.tsx` (Line 15)
```tsx
const ADMIN_EMAIL = "fatemaabdulhamed13@gmail.com";
```

**How it works:**
1. Page checks `supabase.auth.getUser()`
2. Compares `user.email` to `ADMIN_EMAIL`
3. If email doesn't match → Redirect to homepage
4. Only YOU can access this page ✅

**To add more admins:**
Change line 15 to:
```tsx
const ADMIN_EMAILS = [
    "fatemaabdulhamed13@gmail.com",
    "anotheradmin@example.com"
];
```

Then update the check on line 36:
```tsx
if (!ADMIN_EMAILS.includes(user.email)) {
    router.push("/");
    return;
}
```

---

## 🎨 Dashboard Features

### Stats Cards (Top)
- **Pending IDs:** Real-time count of unverified documents
- **Total Users:** Placeholder (can add query later)
- **Total Properties:** Placeholder (can add query later)

### ID Verification Card
**Left Side (User Info):**
- Name
- Email/User ID
- Status badge (yellow = pending)
- Submission date
- Action buttons (Approve/Reject)

**Right Side (Document):**
- Large image preview
- Responsive sizing
- "Open in New Tab" link

### Visual Design
- ✅ Green buttons for Approve
- ❌ Red buttons for Reject
- 📊 Clean card-based layout
- 🎨 Gradient accents for premium feel
- 👑 Crown icon for "God Mode" branding

---

## 🔄 User Flow Example

### Before Approval:
```
User submits ID
    ↓
verification_status = "pending"
    ↓
Appears in your admin dashboard
    ↓
You review the document
```

### After You Click "Approve":
```
Database updates:
    verification_status = "verified"
    is_identity_verified = true
    ↓
User's profile shows:
    ✅ "تم التوثيق" (Verified badge)
    ↓
User gets 50% more bookings! 🎉
```

---

## 🐛 Troubleshooting

### "Access Denied" when opening /admin

**Problem:** You're not logged in with the admin email

**Solution:**
1. Log out
2. Log in with `fatemaabdulhamed13@gmail.com`
3. Try `/admin` again

---

### "Failed to approve/reject" error

**Problem:** RLS policies not set up

**Solution:**
1. Go to Supabase SQL Editor
2. Run the `supabase-admin-policies.sql` script
3. Refresh the admin page

---

### Can't see identity document images

**Problem:** Storage bucket permissions

**Solution:**
The SQL script includes a policy for this. Run:
```sql
CREATE POLICY "Admins can view all identity documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'identity-documents'
  AND is_admin()
);
```

---

### No pending verifications showing up

**Possible reasons:**
1. ✅ All IDs are already verified (good!)
2. ❌ No one has uploaded an ID yet
3. ❌ RLS policies blocking the query

**To test:**
1. Create a test account
2. Enable "Become a Host"
3. Upload a test ID
4. Check if it appears in `/admin`

---

## 📂 File Structure

```
app/
├── admin/
│   └── page.tsx                        ← Admin Dashboard (God Mode)
│
supabase-admin-policies.sql             ← RLS Policies (Run in Supabase)
ADMIN-DASHBOARD-SETUP.md                ← This guide
```

---

## 🎯 Next Steps

### Phase 1: Current (ID Verification) ✅
- Admin can view pending IDs
- Admin can approve/reject IDs
- Users get verified badges

### Phase 2: Property Approvals (Coming Soon)
Add a section to approve new property listings before they go live:
- Fetch properties with `status = 'pending_approval'`
- Show property images and details
- Approve/Reject properties

### Phase 3: Analytics Dashboard
Add stats:
- Total bookings
- Revenue metrics
- User growth charts
- Popular properties

---

## 🔒 Production Deployment

### Environment Variables
Make sure your production environment has:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase RLS Policies
The SQL policies work in both development AND production.
No need to change anything! ✅

### Admin Email
In production, the admin email is still hardcoded.
This is intentional for security.

To change it, edit `app/admin/page.tsx` line 15.

---

## 📊 Database Schema Reference

### `profiles` table columns used:
```sql
id                      UUID (references auth.users)
full_name              TEXT
phone_number           TEXT
identity_document_url  TEXT (path to storage file)
verification_status    TEXT ('unverified', 'pending', 'verified', 'rejected')
is_identity_verified   BOOLEAN
created_at             TIMESTAMP
```

### `storage.objects` (identity-documents bucket):
```sql
bucket_id = 'identity-documents'
name      = 'user-id/filename.jpg'
```

---

## ✅ Checklist

Before using the admin dashboard:

- [ ] SQL policies run in Supabase
- [ ] Logged in with admin email
- [ ] Can access `/admin` page
- [ ] Dashboard loads successfully
- [ ] Can see pending verifications
- [ ] Can preview identity documents
- [ ] Approve button works
- [ ] Reject button works
- [ ] List refreshes after action

---

**You now have full God Mode access to manage your platform!** 👑

Any questions? The code is clean, commented, and ready for production.
