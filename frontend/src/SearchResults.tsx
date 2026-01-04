import { Card, CardContent, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { Concept, Word } from './type';

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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {concepts.map(concept => (
        <Card
          key={concept.id}
          sx={{
            cursor: 'pointer',
            '&:hover': { backgroundColor: 'grey.100' }
          }}
          onClick={() => navigate(`/concepts/${concept.id}`)}
        >
          <CardContent>
            <Typography variant="h6" sx={{ fontSize: '1rem' }}>
              {concept.notes}
            </Typography>
            {concept.words && concept.words.length > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {concept.words.map((w: Word) => w.word).join(', ')}
              </Typography>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export default SearchResults;