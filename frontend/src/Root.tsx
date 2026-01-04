import Grid from '@mui/material/Grid';
import { Outlet } from 'react-router-dom';
import SearchBox from './SearchBox';
import SearchResults from './SearchResults';
import { useState, useEffect } from 'react';
import type { Concept } from './type';
import { Button, Stack, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';

function Root() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<Concept[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newNotes, setNewNotes] = useState("");

  // Concept作成
  const handleCreate = async () => {
    const trimmedNotes = newNotes.trim();
    if (!trimmedNotes) return;

    try {
      const response = await fetch('/api/concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: trimmedNotes }),
      });

      if (!response.ok) {
        throw new Error('作成失敗しました');
      }

      const newConcept: Concept = await response.json();
      setSearchResults((prev) => [newConcept, ...prev]);
      setIsFormOpen(false);
      setNewNotes("");
    } catch (error) {
      console.error('作成エラー', error);
    }
  };

  // 検索
  useEffect(() => {
    const url = searchKeyword
      ? `/api/concepts/search?keyword=${encodeURIComponent(searchKeyword)}`
      : `/api/concepts`;

    fetch(url)
      .then(res => res.json())
      .then((data: Concept[]) => {
        setSearchResults(data);
      })
      .catch(err => console.error('検索エラー', err));
  }, [searchKeyword]);

  return (
    <Grid container spacing={2}>
      {/* 左側：検索エリア */}
      <Grid size={{ xs: 12, md: 3 }}>
        <Stack sx={{ height: "100vh" }}>
          {/* ヘッダー */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <SearchBox keyword={searchKeyword} setKeyword={setSearchKeyword} />

            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setIsFormOpen(true)}
              sx={{ mt: 2 }}
            >
              新規Concept作成
            </Button>
          </Box>

          {/* 検索結果リスト */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <SearchResults concepts={searchResults} />
          </Box>
        </Stack>
      </Grid>

      {/* 右側：詳細エリア */}
      <Grid size={{ xs: 12, md: 9 }}>
        <Outlet />
      </Grid>

      {/* 新規作成モーダル */}
      <Dialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>新しい概念作成</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Notes"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="概念のメモを入力してください"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsFormOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleCreate} variant="contained" disabled={!newNotes.trim()}>
            作成
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default Root;