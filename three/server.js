import express from 'express';
import { readFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const PORT = process.env.PORT || 3333;
export const PUBLIC_DIR = join(__dirname, '..', 'public');

// ファイル名からkdoc番号を抽出
export function extractKdocNumber(filename) {
  const match = filename.match(/--kdoc-(\d+)-/);
  return match ? parseInt(match[1]) : null;
}

// アプリケーションを作成
export function createApp(publicDir = PUBLIC_DIR) {
  const app = express();

  // Three.js import map script
  const IMPORTMAP_SCRIPT = `<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
  }
}
</script>
<script type="module" src="js/drum-scroll.js"></script>`;

  // HTMLファイルにスクリプトを注入するミドルウェア
  app.use(async (req, res, next) => {
    if (!req.path.endsWith('.html')) {
      return next();
    }

    try {
      const decodedPath = decodeURIComponent(req.path);
      const filePath = join(publicDir, decodedPath);
      const html = await readFile(filePath, 'utf-8');

      if (html.includes('three@0.170.0')) {
        return res.send(html);
      }

      const modifiedHtml = html.replace(
        /(<head[^>]*>)/i,
        `$1\n${IMPORTMAP_SCRIPT}`
      );

      res.send(modifiedHtml);
    } catch (error) {
      next();
    }
  });

  // API: 次のKDOCページを取得
  app.get('/api/next', async (req, res) => {
    const current = decodeURIComponent(req.query.current || '').replace(/^\//, '');
    const currentKdocNumber = extractKdocNumber(current);

    if (!currentKdocNumber) {
      return res.json({ next: null });
    }

    try {
      const files = await readdir(publicDir);
      const kdocFiles = files
        .map(f => ({ filename: f, number: extractKdocNumber(f) }))
        .filter(f => f.number !== null)
        .sort((a, b) => a.number - b.number);

      const nextFile = kdocFiles.find(f => f.number > currentKdocNumber);

      if (nextFile) {
        res.json({
          next: `/${nextFile.filename}`,
          kdocNumber: nextFile.number
        });
      } else {
        res.json({ next: null });
      }
    } catch (error) {
      res.status(500).json({ error: '次のページ取得に失敗' });
    }
  });

  // API: 前のKDOCページを取得
  app.get('/api/prev', async (req, res) => {
    const current = decodeURIComponent(req.query.current || '').replace(/^\//, '');
    const currentKdocNumber = extractKdocNumber(current);

    if (!currentKdocNumber) {
      return res.json({ prev: null });
    }

    try {
      const files = await readdir(publicDir);
      const kdocFiles = files
        .map(f => ({ filename: f, number: extractKdocNumber(f) }))
        .filter(f => f.number !== null)
        .sort((a, b) => a.number - b.number);

      const prevFiles = kdocFiles.filter(f => f.number < currentKdocNumber);
      const prevFile = prevFiles[prevFiles.length - 1];

      if (prevFile) {
        res.json({
          prev: `/${prevFile.filename}`,
          kdocNumber: prevFile.number
        });
      } else {
        res.json({ prev: null });
      }
    } catch (error) {
      res.status(500).json({ error: '前のページ取得に失敗' });
    }
  });

  // API: ランダムなKDOCページを取得
  app.get('/api/random', async (req, res) => {
    try {
      const files = await readdir(publicDir);
      const kdocFiles = files.filter(f => f.match(/--kdoc-\d+-.*\.html$/));

      if (kdocFiles.length === 0) {
        return res.json({ random: null });
      }

      const randomFile = kdocFiles[Math.floor(Math.random() * kdocFiles.length)];
      const kdocNumber = extractKdocNumber(randomFile);

      res.json({
        random: `/${randomFile}`,
        kdocNumber: kdocNumber
      });
    } catch (error) {
      res.status(500).json({ error: 'ランダムページ取得に失敗' });
    }
  });

  // drum-scroll.jsを配信
  app.get('/js/drum-scroll.js', async (req, res) => {
    try {
      const drumScrollPath = join(__dirname, 'drum-scroll.js');
      const content = await readFile(drumScrollPath, 'utf-8');
      res.type('application/javascript').send(content);
    } catch (error) {
      res.status(404).send('Not found');
    }
  });

  // drum-scroll-utils.jsを配信
  app.get('/js/drum-scroll-utils.js', async (req, res) => {
    try {
      const utilsPath = join(__dirname, 'drum-scroll-utils.js');
      const content = await readFile(utilsPath, 'utf-8');
      res.type('application/javascript').send(content);
    } catch (error) {
      res.status(404).send('Not found');
    }
  });

  // navigation-buttons.jsを配信
  app.get('/js/navigation-buttons.js', async (req, res) => {
    try {
      const navButtonsPath = join(__dirname, 'navigation-buttons.js');
      const content = await readFile(navButtonsPath, 'utf-8');
      res.type('application/javascript').send(content);
    } catch (error) {
      res.status(404).send('Not found');
    }
  });

  // 静的ファイルを配信
  app.use(express.static(publicDir));

  return app;
}

// サーバーを起動（モジュールとしてimportされた場合は起動しない）
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApp();
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`3D Viewer Server running at http://0.0.0.0:${PORT}`);
    console.log(`Serving files from: ${PUBLIC_DIR}`);
  });

  // ポート使用中エラーの処理
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\nError: Port ${PORT} is already in use.`);
      console.error(`Please try a different port by setting the PORT environment variable:`);
      console.error(`  PORT=3334 npm start\n`);
      process.exit(1);
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  });
}
