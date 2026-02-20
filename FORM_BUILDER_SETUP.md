# Form Builder - Quick Setup & Integration Guide

## ✅ Installation Complete

```bash
npm install react-beautiful-dnd --legacy-peer-deps
```

## 🚀 Integration Steps

### Step 1: Import FormBuilder in CreateEvent.js

```javascript
// Add to imports
import FormBuilder from '../components/FormBuilder';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
```

### Step 2: Add FormBuilder Section to CreateEvent.js

Add this section after the Tags section (around line 700):

```jsx
{/* Custom Registration Form (Normal Events Only) */}
{formData.eventType === 'Normal' && (
  <>
    <Divider sx={{ my: 4 }} />
    <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
      Custom Registration Form (Optional)
    </Typography>
    <Typography variant="body2" color="text.secondary" mb={2}>
      Add custom fields to collect additional information from participants.
      The form will be locked after the first registration.
    </Typography>
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <FormBuilder 
        eventId={createdEventId} 
        onSave={() => console.log('Form saved')}
      />
    </Paper>
  </>
)}
```

**Note**: You'll need to store the created event ID in state after event creation to use FormBuilder immediately.

### Step 3: Update CreateEvent to Save Event ID

Modify the handleSubmit function:

```javascript
const [createdEventId, setCreatedEventId] = useState(null);

const handleSubmit = async (e, actionType = 'Draft') => {
  e.preventDefault();
  // ... existing validation code ...

  try {
    // ... existing API call ...
    const response = await api.post('/events', eventData);
    
    if (response.data.success) {
      setCreatedEventId(response.data.data._id); // Save event ID
      setSuccess(message);
      
      // Only navigate away if no form builder needed or if publishing
      if (actionType === 'Published' || formData.eventType === 'Merchandise') {
        setTimeout(() => {
          navigate('/organizer/my-events');
        }, 2000);
      }
    }
  } catch (err) {
    // ... error handling ...
  }
};
```

### Step 4: Add FormBuilder to EditEvent.js

Add after the tags section:

```jsx
{/* Custom Registration Form */}
{formData.eventType === 'Normal' && (
  <Grid item xs={12}>
    <Divider sx={{ my: 3 }} />
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6">Custom Registration Form</Typography>
          {event.formLocked && (
            <Chip icon={<LockIcon />} label="Locked" color="error" size="small" />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <FormBuilder 
          eventId={id} 
          onSave={fetchEventAndPermissions}
        />
      </AccordionDetails>
    </Accordion>
  </Grid>
)}
```

## 📝 Testing Flow

### 1. Create Event with Custom Form:
1. Navigate to `/organizer/create-event`
2. Select "Normal Event"
3. Fill basic details
4. Click "Save as Draft"
5. See Form Builder section appear
6. Add fields (e.g., T-Shirt Size dropdown, Dietary Preference)
7. Drag to reorder
8. Click "Preview" to test
9. Publish event

### 2. Register as Participant:
1. Login as participant
2. Browse events
3. Click on the event
4. See custom form fields in registration
5. Fill and submit

### 3. Verify Form Lock:
1. Login as organizer
2. Go to My Events
3. Edit the event
4. See FormBuilder with lock indicator
5. Try to add field - should be disabled

## 🎯 Key Features Demo

### Field Types:
- **Short Text**: Name, City
- **Long Text**: Why do you want to attend?
- **Number**: Age, Years of experience
- **Email**: Alternate email
- **Phone**: Emergency contact
- **Date**: Date of birth
- **Dropdown**: T-Shirt size (S, M, L, XL)
- **Radio**: Laptop (Yes/No)
- **Checkbox**: Topics of interest (multiple)
- **File**: Resume upload (.pdf, .doc)

### Validation Examples:
- Required fields
- Min/max length for text
- Min/max value for numbers
- File type restrictions
- File size limits

## 🐛 Troubleshooting

### FormBuilder not showing:
- Check event type is "Normal"
- Verify event ID is available
- Check console for errors

### Drag & drop not working:
- Verify react-beautiful-dnd is installed
- Check for React version compatibility warnings (ignore if working)
- Ensure form is not locked

### Form locked unexpectedly:
- Check if any registrations exist for the event
- Verify event.currentRegistrations > 0
- Check event.formLocked field in database

## 📊 Database Schema

Check MongoDB collections:

```javascript
// Event document
{
  _id: ObjectId("..."),
  eventName: "Tech Workshop",
  eventType: "Normal",
  customRegistrationForm: [
    {
      fieldName: "tshirt_size",
      fieldType: "dropdown",
      fieldLabel: "T-Shirt Size",
      required: true,
      options: ["S", "M", "L", "XL"],
      order: 0,
      validation: {}
    }
  ],
  formLocked: false,
  currentRegistrations: 0
}

// After first registration
{
  formLocked: true,  // ✅ Locked!
  currentRegistrations: 1
}
```

## 🔧 Customization

### Change Field Type Icons:
Edit `FIELD_TYPES` array in `FormBuilder.js`:
```javascript
const FIELD_TYPES = [
  { value: 'text', label: 'Short Text', icon: '🔤' },  // Change icon here
  // ...
];
```

### Add New Field Type:
1. Add to Event model enum
2. Add to FIELD_TYPES array
3. Add render case in renderFieldPreview()
4. Update backend validation

### Customize Validation:
Modify `validateField()` function in FormBuilder.js

## ✅ Verification Checklist

After integration, verify:
- [ ] FormBuilder appears in Create Event (Normal only)
- [ ] Can add fields of all types
- [ ] Can edit field details
- [ ] Can delete fields
- [ ] Drag & drop reordering works
- [ ] Preview shows correct form
- [ ] Form saves successfully
- [ ] Lock indicator shows after registration
- [ ] Cannot edit locked form
- [ ] Participants see custom fields
- [ ] Registration saves custom form data
- [ ] Organizer can view form responses

## 🎉 Success Criteria

Your implementation is successful if:
1. ✅ Organizer can create custom forms with 10+ field types
2. ✅ Fields can be reordered by drag & drop
3. ✅ Form locks automatically after first registration
4. ✅ Participants see and can fill custom form
5. ✅ Form data is saved with registration
6. ✅ Professional UI with clear indicators

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify backend routes are registered
3. Check network tab for API calls
4. Review FormBuilder.js props
5. Test with simple field first (e.g., text field)

---

**Implementation Status**: ✅ Complete & Ready to Use
**Time to Integrate**: ~30 minutes
**Difficulty**: Medium
