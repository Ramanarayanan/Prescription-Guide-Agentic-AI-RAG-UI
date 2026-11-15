import ListIcon from '@mui/icons-material/List';
import MedicationIcon from '@mui/icons-material/Medication';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Container, Paper, Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import AnalyzeMedicationPage from '../../pages/AnalyzeMedicationPage';
import PatientListPage from '../../pages/PatientListPage';
import SearchPatientPage from '../../pages/SearchPatientPage';
import StorePatientPage from '../../pages/StorePatientPage';
import Footer from './Footer';
import Header from './Header';

const tabs = [
  { label: 'Register Patient', icon: <PersonAddIcon />, component: StorePatientPage },
  { label: 'Find Patient', icon: <SearchIcon />, component: SearchPatientPage },
  { label: 'Prescription Analysis', icon: <MedicationIcon />, component: AnalyzeMedicationPage },
  { label: 'Patient List', icon: <ListIcon />, component: PatientListPage },
];

export default function AppLayout() {
  const [activeTab, setActiveTab] = useState(0);
  const ActivePage = tabs[activeTab].component;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Container maxWidth="md" sx={{ flex: 1, py: 3 }}>
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, value: number) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': { minHeight: 64 },
            }}
          >
            {tabs.map((tab) => (
              <Tab key={tab.label} icon={tab.icon} iconPosition="start" label={tab.label} />
            ))}
          </Tabs>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <ActivePage />
        </Paper>
      </Container>
      <Footer />
    </Box>
  );
}
