import { Card, CardContent, Typography, Box, CircularProgress, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { Concept, Word } from './type';
import MarkdownRenderer from './MarkdownRenderer';

type SearchResultsProps = {
  concepts: Concept[];
};

function SearchResults({ concepts }: SearchResultsProps) {
  const navigate = useNavigate();

  if (!concepts || concepts.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        結果がありません
      </Typography>
    );
  }

  const handleConceptClick = (concept: Concept) => {
    // Prevent navigation for temporary concepts (negative IDs)
    if (concept.id < 0) {
      return; // Still syncing with server
    }
    navigate(`concepts/${concept.id}`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {concepts.map(concept => {
        const isTemporary = concept.id < 0;

        return (
          <Card
            key={concept.id}
            sx={{
              cursor: isTemporary ? 'default' : 'pointer',
              '&:hover': isTemporary ? {} : { backgroundColor: 'grey.100' },
              opacity: isTemporary ? 0.7 : 1,
              position: 'relative'
            }}
            onClick={() => handleConceptClick(concept)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6" sx={{ flex: 1 }}>
                  {concept.name}
                </Typography>
                {isTemporary && (
                  <Chip
                    label="同期中..."
                    size="small"
                    color="info"
                    icon={<CircularProgress size={12} sx={{ color: 'white' }} />}
                  />
                )}
              </Box>
              {concept.notes && (
                <Box sx={{ mb: 1 }}>
                  <MarkdownRenderer
                    content={concept.notes.length > 100 ? concept.notes.substring(0, 100) + '...' : concept.notes}
                  />
                </Box>
              )}
              {concept.words && concept.words.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {concept.words.map((w: Word) => w.word).join(', ')}
                </Typography>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}

export default SearchResults;