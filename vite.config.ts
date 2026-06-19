import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 部署时需要设置为仓库名，如 '/LogicPlay/'
  // 本地开发时设为 '/' 即可
  base: process.env.GITHUB_PAGES ? '/LogicPlay/' : '/',
  plugins: [
    react(),
    {
      name: 'pyodide-static',
      configureServer(server) {
        // 拦截 /pyodide/ 请求，直接返回静态文件，不让 Vite 当模块处理
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/pyodide/')) {
            const filePath = path.join(
              __dirname,
              'public',
              req.url
            )
            if (fs.existsSync(filePath)) {
              const ext = path.extname(filePath)
              const mimeTypes: Record<string, string> = {
                '.wasm': 'application/wasm',
                '.mjs': 'application/javascript',
                '.js': 'application/javascript',
                '.json': 'application/json',
                '.zip': 'application/zip',
              }
              const contentType = mimeTypes[ext] || 'application/octet-stream'
              res.setHeader('Content-Type', contentType)
              // COEP 头让 wasm 能正常加载
              res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
              return fs.createReadStream(filePath).pipe(res)
            }
          }
          next()
        })
      },
    },
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['pyodide'],
  },
})
