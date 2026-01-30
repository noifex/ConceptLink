import { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  Chip,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { Concept, Word } from './type';
import MarkdownRenderer from './MarkdownRenderer';
import { apiFetch } from './api';
import type { RootOutletContext } from './Root';

function ConceptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { onConceptDelete } = useOutletContext<RootOutletContext>();
  const [concept, setConcept] = useState<Concept | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // モーダル用のstate
  const [isEditConceptFormOpen, setIsEditConceptFormOpen] = useState(false);
  const [isAddWordFormOpen, setIsAddWordFormOpen] = useState(false);
  const [isEditWordFormOpen, setIsEditWordFormOpen] = useState(false);

  // 編集用のstate
  const [editingName, setEditingName] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [newWord, setNewWord] = useState<Partial<Word>>({
    word: '',
    language: '',
    ipa: '',
    nuance: ''
  });
  const [editingWord, setEditingWord] = useState<Word | null>(null);

  // 展開されたWordカードのIDを管理
  const [expandedWords, setExpandedWords] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    apiFetch(`/api/concepts/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTPエラー: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setConcept(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ エラー:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleUpdateConcept = async () => {
    if (!concept) return;

    await apiFetch(`/api/concepts/${concept.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...concept, name: editingName, notes: editingNotes })
    });

    setConcept({ ...concept, name: editingName, notes: editingNotes });
    setIsEditConceptFormOpen(false);
  };

  const handleDeleteConcept = async () => {
    if (!concept) return;

    if (!window.confirm('このConceptを削除しますか？')) return;

    const conceptId = concept.id;

    // 1. Navigate away immediately (Optimistic)
    navigate('/app');

    // 2. Call parent delete handler (will update search results + send request)
    await onConceptDelete(conceptId);
  };

  const handleAddWord = async () => {
    if (!concept) return;
    
    const response = await apiFetch(`/api/concepts/${concept.id}/words`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newWord)
    });
    
    const addedWord = await response.json();
    setConcept({ ...concept, words: [...concept.words, addedWord] });
    setIsAddWordFormOpen(false);
    setNewWord({ word: '', language: '', ipa: '', nuance: '' });
  };

  const handleUpdateWord = async () => {
    if (!concept || !editingWord) return;
    
    await apiFetch(`/api/concepts/${concept.id}/words/${editingWord.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingWord)
    });
    
    setConcept({
      ...concept,
      words: concept.words.map(w => w.id === editingWord.id ? editingWord : w)
    });
    setIsEditWordFormOpen(false);
    setEditingWord(null);
  };

  const handleDeleteWord = async (wordId: number) => {
    if (!concept) return;

    if (!window.confirm('このWordを削除しますか？')) return;

    // Save the word for potential rollback
    const deletedWord = concept.words.find(w => w.id === wordId);
    if (!deletedWord) return;

    // 1. Optimistically remove from UI immediately
    setConcept({
      ...concept,
      words: concept.words.filter(w => w.id !== wordId)
    });

    // 2. Send delete request in background
    try {
      const response = await apiFetch(`/api/concepts/${concept.id}/words/${wordId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('削除に失敗しました');
      }

      // Success - word is deleted
    } catch (error) {
      console.error('Word削除エラー', error);

      // 3. On error: restore the word and show notification
      setConcept((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          words: [...prev.words, deletedWord].sort((a, b) => a.id - b.id)
        };
      });
      setDeleteError('Wordの削除に失敗しました。再度お試しください。');
    }
  };

  // ★ Word カードの展開/折りたたみをトグル
  const toggleWordExpansion = (wordId: number) => {
    setExpandedWords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(wordId)) {
        newSet.delete(wordId);
      } else {
        newSet.add(wordId);
      }
      return newSet;
    });
  };

  // ★ Word タイトルの長さに応じてカードの幅を決定
  const getCardWidth = (word: Word): string => {
    const titleLength = word.word?.length || 0;

    if (titleLength > 20) {
      return '280px'; // 長いタイトル
    } else if (titleLength > 10) {
      return '220px'; // 中程度のタイトル
    } else {
      return '180px'; // 短いタイトル
    }
  };

  // ローディング中
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>読込中...</Typography>
      </Box>
    );
  }

  // エラー
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">エラーが発生しました: {error}</Typography>
        <Button onClick={() => navigate('/app')} sx={{ mt: 2 }}>
          戻る
        </Button>
      </Box>
    );
  }

  // データなし
  if (!concept) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Conceptが見つかりません</Typography>
        <Button onClick={() => navigate('/app')} sx={{ mt: 2 }}>
          戻る
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      {/* 戻るボタン */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/app')}
        sx={{ mb: 2 }}
      >
        戻る
      </Button>

      {/* Concept表示 - Header Style */}
      <Box sx={{ mb: 4, pb: 2, borderBottom: '2px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
              {concept.name}
            </Typography>
            {concept.notes && (
              <Box sx={{ pl: 2 }}>
                <MarkdownRenderer content={concept.notes} />
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              color="primary"
              onClick={() => {
                setEditingName(concept.name || '');
                setEditingNotes(concept.notes || '');
                setIsEditConceptFormOpen(true);
              }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              color="error"
              onClick={handleDeleteConcept}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Words一覧 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Words ({concept.words.length})</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddWordFormOpen(true)}
        >
          新規Word追加
        </Button>
      </Box>

      {concept.words.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Wordがありません。「新規Word追加」から追加してください。
        </Typography>
      ) : (
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'flex-start'
        }}>
          {concept.words.map((word) => {
            const isExpanded = expandedWords.has(word.id);
            const cardWidth = getCardWidth(word);

            return (
              <Card
                key={word.id}
                onClick={() => toggleWordExpansion(word.id)}
                sx={{
                  width: cardWidth,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ wordBreak: 'break-word', flex: 1, pr: 1 }}>
                      {word.word}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingWord(word);
                          setIsEditWordFormOpen(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWord(word.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip label={word.language} size="small" />
                    <IconButton size="small" sx={{ ml: 'auto' }}>
                      {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </IconButton>
                  </Box>

                  {isExpanded && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                      {word.ipa && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>IPA:</strong> {word.ipa}
                        </Typography>
                      )}
                      {word.nuance && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 'bold' }}>
                            Nuance:
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word'
                            }}
                          >
                            {word.nuance}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Concept編集モーダル */}
      <Dialog open={isEditConceptFormOpen} onClose={() => setIsEditConceptFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Conceptを編集</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Concept Name"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={10}
            label="Notes（Markdown対応・任意）"
            value={editingNotes}
            onChange={(e) => setEditingNotes(e.target.value)}
            helperText="Markdown記法: # 見出し, **太字**, *斜体*, - リスト"
          />
          {editingNotes && (
            <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#fafafa' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                プレビュー:
              </Typography>
              <MarkdownRenderer content={editingNotes} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditConceptFormOpen(false)}>キャンセル</Button>
          <Button onClick={handleUpdateConcept} variant="contained" disabled={!editingName.trim()}>更新</Button>
        </DialogActions>
      </Dialog>

      {/* Word追加モーダル */}
      <Dialog open={isAddWordFormOpen} onClose={() => setIsAddWordFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新規Word追加</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Word"
            value={newWord.word}
            onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Language"
            value={newWord.language}
            onChange={(e) => setNewWord({ ...newWord, language: e.target.value })}
            sx={{ mt: 2 }}
            placeholder="en, ja, zh-TW など"
          />
          <TextField
            fullWidth
            label="IPA（任意）"
            value={newWord.ipa}
            onChange={(e) => setNewWord({ ...newWord, ipa: e.target.value })}
            sx={{ mt: 2 }}
            placeholder="発音記号"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Nuance（任意）"
            value={newWord.nuance}
            onChange={(e) => setNewWord({ ...newWord, nuance: e.target.value })}
            sx={{ mt: 2 }}
            placeholder="ニュアンス、使用例など"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddWordFormOpen(false)}>キャンセル</Button>
          <Button onClick={handleAddWord} variant="contained">追加</Button>
        </DialogActions>
      </Dialog>

      {/* Word編集モーダル */}
      {editingWord && (
        <Dialog open={isEditWordFormOpen} onClose={() => setIsEditWordFormOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Wordを編集</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Word"
              value={editingWord.word}
              onChange={(e) => setEditingWord({ ...editingWord, word: e.target.value })}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              label="Language"
              value={editingWord.language}
              onChange={(e) => setEditingWord({ ...editingWord, language: e.target.value })}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              label="IPA（任意）"
              value={editingWord.ipa || ''}
              onChange={(e) => setEditingWord({ ...editingWord, ipa: e.target.value })}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Nuance（任意）"
              value={editingWord.nuance || ''}
              onChange={(e) => setEditingWord({ ...editingWord, nuance: e.target.value })}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsEditWordFormOpen(false)}>キャンセル</Button>
            <Button onClick={handleUpdateWord} variant="contained">更新</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Delete Error Notification Snackbar */}
      <Snackbar
        open={!!deleteError}
        autoHideDuration={6000}
        onClose={() => setDeleteError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setDeleteError(null)}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {deleteError}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ConceptDetail;