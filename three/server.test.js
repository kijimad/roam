import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { extractKdocNumber, createApp } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('extractKdocNumber', () => {
  it('有効なファイル名からkdoc番号を抽出できる', () => {
    expect(extractKdocNumber('20251208T083954--kdoc-500-test.html')).toBe(500);
    expect(extractKdocNumber('20250101T000000--kdoc-1-first.html')).toBe(1);
    expect(extractKdocNumber('20250101T000000--kdoc-999-test.html')).toBe(999);
  });

  it('無効なファイル名に対してnullを返す', () => {
    expect(extractKdocNumber('invalid-filename.html')).toBe(null);
    expect(extractKdocNumber('test.html')).toBe(null);
    expect(extractKdocNumber('kdoc-500.html')).toBe(null);
  });
});

describe('サーバーAPIテスト', () => {
  let app;
  let testDir;

  beforeAll(async () => {
    // テスト用ディレクトリとサンプルファイルを作成
    testDir = join(__dirname, 'test-public');
    await mkdir(testDir, { recursive: true });

    // テスト用HTMLファイルを作成
    await writeFile(
      join(testDir, '20250101T000000--kdoc-100-first.html'),
      '<html><head></head><body>First</body></html>'
    );
    await writeFile(
      join(testDir, '20250102T000000--kdoc-200-second.html'),
      '<html><head></head><body>Second</body></html>'
    );
    await writeFile(
      join(testDir, '20250103T000000--kdoc-300-third.html'),
      '<html><head></head><body>Third</body></html>'
    );
    // スクリプトが既に注入されているファイル
    await writeFile(
      join(testDir, '20250104T000000--kdoc-400-already-injected.html'),
      '<html><head><script>three@0.170.0</script></head><body>Already injected</body></html>'
    );

    app = createApp(testDir);
  });

  afterAll(async () => {
    // テスト用ディレクトリを削除
    await rm(testDir, { recursive: true, force: true });
  });

  describe('GET /api/next', () => {
    it('次のページを返す', async () => {
      const res = await request(app)
        .get('/api/next?current=20250101T000000--kdoc-100-first.html')
        .expect(200);

      expect(res.body.next).toBe('/20250102T000000--kdoc-200-second.html');
      expect(res.body.kdocNumber).toBe(200);
    });

    it('最後のページの場合はnullを返す', async () => {
      const res = await request(app)
        .get('/api/next?current=20250104T000000--kdoc-400-already-injected.html')
        .expect(200);

      expect(res.body.next).toBe(null);
    });

    it('無効な現在ページに対してnullを返す', async () => {
      const res = await request(app)
        .get('/api/next?current=invalid.html')
        .expect(200);

      expect(res.body.next).toBe(null);
    });
  });

  describe('GET /api/prev', () => {
    it('前のページを返す', async () => {
      const res = await request(app)
        .get('/api/prev?current=20250102T000000--kdoc-200-second.html')
        .expect(200);

      expect(res.body.prev).toBe('/20250101T000000--kdoc-100-first.html');
      expect(res.body.kdocNumber).toBe(100);
    });

    it('最初のページの場合はnullを返す', async () => {
      const res = await request(app)
        .get('/api/prev?current=20250101T000000--kdoc-100-first.html')
        .expect(200);

      expect(res.body.prev).toBe(null);
    });

    it('無効な現在ページに対してnullを返す', async () => {
      const res = await request(app)
        .get('/api/prev?current=invalid.html')
        .expect(200);

      expect(res.body.prev).toBe(null);
    });
  });

  describe('GET /api/random', () => {
    it('ランダムなkdocページを返す', async () => {
      const res = await request(app)
        .get('/api/random')
        .expect(200);

      expect(res.body.random).toMatch(/^\/.*--kdoc-\d+-.*\.html$/);
      expect(res.body.kdocNumber).toBeGreaterThanOrEqual(100);
      expect(res.body.kdocNumber).toBeLessThanOrEqual(400);
    });
  });

  describe('HTMLスクリプト注入', () => {
    it('HTMLにthree.jsスクリプトを注入する', async () => {
      const res = await request(app)
        .get('/20250101T000000--kdoc-100-first.html')
        .expect(200);

      expect(res.text).toContain('three@0.170.0');
      expect(res.text).toContain('importmap');
      expect(res.text).toContain('drum-scroll.js');
    });

    it('スクリプトを2重に注入しない', async () => {
      // 既にスクリプトがあるファイルをリクエスト
      const res = await request(app)
        .get('/20250104T000000--kdoc-400-already-injected.html')
        .expect(200);

      // 追加のスクリプトを注入せずそのまま返す
      const scriptCount = (res.text.match(/three@0\.170\.0/g) || []).length;
      expect(scriptCount).toBe(1);
    });

    it('ルートパス / にアクセスしたときもスクリプトを注入する', async () => {
      // テスト用index.htmlを作成
      await writeFile(
        join(testDir, 'index.html'),
        '<html><head></head><body>Index Page</body></html>'
      );

      const res = await request(app)
        .get('/')
        .expect(200);

      expect(res.text).toContain('three@0.170.0');
      expect(res.text).toContain('importmap');
      expect(res.text).toContain('drum-scroll.js');
    });
  });
});
