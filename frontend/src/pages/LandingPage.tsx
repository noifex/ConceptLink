import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, Box, Grid } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GitHubIcon from '@mui/icons-material/GitHub';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#ffffff' }}>
      {/* Header */}
      <Box sx={{
        borderBottom: '1px solid #e0e0e0',
        py: 2
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#000' }}>
              ConceptLink
            </Typography>
            <Button
              href="https://github.com/noifex/multilang-memo"
              target="_blank"
              sx={{ color: '#000' }}
              startIcon={<GitHubIcon />}
            >
              GitHub
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              color: '#000',
              letterSpacing: '-0.02em'
            }}
          >
            ConceptLink
          </Typography>
          <Typography
            variant="h5"
            sx={{
              mb: 1,
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              color: '#666',
              fontWeight: 400
            }}
          >
            言語を超えて、概念をつなぐ
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mb: 5,
              color: '#888',
              fontSize: '1rem'
            }}
          >
            多言語概念管理システム
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/app')}
            sx={{
              bgcolor: '#000',
              color: '#fff',
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              textTransform: 'none',
              borderRadius: 1,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#333',
                boxShadow: 'none'
              }
            }}
          >
            アプリを開く
          </Button>
        </Box>
      </Container>

      {/* Problem & Solution */}
      <Box sx={{ bgcolor: '#fafafa', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{
                bgcolor: '#fff',
                p: 4,
                borderRadius: 1,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                height: '100%'
              }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#000' }}>
                  課題
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography sx={{ color: '#666', lineHeight: 1.7 }}>
                    • 単語帳は言語ごとにバラバラで管理が煩雑
                  </Typography>
                  <Typography sx={{ color: '#666', lineHeight: 1.7 }}>
                    • プログラミング用語の整理が困難
                  </Typography>
                  <Typography sx={{ color: '#666', lineHeight: 1.7 }}>
                    • 概念と表現の関係が見えにくい
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{
                bgcolor: '#fff',
                p: 4,
                borderRadius: 1,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                height: '100%'
              }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#000' }}>
                  解決策
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography sx={{ color: '#666', lineHeight: 1.7 }}>
                    • 概念を中心に複数言語を一元管理
                  </Typography>
                  <Typography sx={{ color: '#666', lineHeight: 1.7 }}>
                    • 言語を超えた知識の構造化
                  </Typography>
                  <Typography sx={{ color: '#666', lineHeight: 1.7 }}>
                    • Markdown対応で柔軟に記録
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography
          variant="h4"
          sx={{
            mb: 6,
            textAlign: 'center',
            fontWeight: 600,
            color: '#000'
          }}
        >
          3つの特徴
        </Typography>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{
              p: 4,
              borderRadius: 1,
              height: '100%',
              border: '1px solid #e0e0e0',
              transition: 'box-shadow 0.2s',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }
            }}>
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 600, color: '#000' }}
              >
                概念ベース
              </Typography>
              <Typography sx={{ color: '#666', lineHeight: 1.7 }}>
                1つの概念に複数の言語を紐付けて管理。言語の違いを超えた知識の整理が可能。
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{
              p: 4,
              borderRadius: 1,
              height: '100%',
              border: '1px solid #e0e0e0',
              transition: 'box-shadow 0.2s',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }
            }}>
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 600, color: '#000' }}
              >
                多言語対応
              </Typography>
              <Typography sx={{ color: '#666', lineHeight: 1.7 }}>
                英語・日本語・中国語など、無制限の言語に対応。プログラミング言語の用語管理にも最適。
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{
              p: 4,
              borderRadius: 1,
              height: '100%',
              border: '1px solid #e0e0e0',
              transition: 'box-shadow 0.2s',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }
            }}>
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 600, color: '#000' }}
              >
                高速検索
              </Typography>
              <Typography sx={{ color: '#666', lineHeight: 1.7 }}>
                N+1問題を解決し、73%の高速化を実現。大量のデータでも快適に検索。
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* CTA */}
      <Box sx={{ bgcolor: '#fafafa', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{
                mb: 4,
                fontWeight: 600,
                color: '#000'
              }}
            >
              今すぐ始めましょう
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/app')}
              sx={{
                bgcolor: '#000',
                color: '#fff',
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                textTransform: 'none',
                borderRadius: 1,
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#333',
                  boxShadow: 'none'
                }
              }}
            >
              アプリを開く
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{
        borderTop: '1px solid #e0e0e0',
        py: 4,
        textAlign: 'center'
      }}>
        <Container maxWidth="lg">
          <Typography variant="body2" sx={{ mb: 2, color: '#888' }}>
            React • Spring Boot • MySQL • Docker
          </Typography>
          <Typography variant="body2" sx={{ color: '#aaa' }}>
            © 2025 ConceptLink
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default LandingPage;