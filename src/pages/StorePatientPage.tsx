import { Alert, Box, Button, CircularProgress, Snackbar, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useState } from 'react';
import type { Dayjs } from 'dayjs';
import { ApiError } from '../services/apiClient';
import { storePatient } from '../services/patientApi';
import { formatDob, isValidDob } from '../utils/formatDate';

export default function StorePatientPage() {
  const [name, setName] = useState('');
  const [dob, setDob] = useState<Dayjs | null>(null);
  const [history, setHistory] = useState('');
  const [drug, setDrug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const canSubmit =
    name.trim().length > 0 && isValidDob(dob) && history.trim().length > 0 && drug.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !dob) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await storePatient({
        name: name.trim(),
        dob: formatDob(dob),
        history: history.trim(),
        drug: drug.trim(),
      });
      setSuccess(`Patient saved successfully. ID: ${response.id}`);
      setSnackbarOpen(true);
      setName('');
      setDob(null);
      setHistory('');
      setDrug('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save patient. Is the API running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Alert severity="info" sx={{ mb: 2 }}>
        Registering a patient with the same name and date of birth will overwrite their existing
        record.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <TextField
        label="Patient Name"
        fullWidth
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        sx={{ mb: 2 }}
        slotProps={{ htmlInput: { 'aria-label': 'Patient Name' } }}
      />

      <DatePicker
        label="Date of Birth"
        value={dob}
        onChange={setDob}
        slotProps={{ textField: { fullWidth: true, required: true, sx: { mb: 2 } } }}
      />

      <TextField
        label="Current Medication"
        fullWidth
        required
        value={drug}
        onChange={(e) => setDrug(e.target.value)}
        sx={{ mb: 2 }}
        slotProps={{ htmlInput: { 'aria-label': 'Drug or Medication' } }}
      />

      <TextField
        label="Patient History"
        fullWidth
        required
        multiline
        minRows={8}
        value={history}
        onChange={(e) => setHistory(e.target.value)}
        sx={{ mb: 3 }}
        slotProps={{ htmlInput: { 'aria-label': 'Patient History' } }}
        placeholder="Enter detailed patient medical history..."
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={!canSubmit || loading}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
      >
        {loading ? 'Saving...' : 'Save Patient'}
      </Button>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        message={success ?? ''}
      />
    </Box>
  );
}
