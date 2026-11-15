import { Alert, Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useState } from 'react';
import type { Dayjs } from 'dayjs';
import PatientDetailsDisplay from '../components/patient/PatientDetailsDisplay';
import { ApiError } from '../services/apiClient';
import { getPatientDetails } from '../services/patientApi';
import type { PatientRecord } from '../types/patient';
import { formatDob, isValidDob } from '../utils/formatDate';

export default function SearchPatientPage() {
  const [name, setName] = useState('');
  const [dob, setDob] = useState<Dayjs | null>(null);
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSearch = name.trim().length > 0 && isValidDob(dob);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!canSearch || !dob) return;

    setLoading(true);
    setError(null);
    setPatient(null);

    try {
      const record = await getPatientDetails(name.trim(), formatDob(dob));
      setPatient(record);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Patient record not found.');
      } else {
        setError(
          err instanceof ApiError ? err.message : 'Search failed. Is the API running on port 8000?',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSearch}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
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

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={!canSearch || loading}
        sx={{ mb: 3 }}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
      >
        {loading ? 'Searching...' : 'Search Patient'}
      </Button>

      {patient && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Patient Details
          </Typography>
          <PatientDetailsDisplay patient={patient} />
        </Box>
      )}
    </Box>
  );
}
