import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  IconButton,
  Paper,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Tooltip,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  DragIndicator as DragIcon,
  ExpandMore as ExpandMoreIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import api from '../services/api';

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text', icon: '📝' },
  { value: 'textarea', label: 'Long Text', icon: '📄' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'phone', label: 'Phone', icon: '📞' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'dropdown', label: 'Dropdown', icon: '▼' },
  { value: 'radio', label: 'Radio Buttons', icon: '⚪' },
  { value: 'checkbox', label: 'Checkboxes', icon: '☑️' },
  { value: 'file', label: 'File Upload', icon: '📎' },
];

const FILE_TYPES = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'zip'];

const FormBuilder = ({ eventId, onSave }) => {
  const [fields, setFields] = useState([]);
  const [formLocked, setFormLocked] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [currentField, setCurrentField] = useState({
    fieldName: '',
    fieldType: 'text',
    fieldLabel: '',
    placeholder: '',
    helpText: '',
    required: false,
    options: [],
    validation: {
      minLength: null,
      maxLength: null,
      min: null,
      max: null,
      pattern: '',
      fileTypes: [],
      maxFileSize: 5,
    },
  });

  const [optionInput, setOptionInput] = useState('');

  useEffect(() => {
    fetchForm();
    checkEditPermission();
  }, [eventId]);

  const fetchForm = async () => {
    try {
      const response = await api.get(`/events/${eventId}/form`);
      setFields(response.data.data.fields || []);
      setFormLocked(response.data.data.formLocked);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch form');
    }
  };

  const checkEditPermission = async () => {
    try {
      const response = await api.get(`/events/${eventId}/form/can-edit`);
      setCanEdit(response.data.data.canEdit);
      if (!response.data.data.canEdit) {
        setError(response.data.data.reason || 'Form cannot be edited');
      }
    } catch (err) {
      console.error('Permission check failed:', err);
    }
  };

  const resetFieldDialog = () => {
    setCurrentField({
      fieldName: '',
      fieldType: 'text',
      fieldLabel: '',
      placeholder: '',
      helpText: '',
      required: false,
      options: [],
      validation: {
        minLength: null,
        maxLength: null,
        min: null,
        max: null,
        pattern: '',
        fileTypes: [],
        maxFileSize: 5,
      },
    });
    setOptionInput('');
    setEditingFieldIndex(null);
  };

  const handleOpenFieldDialog = (index = null) => {
    if (!canEdit) {
      setError('Form is locked and cannot be edited');
      return;
    }

    if (index !== null) {
      // Editing existing field
      setEditingFieldIndex(index);
      setCurrentField({ ...fields[index] });
    } else {
      // Adding new field
      resetFieldDialog();
    }
    setShowFieldDialog(true);
  };

  const handleCloseFieldDialog = () => {
    setShowFieldDialog(false);
    resetFieldDialog();
  };

  const handleFieldChange = (key, value) => {
    setCurrentField(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleValidationChange = (key, value) => {
    setCurrentField(prev => ({
      ...prev,
      validation: {
        ...prev.validation,
        [key]: value,
      },
    }));
  };

  const handleAddOption = () => {
    if (optionInput.trim()) {
      setCurrentField(prev => ({
        ...prev,
        options: [...prev.options, optionInput.trim()],
      }));
      setOptionInput('');
    }
  };

  const handleRemoveOption = (index) => {
    setCurrentField(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleToggleFileType = (fileType) => {
    setCurrentField(prev => ({
      ...prev,
      validation: {
        ...prev.validation,
        fileTypes: prev.validation.fileTypes.includes(fileType)
          ? prev.validation.fileTypes.filter(t => t !== fileType)
          : [...prev.validation.fileTypes, fileType],
      },
    }));
  };

  const validateField = () => {
    if (!currentField.fieldName.trim()) {
      setError('Field name is required');
      return false;
    }
    if (!currentField.fieldLabel.trim()) {
      setError('Field label is required');
      return false;
    }
    if (['dropdown', 'radio', 'checkbox'].includes(currentField.fieldType) && currentField.options.length === 0) {
      setError(`${currentField.fieldType} field must have at least one option`);
      return false;
    }
    if (currentField.fieldType === 'file' && currentField.validation.fileTypes.length === 0) {
      setError('File field must have at least one allowed file type');
      return false;
    }
    return true;
  };

  const handleSaveField = async () => {
    if (!validateField()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingFieldIndex !== null) {
        // Update existing field
        const response = await api.put(
          `/events/${eventId}/form/field/${editingFieldIndex}`,
          currentField
        );
        setFields(response.data.data.fields);
        setSuccess('Field updated successfully');
      } else {
        // Add new field
        const response = await api.post(
          `/events/${eventId}/form/field`,
          currentField
        );
        setFields(response.data.data.fields);
        setSuccess('Field added successfully');
      }
      
      handleCloseFieldDialog();
      if (onSave) onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save field');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (index) => {
    if (!window.confirm('Are you sure you want to delete this field?')) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.delete(`/events/${eventId}/form/field/${index}`);
      setFields(response.data.data.fields);
      setSuccess('Field deleted successfully');
      if (onSave) onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete field');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination || !canEdit) return;

    const newFields = Array.from(fields);
    const [removed] = newFields.splice(result.source.index, 1);
    newFields.splice(result.destination.index, 0, removed);

    // Update local state immediately for better UX
    setFields(newFields);

    // Send reorder request to backend
    try {
      const newOrder = newFields.map((_, index) => {
        const originalIndex = fields.findIndex(f => f.fieldName === newFields[index].fieldName);
        return originalIndex;
      });

      const response = await api.put(`/events/${eventId}/form/reorder`, { newOrder });
      setFields(response.data.data.fields);
      setSuccess('Fields reordered successfully');
      if (onSave) onSave();
    } catch (err) {
      // Revert on error
      fetchForm();
      setError(err.response?.data?.message || 'Failed to reorder fields');
    }
  };

  const handleBulkSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put(`/events/${eventId}/form`, { fields });
      setFields(response.data.data.fields);
      setSuccess('Form saved successfully');
      if (onSave) onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save form');
    } finally {
      setLoading(false);
    }
  };

  const renderFieldPreview = (field) => {
    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <TextField
            fullWidth
            label={field.fieldLabel}
            placeholder={field.placeholder}
            helperText={field.helpText}
            required={field.required}
            disabled
          />
        );
      case 'textarea':
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            label={field.fieldLabel}
            placeholder={field.placeholder}
            helperText={field.helpText}
            required={field.required}
            disabled
          />
        );
      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={field.fieldLabel}
            placeholder={field.placeholder}
            helperText={field.helpText}
            required={field.required}
            disabled
          />
        );
      case 'date':
        return (
          <TextField
            fullWidth
            type="date"
            label={field.fieldLabel}
            helperText={field.helpText}
            required={field.required}
            InputLabelProps={{ shrink: true }}
            disabled
          />
        );
      case 'dropdown':
        return (
          <FormControl fullWidth required={field.required} disabled>
            <InputLabel>{field.fieldLabel}</InputLabel>
            <Select label={field.fieldLabel}>
              {field.options.map((option, idx) => (
                <MenuItem key={idx} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'radio':
      case 'checkbox':
        return (
          <Box>
            <Typography variant="body2" gutterBottom>
              {field.fieldLabel} {field.required && '*'}
            </Typography>
            {field.options.map((option, idx) => (
              <FormControlLabel
                key={idx}
                control={field.fieldType === 'radio' ? <input type="radio" disabled /> : <Checkbox disabled />}
                label={option}
              />
            ))}
            {field.helpText && (
              <Typography variant="caption" color="text.secondary" display="block">
                {field.helpText}
              </Typography>
            )}
          </Box>
        );
      case 'file':
        return (
          <Box>
            <Typography variant="body2" gutterBottom>
              {field.fieldLabel} {field.required && '*'}
            </Typography>
            <Button variant="outlined" component="label" disabled>
              Upload File
              <input type="file" hidden />
            </Button>
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              Allowed: {field.validation.fileTypes.join(', ')} (Max: {field.validation.maxFileSize}MB)
            </Typography>
            {field.helpText && (
              <Typography variant="caption" color="text.secondary" display="block">
                {field.helpText}
              </Typography>
            )}
          </Box>
        );
      default:
        return <TextField fullWidth label={field.fieldLabel} disabled />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Custom Registration Form Builder
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            {formLocked ? (
              <Chip icon={<LockIcon />} label="Form Locked" color="error" size="small" />
            ) : (
              <Chip icon={<LockOpenIcon />} label="Form Editable" color="success" size="small" />
            )}
            <Typography variant="caption" color="text.secondary">
              {fields.length} field{fields.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={() => setShowPreview(true)}
            disabled={fields.length === 0}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenFieldDialog()}
            disabled={!canEdit || formLocked}
          >
            Add Field
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Info Alert */}
      {!formLocked && canEdit && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Note:</strong> This form will be locked after the first registration is received. 
          Make sure to review and test your form before publishing the event.
        </Alert>
      )}

      {/* Fields List */}
      {fields.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No fields added yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Click "Add Field" to start building your custom registration form
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenFieldDialog()}
            disabled={!canEdit || formLocked}
          >
            Add Your First Field
          </Button>
        </Paper>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="fields">
            {(provided) => (
              <Box {...provided.droppableProps} ref={provided.innerRef}>
                {fields.map((field, index) => (
                  <Draggable
                    key={field.fieldName + index}
                    draggableId={field.fieldName + index}
                    index={index}
                    isDragDisabled={!canEdit || formLocked}
                  >
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          mb: 2,
                          bgcolor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                          opacity: formLocked ? 0.7 : 1,
                        }}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="flex-start">
                            {/* Drag Handle */}
                            <Box
                              {...provided.dragHandleProps}
                              sx={{
                                mr: 2,
                                cursor: canEdit && !formLocked ? 'grab' : 'not-allowed',
                                color: 'text.secondary',
                              }}
                            >
                              <DragIcon />
                            </Box>

                            {/* Field Details */}
                            <Box flexGrow={1}>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Typography variant="h6">
                                  {FIELD_TYPES.find(t => t.value === field.fieldType)?.icon} {field.fieldLabel}
                                </Typography>
                                {field.required && (
                                  <Chip label="Required" size="small" color="primary" />
                                )}
                                <Chip
                                  label={FIELD_TYPES.find(t => t.value === field.fieldType)?.label}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Field Name: <code>{field.fieldName}</code>
                              </Typography>
                              {field.placeholder && (
                                <Typography variant="body2" color="text.secondary">
                                  Placeholder: {field.placeholder}
                                </Typography>
                              )}
                              {field.helpText && (
                                <Typography variant="body2" color="text.secondary">
                                  Help: {field.helpText}
                                </Typography>
                              )}
                              {field.options && field.options.length > 0 && (
                                <Box mt={1}>
                                  <Typography variant="caption" color="text.secondary">
                                    Options: {field.options.join(', ')}
                                  </Typography>
                                </Box>
                              )}
                            </Box>

                            {/* Actions */}
                            <Box display="flex" gap={1}>
                              <Tooltip title={canEdit && !formLocked ? "Edit Field" : "Form is locked"}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenFieldDialog(index)}
                                    disabled={!canEdit || formLocked}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title={canEdit && !formLocked ? "Delete Field" : "Form is locked"}>
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteField(index)}
                                    disabled={!canEdit || formLocked}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Field Editor Dialog */}
      <Dialog
        open={showFieldDialog}
        onClose={handleCloseFieldDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingFieldIndex !== null ? 'Edit Field' : 'Add New Field'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              {/* Field Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Field Name (for data) *"
                  value={currentField.fieldName}
                  onChange={(e) => handleFieldChange('fieldName', e.target.value)}
                  helperText="Use lowercase, no spaces (e.g., dietary_preference)"
                  disabled={editingFieldIndex !== null}
                />
              </Grid>

              {/* Field Type */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Field Type *</InputLabel>
                  <Select
                    value={currentField.fieldType}
                    onChange={(e) => handleFieldChange('fieldType', e.target.value)}
                    label="Field Type *"
                  >
                    {FIELD_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Field Label */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Field Label (shown to users) *"
                  value={currentField.fieldLabel}
                  onChange={(e) => handleFieldChange('fieldLabel', e.target.value)}
                  placeholder="e.g., Dietary Preferences"
                />
              </Grid>

              {/* Placeholder */}
              {['text', 'email', 'phone', 'number', 'textarea'].includes(currentField.fieldType) && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Placeholder Text"
                    value={currentField.placeholder}
                    onChange={(e) => handleFieldChange('placeholder', e.target.value)}
                  />
                </Grid>
              )}

              {/* Help Text */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Help Text"
                  value={currentField.helpText}
                  onChange={(e) => handleFieldChange('helpText', e.target.value)}
                  placeholder="Additional information to help users"
                />
              </Grid>

              {/* Required Toggle */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentField.required}
                      onChange={(e) => handleFieldChange('required', e.target.checked)}
                    />
                  }
                  label="Required Field"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Options (for dropdown, radio, checkbox) */}
              {['dropdown', 'radio', 'checkbox'].includes(currentField.fieldType) && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Options *
                  </Typography>
                  <Box display="flex" gap={1} mb={2}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Enter an option"
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                    />
                    <Button variant="outlined" onClick={handleAddOption}>
                      Add
                    </Button>
                  </Box>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {currentField.options.map((option, idx) => (
                      <Chip
                        key={idx}
                        label={option}
                        onDelete={() => handleRemoveOption(idx)}
                      />
                    ))}
                  </Box>
                </Grid>
              )}

              {/* File Upload Settings */}
              {currentField.fieldType === 'file' && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Allowed File Types *
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {FILE_TYPES.map((type) => (
                        <Chip
                          key={type}
                          label={type}
                          onClick={() => handleToggleFileType(type)}
                          color={currentField.validation.fileTypes.includes(type) ? 'primary' : 'default'}
                          variant={currentField.validation.fileTypes.includes(type) ? 'filled' : 'outlined'}
                        />
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Max File Size (MB)"
                      value={currentField.validation.maxFileSize}
                      onChange={(e) => handleValidationChange('maxFileSize', parseInt(e.target.value))}
                      inputProps={{ min: 1, max: 50 }}
                    />
                  </Grid>
                </>
              )}

              {/* Validation Rules */}
              {['text', 'textarea'].includes(currentField.fieldType) && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Text Validation (Optional)
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Min Length"
                      value={currentField.validation.minLength || ''}
                      onChange={(e) => handleValidationChange('minLength', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Max Length"
                      value={currentField.validation.maxLength || ''}
                      onChange={(e) => handleValidationChange('maxLength', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </Grid>
                </>
              )}

              {currentField.fieldType === 'number' && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Number Validation (Optional)
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Min Value"
                      value={currentField.validation.min || ''}
                      onChange={(e) => handleValidationChange('min', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Max Value"
                      value={currentField.validation.max || ''}
                      onChange={(e) => handleValidationChange('max', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFieldDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveField}
            disabled={loading}
          >
            {loading ? 'Saving...' : (editingFieldIndex !== null ? 'Update Field' : 'Add Field')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Form Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={3}>
              This is how participants will see the registration form
            </Typography>
            <Grid container spacing={3}>
              {fields.map((field, index) => (
                <Grid item xs={12} key={index}>
                  {renderFieldPreview(field)}
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FormBuilder;
