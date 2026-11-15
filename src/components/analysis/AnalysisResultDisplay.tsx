import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicationIcon from '@mui/icons-material/Medication';
import ScienceIcon from '@mui/icons-material/Science';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';
import SectionBody from './SectionBody';
import {
  parseAnalysisResult,
  verdictSeverity,
  type AnalysisSection,
  type VerdictLevel,
} from '../../utils/parseAnalysisResult';

interface AnalysisResultDisplayProps {
  rawText: string;
}

function sectionAccent(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('history')) return '#00796B';
  if (t.includes('prescription') || t.includes('medication')) return '#0288D1';
  if (t.includes('analysis')) return '#5e35b1';
  if (t.includes('verdict')) return '#6d4c41';
  return '#78909c';
}

function SectionIcon({ title }: { title: string }) {
  const t = title.toLowerCase();
  if (t.includes('history')) return <LocalHospitalIcon fontSize="small" />;
  if (t.includes('prescription')) return <MedicationIcon fontSize="small" />;
  if (t.includes('analysis')) return <ScienceIcon fontSize="small" />;
  return null;
}

function VerdictIcon({ level }: { level: VerdictLevel }) {
  switch (level) {
    case 'recommended':
      return <CheckCircleIcon sx={{ fontSize: 32 }} />;
    case 'caution':
      return <WarningAmberIcon sx={{ fontSize: 32 }} />;
    case 'not_recommended':
      return <CancelOutlinedIcon sx={{ fontSize: 32 }} />;
    default:
      return <WarningAmberIcon sx={{ fontSize: 32 }} />;
  }
}

function SectionCard({ section }: { section: AnalysisSection }) {
  const accent = sectionAccent(section.title);
  const isPrescription = section.title.toLowerCase().includes('prescription');

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        borderLeft: 4,
        borderLeftColor: accent,
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box sx={{ color: accent, display: 'flex' }}>
          <SectionIcon title={section.title} />
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }} color="text.primary">
          {section.title}
        </Typography>
      </Box>

      {isPrescription && section.body ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          {section.body
            .split('\n')
            .map((line) => line.replace(/^[*\-]\s+/, '').trim())
            .filter(Boolean)
            .map((drug, i) => (
              <Chip
                key={i}
                icon={<MedicationIcon />}
                label={drug.replace(/^\*\*|\*\*$/g, '')}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
        </Box>
      ) : (
        <SectionBody body={section.body} />
      )}
    </Paper>
  );
}

function VerdictBanner({
  label,
  level,
}: {
  label: string;
  level: VerdictLevel;
}) {
  const severity = verdictSeverity(level);

  return (
    <Alert
      severity={severity}
      icon={<VerdictIcon level={level} />}
      sx={{
        mb: 3,
        py: 2,
        '& .MuiAlert-message': { width: '100%' },
        ...(level === 'recommended' && {
          bgcolor: '#e8f5e9',
          color: '#1b5e20',
          '& .MuiAlert-icon': { color: '#2e7d32' },
        }),
        ...(level === 'caution' && {
          bgcolor: '#fff8e1',
          color: '#e65100',
          '& .MuiAlert-icon': { color: '#ed6c02' },
        }),
        ...(level === 'not_recommended' && {
          bgcolor: '#ffebee',
          color: '#b71c1c',
          '& .MuiAlert-icon': { color: '#d32f2f' },
        }),
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </Typography>
    </Alert>
  );
}

export default function AnalysisResultDisplay({ rawText }: AnalysisResultDisplayProps) {
  const parsed = useMemo(() => parseAnalysisResult(rawText), [rawText]);

  const verdictSection = parsed.sections.find((s) =>
    /^verdict$/i.test(s.title.trim()),
  );
  const contentSections = parsed.sections.filter(
    (s) => !/^verdict$/i.test(s.title.trim()),
  );

  if (parsed.rawFallback) {
    return (
      <Box>
        <VerdictBanner label={parsed.verdict.label} level={parsed.verdict.level} />
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
            {parsed.rawFallback}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box aria-label="Analysis Result">
      <VerdictBanner label={parsed.verdict.label} level={parsed.verdict.level} />

      <Typography variant="h5" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
        {parsed.title}
      </Typography>

      {contentSections.map((section) => (
        <SectionCard key={section.title} section={section} />
      ))}

      {(verdictSection || parsed.verdict.body) && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderLeft: 4,
            borderLeftColor: sectionAccent('Verdict'),
            bgcolor:
              parsed.verdict.level === 'recommended'
                ? '#e8f5e9'
                : parsed.verdict.level === 'caution'
                  ? '#fff8e1'
                  : parsed.verdict.level === 'not_recommended'
                    ? '#ffebee'
                    : 'grey.50',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Verdict
          </Typography>
          <SectionBody body={verdictSection?.body ?? parsed.verdict.body} />
        </Paper>
      )}

      <Divider sx={{ mt: 2 }} />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        AI-generated clinical safety analysis — for decision support only. Always verify with a
        qualified healthcare professional.
      </Typography>
    </Box>
  );
}
