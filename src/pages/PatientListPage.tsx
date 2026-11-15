import { Alert, Box, Button, CircularProgress, TextField } from '@mui/material';
import { useState } from 'react';
import PatientListResults from '../components/patient/PatientListResults';
import { ApiError } from '../services/apiClient';
import { searchPatientsByName } from '../services/patientApi';
import type { PatientRecord } from '../types/patient';

export default function PatientListPage() {
  const [name, setName] = useState('');
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSearch = name.trim().length >= 1;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!canSearch) return;

    setLoading(true);
    setError(null);
    setPatients([]);
    setSearched(false);

    try {
      const results = await searchPatientsByName(name.trim());
      setPatients(results);
      setSearched(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Search failed. Is the API running on port 8000?',
      );
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
        slotProps={{ htmlInput: { 'aria-label': 'Patient Name Search' } }}
        helperText="Partial name match (case-insensitive)"
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={!canSearch || loading}
        sx={{ mb: 3 }}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
      >
        {loading ? 'Searching...' : 'Search Patients'}
      </Button>

      {searched && patients.length === 0 && (
        <Alert severity="warning">No patients found matching that name.</Alert>
      )}

      {patients.length > 0 && <PatientListResults patients={patients} />}
    </Box>
  );
}
