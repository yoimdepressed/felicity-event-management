import React from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Switch,
    FormControlLabel,
    Card,
    CardContent,
    Alert,
} from '@mui/material';
import {
    Add,
    Delete,
    DragIndicator,
    ArrowUpward,
    ArrowDownward,
} from '@mui/icons-material';

const FIELD_TYPES = [
    { value: 'text', label: 'Short Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'date', label: 'Date' },
    { value: 'file', label: 'File Upload' },
];

const FormBuilder = ({ fields = [], onChange, disabled = false }) => {
    const addField = () => {
        const newField = {
            id: Date.now().toString(),
            fieldName: '',
            fieldType: 'text',
            required: false,
            placeholder: '',
            options: [],
        };
        onChange([...fields, newField]);
    };

    const updateField = (index, updates) => {
        const updated = [...fields];
        updated[index] = { ...updated[index], ...updates };
        onChange(updated);
    };

    const removeField = (index) => {
        const updated = fields.filter((_, i) => i !== index);
        onChange(updated);
    };

    const moveField = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= fields.length) return;
        const updated = [...fields];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        onChange(updated);
    };

    const updateOption = (fieldIndex, optionIndex, value) => {
        const updated = [...fields];
        const options = [...(updated[fieldIndex].options || [])];
        options[optionIndex] = value;
        updated[fieldIndex] = { ...updated[fieldIndex], options };
        onChange(updated);
    };

    const addOption = (fieldIndex) => {
        const updated = [...fields];
        const options = [...(updated[fieldIndex].options || []), ''];
        updated[fieldIndex] = { ...updated[fieldIndex], options };
        onChange(updated);
    };

    const removeOption = (fieldIndex, optionIndex) => {
        const updated = [...fields];
        const options = (updated[fieldIndex].options || []).filter((_, i) => i !== optionIndex);
        updated[fieldIndex] = { ...updated[fieldIndex], options };
        onChange(updated);
    };

    const needsOptions = (type) => ['dropdown', 'checkbox', 'radio'].includes(type);

    return (
        <Box>
            {disabled && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Form is locked. Fields cannot be edited after the first registration.
                </Alert>
            )}

            {fields.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    No custom fields added yet. Click "Add Field" to create your registration form.
                </Typography>
            )}

            {fields.map((field, index) => (
                <Card key={field.id || index} sx={{ mb: 2 }} variant="outlined">
                    <CardContent>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <DragIndicator color="disabled" />
                            <Typography variant="subtitle2" flex={1}>
                                Field {index + 1}
                            </Typography>
                            {!disabled && (
                                <>
                                    <IconButton
                                        size="small"
                                        onClick={() => moveField(index, -1)}
                                        disabled={index === 0}
                                    >
                                        <ArrowUpward fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => moveField(index, 1)}
                                        disabled={index === fields.length - 1}
                                    >
                                        <ArrowDownward fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => removeField(index)}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </>
                            )}
                        </Box>

                        <Box display="flex" gap={2} mb={2}>
                            <TextField
                                label="Field Name"
                                value={field.fieldName || ''}
                                onChange={(e) => updateField(index, { fieldName: e.target.value })}
                                disabled={disabled}
                                size="small"
                                sx={{ flex: 2 }}
                                required
                            />
                            <FormControl size="small" sx={{ flex: 1 }}>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={field.fieldType || 'text'}
                                    label="Type"
                                    onChange={(e) => updateField(index, { fieldType: e.target.value })}
                                    disabled={disabled}
                                >
                                    {FIELD_TYPES.map(ft => (
                                        <MenuItem key={ft.value} value={ft.value}>{ft.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        <Box display="flex" gap={2} alignItems="center">
                            <TextField
                                label="Placeholder"
                                value={field.placeholder || ''}
                                onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                disabled={disabled}
                                size="small"
                                sx={{ flex: 1 }}
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={field.required || false}
                                        onChange={(e) => updateField(index, { required: e.target.checked })}
                                        disabled={disabled}
                                        size="small"
                                    />
                                }
                                label="Required"
                            />
                        </Box>

                        {/* Options for dropdown/checkbox/radio */}
                        {needsOptions(field.fieldType) && (
                            <Box mt={2}>
                                <Typography variant="caption" color="text.secondary" gutterBottom>
                                    Options:
                                </Typography>
                                {(field.options || []).map((opt, optIdx) => (
                                    <Box key={optIdx} display="flex" gap={1} alignItems="center" mb={1}>
                                        <TextField
                                            size="small"
                                            value={opt}
                                            onChange={(e) => updateOption(index, optIdx, e.target.value)}
                                            placeholder={`Option ${optIdx + 1}`}
                                            disabled={disabled}
                                            sx={{ flex: 1 }}
                                        />
                                        {!disabled && (
                                            <IconButton size="small" color="error" onClick={() => removeOption(index, optIdx)}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                ))}
                                {!disabled && (
                                    <Button size="small" onClick={() => addOption(index)} startIcon={<Add />}>
                                        Add Option
                                    </Button>
                                )}
                            </Box>
                        )}
                    </CardContent>
                </Card>
            ))}

            {!disabled && (
                <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={addField}
                    fullWidth
                    sx={{ mt: 1 }}
                >
                    Add Custom Field
                </Button>
            )}
        </Box>
    );
};

export default FormBuilder;
