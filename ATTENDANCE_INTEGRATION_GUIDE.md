# How to Integrate Attendance Dashboard into Organizer Pages

## Quick Integration Steps

### Option 1: Add to Existing Event Detail Page

If you have an organizer event detail page (e.g., `frontend/src/pages/OrganizerDashboard.js` or similar), add an "Attendance" tab:

```javascript
import AttendanceDashboard from './AttendanceDashboard';

// Inside your event detail component:
<Tabs value={tabValue} onChange={handleTabChange}>
  <Tab label="Details" />
  <Tab label="Registrations" />
  <Tab label="Attendance" />  {/* Add this */}
</Tabs>

<TabPanel value={tabValue} index={2}>
  <AttendanceDashboard eventId={eventId} />
</TabPanel>
```

### Option 2: Create Standalone Attendance Page

Create a new route in your React Router:

```javascript
// In App.js or routes file:
import AttendanceDashboard from './pages/AttendanceDashboard';

<Route 
  path="/organizer/events/:eventId/attendance" 
  element={<AttendanceDashboard />} 
/>
```

Then link to it from your event list or dashboard.

## Testing the Feature

### 1. Backend Testing (using curl or Postman)

**Test QR Scan:**
```bash
curl -X POST https://felicity-event-management-mjuo.onrender.com/api/attendance/scan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ticketId": "TICKET_ID_HERE", "scanMethod": "Manual"}'
```

**Get Dashboard:**
```bash
curl -X GET https://felicity-event-management-mjuo.onrender.com/api/attendance/event/EVENT_ID/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Export CSV:**
```bash
curl -X GET https://felicity-event-management-mjuo.onrender.com/api/attendance/event/EVENT_ID/export \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output attendance.csv
```

### 2. Frontend Testing

1. Login as organizer
2. Navigate to an event you created
3. Go to Attendance tab/page
4. Try each scanning method:
   - Camera: Click "Start Camera" and point at QR code
   - Upload: Click "Upload QR Code Image" and select image file
   - Manual: Type ticket ID and click "Verify Ticket"
5. Verify duplicate prevention (scan same QR twice)
6. Test manual override:
   - Click edit icon on any registration
   - Select action and provide reason
   - Submit and verify audit log
7. Test filters (All/Attended/Not Attended)
8. Test search functionality
9. Click "Export CSV" and verify downloaded file
10. Click "Audit Log" to view manual overrides

## Common Issues & Solutions

### Issue: Camera not working
**Solution**: Ensure HTTPS is enabled (camera API requires secure context). On localhost, use `http://localhost:3000` (allowed) or deploy to HTTPS domain.

### Issue: QR codes not generating
**Solution**: The QR code generation happens during registration. Check `backend/controllers/registrationController.js` uses the `qrcode` library to generate QR codes with ticket IDs.

### Issue: Permission denied errors
**Solution**: Ensure user is logged in as organizer and owns the event. Check JWT token is valid and not expired.

### Issue: CSV export not downloading
**Solution**: Check browser pop-up blocker. Ensure backend sends correct headers: `Content-Type: text/csv` and `Content-Disposition: attachment`.

## Next Feature: Merchandise Payment Approval

After testing this feature thoroughly, we can implement the second Tier A feature:
- Merchandise Payment Approval Workflow (8 marks)
- Participants upload payment proof
- Organizers approve/reject
- QR code generated only after approval
- Email notifications
