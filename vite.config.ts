import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function pythonRunnerPlugin(): Plugin {
  return {
    name: 'python-runner-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        if (url === '/api/run-python' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { command, args = [] } = JSON.parse(body || '{}');
              const allowedCmds = [
                'main.py',
                'database.py',
                'test_basic.py',
                'insights.py',
              ];

              const targetFile = allowedCmds.includes(command) ? command : 'main.py';
              const scriptPath = path.resolve(__dirname, 'python_project', targetFile);

              const safeArgs = Array.isArray(args)
                ? args.filter(a => typeof a === 'string' && a.length < 100)
                : [];

              const startTime = Date.now();
              execFile(
                'python3',
                [scriptPath, ...safeArgs],
                { timeout: 8000, maxBuffer: 1024 * 1024 },
                (error, stdout, stderr) => {
                  const durationMs = Date.now() - startTime;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      success: !error,
                      stdout: stdout || '',
                      stderr: stderr || '',
                      exitCode: error ? error.code : 0,
                      durationMs,
                    })
                  );
                }
              );
            } catch (err: unknown) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: (err as Error).message }));
            }
          });
          return;
        }

        if (url === '/api/get-python-files' && req.method === 'GET') {
          try {
            const dir = path.resolve(__dirname, 'python_project');
            const files = fs.readdirSync(dir);
            const result: Record<string, string> = {};
            for (const file of files) {
              if (file.endsWith('.py') || file.endsWith('.cpp') || file.endsWith('.txt') || file.endsWith('.md')) {
                result[file] = fs.readFileSync(path.join(dir, file), 'utf-8');
              }
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ files: result }));
          } catch (err: unknown) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: (err as Error).message }));
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      pythonRunnerPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'GenZ Expense',
          short_name: 'GenZExpense',
          description: 'Smart habit-aware expense tracker & offline spending insights.',
          theme_color: '#18181b',
          background_color: '#09090b',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
