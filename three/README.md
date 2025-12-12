# 3D Viewer Server

Expressサーバーで、HTMLファイルに自動的にThree.jsとdrum-scroll.jsを注入します。

## セットアップ

```bash
cd three
npm install
```

## 起動

```bash
npm start
```

サーバーは http://localhost:3000 で起動します。

## 動作

- `public/` ディレクトリのファイルを配信
- `.html` ファイルには自動的に以下を挿入：
  - Three.js import map
  - drum-scroll.js

## 使い方

ブラウザで http://localhost:3000/index.html にアクセスすると、自動的に3Dビューが有効になります。

## Viewerモード

http://localhost:3000/viewer.html?url=index.html で別のページを3D表示できます。
