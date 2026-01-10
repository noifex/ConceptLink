import { useParams, useNavigate } from 'react-router-dom';
import { WordCard } from './Card';
import type { Concept, Word } from './type';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  TextField,
  Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiUrl } from './api';
import MarkdownRenderer from './MarkdownRenderer';



function ConceptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [concept, setConcept] = useState<Concept | null>(null);

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newWord, setNewWord] = useState({ word: '', language: '', ipa: '', nuance: '' });

  const [isEditWordFormOpen, setIsEditWordFormOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);

  const [isEditConceptFormOpen, setIsEditConceptFormOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState('');

  useEffect(() => {
    fetch(apiUrl(`/api/concepts/${id}`))
      .then(res => res.json())
      .then((data: Concept) => {
        setConcept(data);
      });
  }, [id]);

  const handleCreateWord = async () => {
    try {
      const response = await fetch(apiUrl(`/api/concepts/${id}/words`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWord)
      });

      if (!response.ok) throw new Error('追加失敗');

      const createdWord = await response.json();
      setConcept(prev => ({
        ...prev!,
        words: [...(prev!.words || []), createdWord]
      }));

      setNewWord({ word: '', language: '', ipa: '', nuance: '' });
      setIsAddFormOpen(false);
    } catch (error) {
      console.error('追加エラー', error);
    }
  };

  const handleEditWordClick = (word: Word) => {
    setEditingWord(word);
    setIsEditWordFormOpen(true);
  };

  const handleUpdateWord = async () => {
    if (!editingWord) return;

    try {
      const response = await fetch(
       apiUrl( `/api/concepts/${id}/words/${editingWord.id}`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingWord)
        }
      );

      if (!response.ok) throw new Error('更新失敗');

      const updated = await response.json();
      setConcept(prev => ({
        ...prev!,
        words: prev!.words!.map(w => w.id === updated.id ? updated : w)
      }));

      setIsEditWordFormOpen(false);
      setEditingWord(null);
    } catch (error) {
      console.error('更新エラー', error);
    }
  };

  const handleDeleteWord = async (wordId: number) => {
    if (!window.confirm('このWordを削除しますか？')) return;

    try {
      const response = await fetch(
        apiUrl(`/api/concepts/${id}/words/${wordId}`),
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('削除失敗');

      setConcept(prev => ({
        ...prev!,
        words: prev!.words!.filter(w => w.id !== wordId)
      }));
    } catch (error) {
      console.error('削除エラー', error);
    }
  };

  const handleEditConceptClick = () => {
    setEditingNotes(concept?.notes || '');
    setIsEditConceptFormOpen(true);
  };

  const handleUpdateConcept = async () => {
    try {
      const response = await fetch(apiUrl(`/api/concepts/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editingNotes })
      });

      if (!response.ok) throw new Error('更新失敗');

      const updated = await response.json();
      setConcept(updated);
      setIsEditConceptFormOpen(false);
    } catch (error) {
      console.error('更新エラー', error);
    }
  };

  const handleDeleteConcept = async () => {
    const wordCount = concept?.words?.length || 0;
    if (!window.confirm(
      `「${concept?.notes}」を削除しますか？\n紐づく${wordCount}件のWordも削除されます。\nこの操作は取り消せません。`
    )) {
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/concepts/${id}`), {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('削除失敗');

      navigate('/');
    } catch (error) {
      console.error('削除エラー', error);
    }
  };

  if (!concept) {
    return <Box sx={{ p: 3 }}>読み込み中...</Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <MarkdownRenderer content={concept.notes} />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEditConceptClick}
          >
            編集
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteConcept}
          >
            削除
          </Button>
        </Box>
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}>
        単語一覧
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {concept.words && concept.words.map(word => (
          <WordCard
            key={word.id}
            word={word}
            onEdit={handleEditWordClick}
            onDelete={handleDeleteWord}
          />
        ))}

        <Card
          sx={{
            width: 200,
            height: 150,
            border: '2px dashed',
            borderColor: 'grey.400',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'grey.50'
            }
          }}
          onClick={() => setIsAddFormOpen(true)}
        >
          <CardContent sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
          }}>
            <AddIcon fontSize="large" color="action" />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              新規Word追加
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={isAddFormOpen} onClose={() => setIsAddFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新しいWordを追加</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Word（必須）"
            fullWidth
            value={newWord.word}
            onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Language（必須）"
            fullWidth
            placeholder="例: en, ja, zh"
            value={newWord.language}
            onChange={(e) => setNewWord({ ...newWord, language: e.target.value })}
          />
          <TextField
            margin="dense"
            label="IPA（任意）"
            fullWidth
            value={newWord.ipa}
            onChange={(e) => setNewWord({ ...newWord, ipa: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Nuance（任意）"
            fullWidth
            multiline
            rows={2}
            value={newWord.nuance}
            onChange={(e) => setNewWord({ ...newWord, nuance: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddFormOpen(false)}>キャンセル</Button>
          <Button
            onClick={handleCreateWord}
            variant="contained"
            disabled={!newWord.word.trim() || !newWord.language.trim()}
          >
            追加
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isEditWordFormOpen} onClose={() => setIsEditWordFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Wordを編集</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Word（必須）"
            fullWidth
            value={editingWord?.word || ''}
            onChange={(e) => setEditingWord(prev => ({ ...prev!, word: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Language（必須）"
            fullWidth
            value={editingWord?.language || ''}
            onChange={(e) => setEditingWord(prev => ({ ...prev!, language: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="IPA（任意）"
            fullWidth
            value={editingWord?.ipa || ''}
            onChange={(e) => setEditingWord(prev => ({ ...prev!, ipa: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Nuance（任意）"
            fullWidth
            multiline
            rows={2}
            value={editingWord?.nuance || ''}
            onChange={(e) => setEditingWord(prev => ({ ...prev!, nuance: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditWordFormOpen(false)}>キャンセル</Button>
          <Button
            onClick={handleUpdateWord}
            variant="contained"
            disabled={!editingWord?.word.trim() || !editingWord?.language.trim()}
          >
            更新
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isEditConceptFormOpen} onClose={() => setIsEditConceptFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Conceptを編集</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Notes"
            fullWidth
            multiline
            rows={4}
            value={editingNotes}
            onChange={(e) => setEditingNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditConceptFormOpen(false)}>キャンセル</Button>
          <Button
            onClick={handleUpdateConcept}
            variant="contained"
            disabled={!editingNotes.trim()}
          >
            更新
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ConceptDetail;