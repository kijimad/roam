import express from 'express';
import { readFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const PORT = process.env.PORT || 3333;
export const PUBLIC_DIR = process.env.PUBLIC_DIR || 'public';

// ファイル名からkdoc番号を抽出
export function extractKdocNumber(filename) {
  const match = filename.match(/--kdoc-(\d+)-/);
  return match ? parseInt(match[1]) : null;
}

// アプリケーションを作成
export function createApp(publicDir = PUBLIC_DIR) {
  const app = express();

  // ナビゲーションボタンのHTML
  const NAV_BUTTONS_HTML = `
<div id="navigation-buttons" class="py-3">
  <div class="container">
    <div class="d-flex justify-content-center align-items-center gap-2">
      <button id="nav-prev" class="btn btn-outline-dark">← 前</button>
      <button id="nav-random" class="btn btn-outline-dark">ランダム</button>
      <button id="nav-next" class="btn btn-outline-dark">次 →</button>
      <div class="form-check ms-3">
        <input class="form-check-input" type="checkbox" id="draft-only-toggle">
        <label class="form-check-label" for="draft-only-toggle">
          ドラフトのみ
        </label>
      </div>
    </div>
  </div>
</div>
<script src="/js/navigation.js"></script>`;

  // HTMLファイルにナビゲーションボタンを注入するミドルウェア
  app.use(async (req, res, next) => {
    // .htmlで終わるパス、または / (index.htmlとして扱う)
    if (!req.path.endsWith('.html') && req.path !== '/') {
      return next();
    }

    try {
      const decodedPath = decodeURIComponent(req.path);
      // / の場合は index.html として扱う
      const filePath = decodedPath === '/'
        ? join(publicDir, 'index.html')
        : join(publicDir, decodedPath);
      const html = await readFile(filePath, 'utf-8');

      // 既にナビゲーションボタンが含まれている場合はそのまま返す
      if (html.includes('id="navigation-buttons"')) {
        return res.send(html);
      }

      // <div id="content">の直前にナビゲーションボタンを挿入
      const modifiedHtml = html.replace(
        /(<div id="content"[^>]*>)/i,
        `${NAV_BUTTONS_HTML}\n$1`
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
    const draftOnly = req.query.draftOnly === 'true';

    if (!currentKdocNumber) {
      return res.json({ next: null });
    }

    try {
      const files = await readdir(publicDir);
      let kdocFiles = files
        .map(f => ({ filename: f, number: extractKdocNumber(f) }))
        .filter(f => f.number !== null);

      // draftOnlyがtrueの場合、_draftを含むファイルのみにフィルタ
      if (draftOnly) {
        kdocFiles = kdocFiles.filter(f => f.filename.includes('_draft'));
      }

      kdocFiles.sort((a, b) => a.number - b.number);

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
    const draftOnly = req.query.draftOnly === 'true';

    if (!currentKdocNumber) {
      return res.json({ prev: null });
    }

    try {
      const files = await readdir(publicDir);
      let kdocFiles = files
        .map(f => ({ filename: f, number: extractKdocNumber(f) }))
        .filter(f => f.number !== null);

      // draftOnlyがtrueの場合、_draftを含むファイルのみにフィルタ
      if (draftOnly) {
        kdocFiles = kdocFiles.filter(f => f.filename.includes('_draft'));
      }

      kdocFiles.sort((a, b) => a.number - b.number);

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

  // navigation.jsを配信
  app.get('/js/navigation.js', async (req, res) => {
    try {
      const navigationPath = join(__dirname, 'navigation.js');
      const content = await readFile(navigationPath, 'utf-8');
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
