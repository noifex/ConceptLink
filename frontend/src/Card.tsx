// Card.tsx
import { Card, CardContent, Typography, Box, IconButton, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Word } from './type';

type WordCardProps = {
  word: Word;
  onEdit?: (word: Word) => void;  // 追加
  onDelete?: (id: number) => void;  // 追加
};

export function WordCard({ word, onEdit, onDelete }: WordCardProps) {
  return (
    <Card sx={{ width: 200, position: 'relative' }}>
      {/* ボタングループ（右上） */}
      {(onEdit || onDelete) && (
        <Box sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          gap: 0.5
        }}>
          {onEdit && (
            <IconButton
              size="small"
              onClick={() => onEdit(word)}
              sx={{
                backgroundColor: 'white',
                '&:hover': { backgroundColor: 'primary.light' }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              size="small"
              onClick={() => onDelete(word.id)}
              sx={{
                backgroundColor: 'white',
                '&:hover': { backgroundColor: 'error.light' }
              }}
            >
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          )}
        </Box>
      )}

      {/* カード内容 */}
      <CardContent>
        <Typography variant="h6">
          {word.word}
          <Chip
            label={word.language}
            size="small"
            sx={{ ml: 1 }}
          />
        </Typography>
        {word.ipa && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            発音: {word.ipa}
          </Typography>
        )}
        {word.nuance && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {word.nuance}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}