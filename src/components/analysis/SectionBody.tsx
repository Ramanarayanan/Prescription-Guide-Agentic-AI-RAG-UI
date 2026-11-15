import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import { Fragment } from 'react';

function renderInlineBold(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return (
        <Box component="span" key={`${keyPrefix}-b-${i}`} sx={{ fontWeight: 700 }}>
          {bold[1]}
        </Box>
      );
    }
    return <Fragment key={`${keyPrefix}-t-${i}`}>{part}</Fragment>;
  });
}

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'bullet'; items: string[] }
  | { type: 'ordered'; items: string[] };

function parseBlocks(body: string): Block[] {
  const lines = body.split('\n');
  const blocks: Block[] = [];
  let bulletItems: string[] = [];
  let orderedItems: string[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    const text = paragraphLines.join(' ').trim();
    if (text) blocks.push({ type: 'paragraph', text });
    paragraphLines = [];
  };

  const flushBullets = () => {
    if (bulletItems.length) {
      blocks.push({ type: 'bullet', items: [...bulletItems] });
      bulletItems = [];
    }
  };

  const flushOrdered = () => {
    if (orderedItems.length) {
      blocks.push({ type: 'ordered', items: [...orderedItems] });
      orderedItems = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushBullets();
      flushOrdered();
      continue;
    }

    const bullet = trimmed.match(/^[*\-]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      flushOrdered();
      bulletItems.push(bullet[1]);
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      flushBullets();
      orderedItems.push(ordered[1]);
      continue;
    }

    flushBullets();
    flushOrdered();
    paragraphLines.push(trimmed);
  }

  flushParagraph();
  flushBullets();
  flushOrdered();
  return blocks;
}

interface SectionBodyProps {
  body: string;
}

export default function SectionBody({ body }: SectionBodyProps) {
  if (!body.trim()) return null;

  const blocks = parseBlocks(body);

  return (
    <Box sx={{ '& > * + *': { mt: 1.5 } }}>
      {blocks.map((block, idx) => {
        if (block.type === 'paragraph') {
          return (
            <Typography key={idx} variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {renderInlineBold(block.text, `p-${idx}`)}
            </Typography>
          );
        }
        if (block.type === 'bullet') {
          return (
            <List key={idx} dense disablePadding sx={{ pl: 1 }}>
              {block.items.map((item, i) => (
                <ListItem key={i} disableGutters sx={{ py: 0.25, display: 'list-item', ml: 2 }}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        {renderInlineBold(item, `li-${idx}-${i}`)}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          );
        }
        if (block.type === 'ordered') {
          return (
            <List
              key={idx}
              dense
              disablePadding
              component="ol"
              sx={{ pl: 2.5, listStyleType: 'decimal' }}
            >
              {block.items.map((item, i) => (
                <ListItem
                  key={i}
                  component="li"
                  disableGutters
                  sx={{ py: 0.5, display: 'list-item' }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        {renderInlineBold(item, `ol-${idx}-${i}`)}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          );
        }
        return null;
      })}
    </Box>
  );
}
