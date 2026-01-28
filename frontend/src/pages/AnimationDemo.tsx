import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Button, Container, Typography, Paper, Chip, TextField, InputAdornment } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import CodeIcon from '@mui/icons-material/Code';
import LanguageIcon from '@mui/icons-material/Language';
import SchoolIcon from '@mui/icons-material/School';
import { apiUrl } from '../api';
import type { Concept } from '../type';

function AnimationDemo() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const steps = [
    { id: 0, title: '私の課題', duration: 5000 },
    { id: 1, title: '従来の管理方法の問題', duration: 5000 },
    { id: 2, title: 'ConceptLinkの解決', duration: 5000 },
    { id: 3, title: '実際の使用例', duration: 9000 } // 延長：複数検索のため
  ];

  const playAnimation = () => {
    setIsPlaying(true);
    setIsPaused(false);
    setStep(0);
    scheduleNextStep(0);
  };

  const scheduleNextStep = (currentStep: number) => {
    if (currentStep >= steps.length - 1) {
      timeoutRef.current = setTimeout(() => {
        setIsPlaying(false);
      }, steps[currentStep].duration);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      setStep(currentStep + 1);
      scheduleNextStep(currentStep + 1);
    }, steps[currentStep].duration);
  };

  const pause = () => {
    setIsPaused(true);
    setIsPlaying(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const resume = () => {
    setIsPlaying(true);
    setIsPaused(false);
    scheduleNextStep(step);
  };

  const reset = () => {
    setStep(0);
    setIsPlaying(false);
    setIsPaused(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const jumpToStep = (targetStep: number) => {
    setStep(targetStep);
    setIsPlaying(false);
    setIsPaused(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', py: 4 }}>
      <Container maxWidth="lg">
        {/* ヘッダー */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ mb: 2, fontWeight: 700 }}>
            ConceptLink
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            言語を超えて、概念をつなぐ
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            プログラミング用語を多言語で整理する新しい方法
          </Typography>

          {/* コントロール */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
            {!isPlaying && !isPaused && (
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrowIcon />}
                onClick={playAnimation}
                sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' } }}
              >
                再生
              </Button>
            )}
            {isPlaying && (
              <Button
                variant="contained"
                size="large"
                startIcon={<PauseIcon />}
                onClick={pause}
                sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' } }}
              >
                一時停止
              </Button>
            )}
            {isPaused && (
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrowIcon />}
                onClick={resume}
                sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' } }}
              >
                再開
              </Button>
            )}
            <Button
              variant="outlined"
              size="large"
              startIcon={<RestartAltIcon />}
              onClick={reset}
            >
              リセット
            </Button>
          </Box>

          {/* ステップジャンプ */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            {steps.map((s) => (
              <Chip
                key={s.id}
                label={`${s.id + 1}. ${s.title}`}
                onClick={() => jumpToStep(s.id)}
                color={step === s.id ? 'primary' : 'default'}
                variant={step === s.id ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>

        {/* インジケーター */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
          {steps.map((s) => (
            <Box
              key={s.id}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: step === s.id ? '#000' : '#ddd',
                transition: 'background-color 0.3s'
              }}
            />
          ))}
        </Box>

        {/* メイン表示エリア */}
        <Paper sx={{ p: 4, minHeight: 600, position: 'relative', overflow: 'hidden', bgcolor: '#fff' }}>
          <AnimatePresence mode="wait">
            {step === 0 && <Step1Challenge key="step1" />}
            {step === 1 && <Step2TraditionalProblem key="step2" />}
            {step === 2 && <Step3ConceptLinkSolution key="step3" />}
            {step === 3 && <Step4RealExample key="step4" />}
          </AnimatePresence>
        </Paper>

        {/* 説明テキスト */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {step === 0 && 'プログラミング学習で直面する課題'}
            {step === 1 && '従来の一対一管理では構造が見えない'}
            {step === 2 && '概念を中心に整理することで構造が明確に'}
            {step === 3 && '実際の使用例：異なる言語で検索 → 同じ概念を発見 → リセット → 繰り返し'}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

// ========================================
// Step 1: あなたの課題
// ========================================
function Step1Challenge() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h5" sx={{ mb: 4, textAlign: 'center', fontWeight: 600 }}>
        プログラミング用語を多言語で学習
      </Typography>

      <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
        {/* 学習シーンのアニメーション */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, mb: 4 }}>
          {/* 英語ドキュメント */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Paper sx={{ p: 3, border: '1px solid #e0e0e0', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CodeIcon sx={{ color: '#1976d2' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  英語ドキュメント
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ mb: 1, fontFamily: 'monospace' }}>
                Asynchronous Processing
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Official docs
              </Typography>
            </Paper>
          </motion.div>

          {/* 日本語記事 */}
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Paper sx={{ p: 3, border: '1px solid #e0e0e0', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SchoolIcon sx={{ color: '#f57c00' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  日本語記事
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                非同期処理
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Qiita, Zenn
              </Typography>
            </Paper>
          </motion.div>

          {/* 母語理解 */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Paper sx={{ p: 3, border: '1px solid #e0e0e0', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LanguageIcon sx={{ color: '#388e3c' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  母語理解
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                非同步處理
              </Typography>
              <Typography variant="caption" color="text.secondary">
                深い理解
              </Typography>
            </Paper>
          </motion.div>
        </Box>

        {/* 問題提起 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <Paper sx={{ p: 3, bgcolor: '#fff3e0', border: '2px solid #ff9800' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#e65100' }}>
              課題
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>❌</Typography>
                <Typography>
                  3つの単語が別々に存在している
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>❌</Typography>
                <Typography>
                  これらが同じ概念だとパッと見て分からない
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>❌</Typography>
                <Typography>
                  新しい略語"async"を追加したら、どこに入れる?
                </Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Box>
    </motion.div>
  );
}

// ========================================
// Step 2: 従来の管理方法の問題
// ========================================
function Step2TraditionalProblem() {
  const words = [
    { id: 1, text: 'Async', x: 120, y: 120, color: '#1976d2' },
    { id: 2, text: '非同期', x: 380, y: 120, color: '#f57c00' },
    { id: 3, text: '非同步', x: 120, y: 300, color: '#388e3c' },
    { id: 4, text: 'Promise', x: 380, y: 300, color: '#7b1fa2' }
  ];

  const connections = [
    { from: 1, to: 2 },
    { from: 1, to: 3 },
    { from: 1, to: 4 },
    { from: 2, to: 3 },
    { from: 2, to: 4 },
    { from: 3, to: 4 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h5" sx={{ mb: 2, textAlign: 'center', fontWeight: 600 }}>
        従来の管理方法
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
        一対一のペアで管理すると...
      </Typography>

      <Box sx={{ position: 'relative', height: 400 }}>
        <svg width="500" height="400" style={{ display: 'block', margin: '0 auto' }}>
          {/* 接続線（絡まった線） */}
          {connections.map((conn, index) => {
            const from = words.find(w => w.id === conn.from)!;
            const to = words.find(w => w.id === conn.to)!;

            return (
              <motion.line
                key={`line-${index}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#999"
                strokeWidth="2"
                strokeDasharray="5,5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ duration: 0.5, delay: index * 0.3 }}
              />
            );
          })}

          {/* 単語ノード */}
          {words.map((word, index) => (
            <g key={word.id}>
              <motion.circle
                cx={word.x}
                cy={word.y}
                r="45"
                fill="#fff"
                stroke={word.color}
                strokeWidth="3"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              />
              <motion.text
                x={word.x}
                y={word.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="15"
                fontWeight="600"
                fill={word.color}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.2 + 0.3 }}
              >
                {word.text}
              </motion.text>
            </g>
          ))}
        </svg>

        {/* 疑問符のアニメーション */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 2.5 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Typography variant="h1" sx={{ fontSize: '4rem', color: '#d32f2f', opacity: 0.7 }}>
            ?
          </Typography>
        </motion.div>
      </Box>

      {/* 問題点 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 3 }}
      >
        <Paper sx={{ p: 3, bgcolor: '#ffebee', border: '2px solid #d32f2f', mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#d32f2f' }}>
            問題点
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography>
              • どれとどれが同じ概念か不明確（メッシュ構造）
            </Typography>
            <Typography>
              • 新しい単語を追加する場所が分からない
            </Typography>
            <Typography>
              • 概念の説明を書く場所がない
            </Typography>
            <Typography>
              • 単語が増えると関係性が複雑化
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </motion.div>
  );
}

// ========================================
// Step 3: ConceptLinkの解決（改善版：円周から線を伸ばす）
// ========================================
function Step3ConceptLinkSolution() {
  const centerX = 250;
  const centerY = 220;
  const centerRadius = 75;  // 中心円の半径
  const outerRadius = 130;  // 外側の単語までの距離

  const words = [
    { text: 'Promise', angle: -90, color: '#7b1fa2' },    // 上
    { text: 'Async', angle: 0, color: '#1976d2' },        // 右
    { text: '非同期', angle: 90, color: '#f57c00' },      // 下
    { text: '非同步', angle: 180, color: '#388e3c' }      // 左
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h5" sx={{ mb: 2, textAlign: 'center', fontWeight: 600 }}>
        ConceptLink の解決策
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
        概念を中心に整理する
      </Typography>

      <svg width="500" height="450" style={{ display: 'block', margin: '0 auto' }}>
        {/* 中心の概念（大きく強調） */}
        <motion.circle
          cx={centerX}
          cy={centerY}
          r={centerRadius}
          fill="#000"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, type: 'spring', delay: 0.2 }}
        />
        <motion.text
          x={centerX}
          y={centerY - 15}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="13"
          fill="#fff"
          fontWeight="600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          Concept
        </motion.text>
        <motion.text
          x={centerX}
          y={centerY + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="18"
          fill="#fff"
          fontWeight="700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
        >
          非同期処理
        </motion.text>

        {/* 放射状の単語（円周から線を伸ばす） */}
        {words.map((word, index) => {
          const angle = (word.angle * Math.PI) / 180;

          // 円周上の開始点（中心円の外周）
          const startX = centerX + centerRadius * Math.cos(angle);
          const startY = centerY + centerRadius * Math.sin(angle);

          // 外側の単語の位置
          const endX = centerX + outerRadius * Math.cos(angle);
          const endY = centerY + outerRadius * Math.sin(angle);

          return (
            <g key={index}>
              {/* 接続線（円周から整然と伸びる） */}
              <motion.line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={word.color}
                strokeWidth="3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ duration: 0.6, delay: 1 + index * 0.2 }}
              />

              {/* 単語ノード */}
              <motion.circle
                cx={endX}
                cy={endY}
                r="45"
                fill="#fff"
                stroke={word.color}
                strokeWidth="3"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.2 + index * 0.2 }}
              />
              <motion.text
                x={endX}
                y={endY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="15"
                fontWeight="600"
                fill={word.color}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.4 + index * 0.2 }}
              >
                {word.text}
              </motion.text>
            </g>
          );
        })}
      </svg>

      {/* 利点 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 2.5 }}
      >
        <Paper sx={{ p: 3, bgcolor: '#e8f5e9', border: '2px solid #2e7d32', mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2e7d32' }}>
            解決
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography>
              ✅ 全て同じ概念だと一目瞭然（星型構造）
            </Typography>
            <Typography>
              ✅ 新しい単語は中心のConceptに追加するだけ
            </Typography>
            <Typography>
              ✅ Markdown対応でコード例も詳細説明も記録可能
            </Typography>
            <Typography>
              ✅ 概念が増えても構造は明確なまま
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </motion.div>
  );
}

// ========================================
// Step 4: 実際の使用例（改善版：複数言語検索）
// ========================================
function Step4RealExample() {
  const [searches, setSearches] = useState([
    { id: 1, term: '', active: false, lang: 'en' },
    { id: 2, term: '', active: false, lang: 'ja' },
    { id: 3, term: '', active: false, lang: 'zh' }
  ]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [showResult, setShowResult] = useState(false);
  const [searchResults, setSearchResults] = useState<Concept[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // API search function
  const performSearch = async (keyword: string) => {
    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        apiUrl(`/api/concepts/search?keyword=${encodeURIComponent(keyword)}`)
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data: Concept[] = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('検索エラーが発生しました');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    // Improved animation: Search → Result → Reset → Repeat
    const searchTerms = ['Promise', '非同期', 'async'];

    const timers = [
      // CYCLE 1: Search "Promise"
      setTimeout(() => {
        setCurrentSearchIndex(0);
        setSearches(prev => prev.map((s, i) =>
          i === 0 ? { ...s, term: 'Promise', active: true } : { ...s, term: '', active: false }
        ));
        performSearch('Promise');
      }, 500),

      // Show result for Promise
      setTimeout(() => setShowResult(true), 1500),

      // Hide result (reset)
      setTimeout(() => {
        setShowResult(false);
        setSearches(prev => prev.map(s => ({ ...s, term: '', active: false })));
      }, 4500),

      // CYCLE 2: Search "非同期"
      setTimeout(() => {
        setCurrentSearchIndex(1);
        setSearches(prev => prev.map((s, i) =>
          i === 1 ? { ...s, term: '非同期', active: true } : { ...s, term: '', active: false }
        ));
        performSearch('非同期');
      }, 5500),

      // Show result for 非同期
      setTimeout(() => setShowResult(true), 6500),

      // Hide result (reset)
      setTimeout(() => {
        setShowResult(false);
        setSearches(prev => prev.map(s => ({ ...s, term: '', active: false })));
      }, 9500),

      // CYCLE 3: Search "async"
      setTimeout(() => {
        setCurrentSearchIndex(2);
        setSearches(prev => prev.map((s, i) =>
          i === 2 ? { ...s, term: 'async', active: true } : { ...s, term: '', active: false }
        ));
        performSearch('async');
      }, 10500),

      // Show final result for async
      setTimeout(() => setShowResult(true), 11500)
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h5" sx={{ mb: 2, textAlign: 'center', fontWeight: 600 }}>
        実際の使用例
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
        異なる言語で検索 → 同じ概念を発見！を3回繰り返します
      </Typography>

      <Box sx={{ maxWidth: 700, margin: '0 auto' }}>
        {/* 複数言語の検索ボックス */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          {searches.map((search, index) => (
            <motion.div
              key={search.id}
              style={{ flex: 1 }}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.3 }}
            >
              <TextField
                fullWidth
                value={search.term}
                placeholder={`検索 (${search.lang})`}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '1rem',
                    fontWeight: search.active ? 700 : 400,
                    bgcolor: search.active ? '#f5f5f5' : 'transparent',
                    transition: 'all 0.3s'
                  }
                }}
              />
            </motion.div>
          ))}
        </Box>

        {/* 検索中の表示 */}
        {!showResult && searches.some(s => s.active) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Paper sx={{ p: 3, bgcolor: '#fff9c4', border: '1px solid #fbc02d', mb: 3, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                🔍 データベース検索中...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {currentSearchIndex === 0 && '英語 "Promise" で検索'}
                {currentSearchIndex === 1 && '日本語 "非同期" で検索'}
                {currentSearchIndex === 2 && '略語 "async" で検索'}
              </Typography>
            </Paper>
          </motion.div>
        )}

        {/* エラー表示 */}
        {showResult && searchError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper sx={{ p: 3, bgcolor: '#ffebee', border: '2px solid #d32f2f', mb: 3, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#d32f2f' }}>
                ⚠️ エラーが発生しました
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchError}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                バックエンドサーバーが起動しているか確認してください
              </Typography>
            </Paper>
          </motion.div>
        )}

        {/* 結果なし表示 */}
        {showResult && !searchError && searchResults.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper sx={{ p: 3, bgcolor: '#fff3e0', border: '2px solid #ff9800', mb: 3, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#e65100' }}>
                📭 結果が見つかりません
              </Typography>
              <Typography variant="body2" color="text.secondary">
                データベースにコンセプトがありません
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                まずはメイン画面からコンセプトを追加してみてください
              </Typography>
            </Paper>
          </motion.div>
        )}

        {/* 検索結果（全ての言語から同じConceptが見つかる） */}
        <AnimatePresence>
          {showResult && searchResults.length > 0 && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Paper sx={{ p: 3, border: '2px solid #000', mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Concept: {searchResults[0].name}
                </Typography>

                {/* Markdown対応の説明 */}
                {searchResults[0].notes && (
                  <Paper sx={{ p: 2, bgcolor: '#fafafa', mb: 2 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {searchResults[0].notes}
                    </Typography>
                  </Paper>
                )}

                {/* 単語一覧 */}
                {searchResults[0].words && searchResults[0].words.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Words:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {searchResults[0].words.map((word) => (
                        <Chip
                          key={word.id}
                          label={`${word.word} (${word.language}${word.nuance ? ', ' + word.nuance : ''})`}
                          sx={{ bgcolor: '#e3f2fd' }}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </Paper>

              {/* 説明（現在の検索を強調） */}
              <Paper sx={{
                p: 3,
                bgcolor: currentSearchIndex === 0 ? '#e8f5e9' : currentSearchIndex === 1 ? '#fff3e0' : '#e3f2fd',
                border: currentSearchIndex === 0 ? '2px solid #2e7d32' : currentSearchIndex === 1 ? '2px solid #f57c00' : '2px solid #1976d2',
                transition: 'all 0.5s ease'
              }}>
                {currentSearchIndex === 0 && (
                  <>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: '#2e7d32' }}>
                      🔍 英語で検索: "Promise"
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      → 見つかりました！
                    </Typography>
                  </>
                )}
                {currentSearchIndex === 1 && (
                  <>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: '#f57c00' }}>
                      🔍 日本語で検索: "非同期"
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      → 同じConceptが見つかりました！
                    </Typography>
                  </>
                )}
                {currentSearchIndex === 2 && (
                  <>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: '#1976d2' }}>
                      🔍 略語で検索: "async"
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
                      → また同じConceptが見つかりました！
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1976d2', mt: 2 }}>
                      ✨ どの言語で検索しても、同じ概念にたどり着く！
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Markdown対応でコード例も記録 / 73%高速化（N+1問題解決）
                    </Typography>
                  </>
                )}
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </motion.div>
  );
}

export default AnimationDemo;