import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Streamlit 커스텀 컴포넌트 iframe 환경에서 정적 에셋(JS/CSS)을
// 상대 경로로 정상 로딩하기 위해 base: './' 설정이 반드시 필요합니다.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
});
