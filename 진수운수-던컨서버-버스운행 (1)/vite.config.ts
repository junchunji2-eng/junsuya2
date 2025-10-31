import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/<your-repo-name>/', // <-- 중요: 이 부분을 실제 GitHub 저장소 이름으로 바꿔주세요. 예: '/mission-manager/'
})
