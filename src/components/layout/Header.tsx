import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { AppBar, Box, Toolbar, Typography } from '@mui/material';

export default function Header() {
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #00796B 0%, #0288D1 100%)',
        borderBottom: '3px solid rgba(255,255,255,0.2)',
      }}
    >
      <Toolbar sx={{ py: 1 }}>
        <LocalHospitalIcon sx={{ fontSize: 40, mr: 2 }} />
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
            Hospital Management System
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Medical Agent API — Patient Records &amp; Prescription Analysis
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
