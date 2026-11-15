import { Box, Divider, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 2,
        px: 3,
        background: 'linear-gradient(135deg, #004d40 0%, #01579b 100%)',
        color: 'white',
        textAlign: 'center',
      }}
    >
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.25)', mb: 2 }} />
      <Typography variant="body2" sx={{ opacity: 0.95 }}>
        Hospital Management System &copy; {new Date().getFullYear()}
      </Typography>
      <Typography variant="caption" sx={{ opacity: 0.75, display: 'block', mt: 0.5 }}>
        Powered by Medical Agent API v1.0.0
      </Typography>
    </Box>
  );
}
