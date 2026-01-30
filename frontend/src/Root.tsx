import Grid from '@mui/material/Grid';
import { Outlet } from 'react-router-dom';
import SearchBox from './SearchBox';
import SearchResults from './SearchResults';
import { useState, useEffect } from 'react';
import type { Concept } from './type';
import { Button, Stack, Box, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { apiFetch } from './api';
import { useAuth } from './contexts/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';

// Outlet context type for passing data to child routes
export type RootOutletContext = {
  onConceptDelete: (conceptId: number) => Promise<void>;
};


function Root() {
  const { username, logout } = useAuth();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<Concept[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Error notification state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Concept作成 (Optimistic Update)
  const handleCreate = async () => {
    const trimmedName = newName.trim();
    const trimmedNotes = newNotes.trim();
    if (!trimmedName) return;

    // 1. Create temporary concept with negative ID
    const tempId = -Date.now();
    const tempConcept: Concept = {
      id: tempId,
      name: trimmedName,
      notes: trimmedNotes,
      words: []
    };

    // 2. Optimistically add to list immediately
    setSearchResults((prev) => [tempConcept, ...prev]);

    // 3. Close modal and clear form right away
    setIsFormOpen(false);
    setNewName("");
    setNewNotes("");

    // 4. Send request to server in background
    try {
      const response = await apiFetch('/api/concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, notes: trimmedNotes }),
      });

      if (!response.ok) {
        throw new Error('作成失敗しました');
      }

      const newConcept: Concept = await response.json();

      // 5. Replace temporary concept with real one from server
      setSearchResults((prev) =>
        prev.map((concept) =>
          concept.id === tempId ? newConcept : concept
        )
      );
    } catch (error) {
      console.error('作成エラー', error);

      // 6. On error: remove temporary concept and show notification
      setSearchResults((prev) =>
        prev.filter((concept) => concept.id !== tempId)
      );
      setErrorMessage('Conceptの作成に失敗しました。もう一度お試しください。');
    }
  };

  // Optimistic delete handler for child routes
  const handleConceptDeleteFromChild = async (conceptId: number): Promise<void> => {
    // Save the concept for potential rollback
    const deletedConcept = searchResults.find(c => c.id === conceptId);
    if (!deletedConcept) return;

    // 1. Optimistically remove from search results
    setSearchResults((prev) => prev.filter(c => c.id !== conceptId));

    // 2. Send delete request in background
    try {
      const response = await apiFetch(`/api/concepts/${conceptId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('削除に失敗しました');
      }

      // Success - concept is deleted from both UI and server
    } catch (error) {
      console.error('削除エラー', error);

      // 3. On error: restore the concept and show notification
      setSearchResults((prev) => [deletedConcept, ...prev].sort((a, b) => b.id - a.id));
      setErrorMessage('Conceptの削除に失敗しました。再度お試しください。');
    }
  };

  // 検索
  useEffect(() => {
    const url = searchKeyword
      ? `/api/concepts/search?keyword=${encodeURIComponent(searchKeyword)}`
      : `/api/concepts`;

    apiFetch(url)
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                {username}
              </Box>
              <Button
                size="small"
                startIcon={<LogoutIcon />}
                onClick={logout}
              >
                ログアウト
              </Button>
            </Box>

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
        <Outlet context={{ onConceptDelete: handleConceptDeleteFromChild } satisfies RootOutletContext} />
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
            label="Concept Name"
            type="text"
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="概念の名前を入力してください"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Notes (Optional)"
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
          <Button onClick={handleCreate} variant="contained" disabled={!newName.trim()}>
            作成
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Notification Snackbar */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setErrorMessage(null)}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
}

export default Root;