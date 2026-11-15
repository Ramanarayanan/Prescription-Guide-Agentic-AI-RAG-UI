import { Alert, Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useState } from 'react';
import AnalysisResultDisplay from '../components/analysis/AnalysisResultDisplay';
import { ApiError } from '../services/apiClient';
import { analyzeMedication, getPatientDetails } from '../services/patientApi';
import { formatDob, isValidDob } from '../utils/formatDate';
import type { Dayjs } from 'dayjs';

export default function AnalyzeMedicationPage() {
  const [name, setName] = useState('');
  const [dob, setDob] = useState<Dayjs | null>(null);
  const [drug, setDrug] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canAnalyze = name.trim().length > 0 && isValidDob(dob);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!canAnalyze || !dob) return;

    setLoading(true);
    setError(null);
    setResult('');
    setLoadingMessage('Looking up patient record...');

    try {
      const patient = await getPatientDetails(name.trim(), formatDob(dob));
      const drugToAnalyze = drug.trim() || patient.drug;
      setDrug(drugToAnalyze);

      setLoadingMessage('Analyzing medication — this may take up to 2 minutes...');
      const analysisResult = await analyzeMedication(patient.id, { drug: drugToAnalyze }  );
      setResult(analysisResult);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Patient record not found.');
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Analysis failed. Is the API running on port 8000?',
        );
      }
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }

  return (
    <Box component="form" onSubmit={handleAnalyze}>
      <Alert severity="info" sx={{ mb: 2 }}>
        AI-powered prescription analysis. Verdicts are color-coded: green (recommended), yellow
        (caution), and red (not recommended).
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && loadingMessage && (
        <Alert severity="info" icon={<CircularProgress size={18} />} sx={{ mb: 2 }}>
          {loadingMessage}
        </Alert>
      )}

      <TextField
        label="Patient Name"
        fullWidth
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
        sx={{ mb: 2 }}
        slotProps={{ htmlInput: { 'aria-label': 'Patient Name' } }}
      />

      <DatePicker
        label="Date of Birth"
        value={dob}
        onChange={setDob}
        disabled={loading}
        slotProps={{ textField: { fullWidth: true, required: true, sx: { mb: 2 } } }}
      />

      <TextField
        label="Prescription to Analyze"
        fullWidth
        value={drug}
        onChange={(e) => setDrug(e.target.value)}
        disabled={loading}
        sx={{ mb: 2 }}
        slotProps={{ htmlInput: { 'aria-label': 'Drug to Analyze' } }}
        helperText="Leave empty to use the drug stored on the patient record"
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={!canAnalyze || loading}
        sx={{ mb: 3 }}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
      >
        {loading ? 'Analyzing...' : 'Analyze Prescription'}
      </Button>

      {result && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Analysis Result
          </Typography>
          <AnalysisResultDisplay rawText={result} />
        </Box>
      )}
    </Box>
  );
}
