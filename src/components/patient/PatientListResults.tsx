import PeopleIcon from '@mui/icons-material/People';
import { Box, Paper, Stack, Typography } from '@mui/material';
import type { PatientRecord } from '../../types/patient';
import PatientListCard from './PatientListCard';

interface PatientListResultsProps {
  patients: PatientRecord[];
}

export default function PatientListResults({ patients }: PatientListResultsProps) {
  const count = patients.length;
  const label = `${count} patient${count !== 1 ? 's' : ''} found`;

  return (
    <Box aria-label="Patient List Results">
      <Paper
        sx={{
          p: 2,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          background: 'linear-gradient(135deg, rgba(0,121,107,0.12) 0%, rgba(2,136,209,0.12) 100%)',
          border: '1px solid',
          borderColor: 'primary.light',
        }}
      >
        <PeopleIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }} color="primary">
          {label}
        </Typography>
      </Paper>

      <Stack spacing={2}>
        {patients.map((patient) => (
          <PatientListCard key={patient.id} patient={patient} />
        ))}
      </Stack>
    </Box>
  );
}
