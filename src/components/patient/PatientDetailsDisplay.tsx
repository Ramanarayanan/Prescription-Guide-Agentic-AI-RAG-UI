import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicationIcon from '@mui/icons-material/Medication';
import PersonIcon from '@mui/icons-material/Person';
import {
  Box,
  Chip,
  Divider,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import type { PatientRecord } from '../../types/patient';

interface PatientDetailsDisplayProps {
  patient: PatientRecord;
}

function InfoCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        height: '100%',
        borderLeft: 4,
        borderLeftColor: accent,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{ color: accent, display: 'flex' }}>{icon}</Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
          {label}
        </Typography>
      </Box>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Paper>
  );
}

export default function PatientDetailsDisplay({ patient }: PatientDetailsDisplayProps) {
  return (
    <Box aria-label="Patient Details">
      <Paper
        sx={{
          p: 2.5,
          mb: 2,
          background: 'linear-gradient(135deg, rgba(0,121,107,0.12) 0%, rgba(2,136,209,0.12) 100%)',
          border: '1px solid',
          borderColor: 'primary.light',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
              Patient Record Found
            </Typography>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
              {patient.name}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <InfoCard
            icon={<PersonIcon fontSize="small" />}
            label="Name"
            value={patient.name}
            accent="#00796B"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <InfoCard
            icon={<CakeOutlinedIcon fontSize="small" />}
            label="Date of Birth"
            value={patient.dob}
            accent="#0288D1"
          />
        </Grid>
      </Grid>

      <Box sx={{ mb: 2 }}>
        <Chip
          icon={<FingerprintIcon />}
          label={`Patient ID: ${patient.id}`}
          variant="outlined"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            py: 2.5,
            width: '100%',
            justifyContent: 'flex-start',
            borderColor: 'divider',
          }}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', mb: 1, display: 'block' }}>
          Current Drug / Medication
        </Typography>
        <Chip
          icon={<MedicationIcon />}
          label={patient.drug}
          color="primary"
          variant="outlined"
          sx={{ fontSize: '0.9rem', py: 2, maxWidth: '100%', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal' } }}
        />
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderLeft: 4,
          borderLeftColor: '#00796B',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LocalHospitalIcon sx={{ color: '#00796B' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Patient History
          </Typography>
        </Box>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
        >
          {patient.history}
        </Typography>
      </Paper>
    </Box>
  );
}
