import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicationIcon from '@mui/icons-material/Medication';
import PersonIcon from '@mui/icons-material/Person';
import { Box, Chip, Divider, Paper, Typography } from '@mui/material';
import type { PatientRecord } from '../../types/patient';

interface PatientListCardProps {
  patient: PatientRecord;
}

export default function PatientListCard({ patient }: PatientListCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderLeft: 4,
        borderLeftColor: '#00796B',
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
            {patient.name}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <CakeOutlinedIcon fontSize="small" sx={{ color: '#0288D1' }} />
          <Typography variant="body2" color="text.secondary">
            DOB: <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{patient.dob}</Box>
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Chip
          icon={<FingerprintIcon />}
          label={patient.id}
          variant="outlined"
          size="small"
          sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
        />
        <Chip
          icon={<MedicationIcon />}
          label={patient.drug}
          color="primary"
          variant="outlined"
          size="small"
          sx={{ maxWidth: '100%', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal' } }}
        />
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <LocalHospitalIcon sx={{ color: '#00796B', fontSize: 20 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Patient History
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
        {patient.history}
      </Typography>
    </Paper>
  );
}
