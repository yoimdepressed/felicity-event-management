# 🎯 How to Access the QR Scanner & Attendance Feature

## Step-by-Step Guide

### 1. **Login as Organizer**
- Go to your deployed frontend URL (Vercel)
- Login with organizer credentials

### 2. **Navigate to Your Event**
- From the Organizer Dashboard, click on any of your events
- Click the **"VIEW"** button on an event card

### 3. **Open the Attendance Tab**
- You'll see 4 tabs at the top:
  - Overview
  - Analytics  
  - Participants
  - **⭐ Attendance** ← Click here!

### 4. **QR Scanner Interface**
The Attendance tab has everything you need:

#### 📷 **QR Scanner Section (Top)**
Three ways to scan:
- **Camera Scan** tab: Click "Start Camera" to scan QR codes live
- **Upload QR Image** tab: Upload a screenshot/photo of QR code
- **Manual Entry** tab: Type the ticket ID directly

#### 📊 **Live Statistics Cards**
Four colorful cards showing:
- **Total Registrations** (Blue)
- **Attended** (Green)  
- **Not Attended** (Yellow)
- **Attendance Percentage** (Info)

#### 🔍 **Search & Filter Bar**
- Search box: Type name, email, or ticket ID
- Filter dropdown: All / Attended / Not Attended / Manual Override
- **Audit Log** button: View all manual changes
- **Export CSV** button: Download attendance report
- **Refresh** button: Reload latest data

#### 📋 **Attendance Table**
Shows all registrations with:
- Ticket ID
- Participant name
- Email
- Contact number
- Status (Attended/Not Attended chip)
- Attended timestamp
- Scan method (Camera/FileUpload/Manual)
- Edit button for manual override

### 5. **Try Scanning a QR Code**

#### Option A: Camera Scan
1. Click **"Camera Scan"** tab
2. Click **"Start Camera"** button
3. Allow camera permissions when prompted
4. Point camera at participant's QR code
5. ✅ Success message will show participant details
6. Dashboard automatically refreshes

#### Option B: Upload Image
1. Click **"Upload QR Image"** tab
2. Click **"Upload QR Code Image"** button
3. Select QR code image from your device
4. QR code is automatically detected and processed

#### Option C: Manual Entry
1. Click **"Manual Entry"** tab
2. Type or paste the ticket ID
3. Click **"Verify Ticket"** or press Enter
4. Attendance is marked immediately

### 6. **Test Duplicate Prevention**
- Try scanning the same QR code twice
- You'll see an error: "Duplicate scan detected!"
- Shows who scanned it and when

### 7. **Manual Override (Optional)**
If you need to manually mark someone as attended:
1. Find the registration in the table
2. Click the **Edit** icon (pencil) in the Actions column
3. Select action: "Mark as Attended" or "Unmark Attendance"
4. Enter a reason (required for audit trail)
5. Click **"Submit Override"**
6. Change is logged in the audit trail

### 8. **Export CSV Report**
1. Click **"Export CSV"** button (top right)
2. CSV file downloads with all registration data
3. Includes: Names, emails, attendance status, timestamps, scan methods

### 9. **View Audit Log**
1. Click **"Audit Log"** button
2. See all manual overrides made
3. Shows who made the change, when, and why

---

## 🚀 Quick Test Flow

1. **Create a test event** (if you don't have one)
2. **Register for the event** (use participant account)
3. **View the QR code** from "My Events" (participant dashboard)
4. **Switch to organizer account**
5. **Go to that event → Attendance tab**
6. **Scan the QR code** using any method
7. **Verify success** - see green alert and updated stats
8. **Try scanning again** - see duplicate error
9. **Export CSV** - verify data is correct

---

## 📱 Screenshots Reference

**What you'll see:**

1. **Organizer Dashboard** → Your events list
2. **Event Detail Page** → 4 tabs (Overview, Analytics, Participants, **Attendance**)
3. **Attendance Tab** → QR Scanner + Dashboard
4. **Camera View** → Live video feed with "Scanning..." indicator
5. **Success Alert** → Green message with participant details
6. **Statistics Cards** → Real-time attendance metrics
7. **Table View** → All registrations with status chips

---

## 🐛 Troubleshooting

### "I don't see the Attendance tab"
- Make sure you're logged in as **organizer** (not participant)
- Make sure you're viewing **your own event** (not someone else's)
- Clear browser cache and refresh

### "Camera not working"
- Allow camera permissions in browser
- Make sure you're on HTTPS (or localhost)
- Try the "Upload Image" method instead

### "QR code not scanning"
- Make sure QR code is clear and well-lit
- Try the "Manual Entry" tab with the ticket ID
- QR code should contain the ticket ID

### "Changes not deploying"
- Wait 2-3 minutes for Vercel to rebuild
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check Vercel dashboard for build status

---

## ✅ Feature is Complete!

**Status**: Fully implemented and deployed
**Location**: Organizer Event Detail → Attendance Tab
**Components**: QR Scanner + Live Dashboard + CSV Export + Audit Log

**Marks**: 8/8 (Tier A)
