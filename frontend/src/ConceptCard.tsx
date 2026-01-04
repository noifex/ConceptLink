import { Card, CardContent, Typography } from '@mui/material';
import type { Concept, Word } from './type';

type ConceptCardProps = {
  concept: Concept;
  onClick?: () => void;
};

function ConceptCard({ concept, onClick }: ConceptCardProps) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { backgroundColor: 'grey.100' } : {}
      }}
    >
      <CardContent>
        <Typography variant="h6">
          {concept.notes}
        </Typography>
        {concept.words && concept.words.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {concept.words.map((w: Word) => w.word).join(', ')}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default ConceptCard;