// ナビゲーションボタンの機能を初期化
function initNavigation() {
  const currentPath = window.location.pathname;
  const DRAFT_MODE_KEY = 'kdoc-draft-mode';

  // ローカルストレージから草案モードの状態を読み込み
  const toggle = document.getElementById('draft-only-toggle');
  if (toggle) {
    const savedDraftMode = localStorage.getItem(DRAFT_MODE_KEY) === 'true';
    toggle.checked = savedDraftMode;

    // トグルの変更を監視して保存
    toggle.addEventListener('change', () => {
      localStorage.setItem(DRAFT_MODE_KEY, toggle.checked);
    });
  }

  // ドラフトのみトグルの状態を取得
  function isDraftOnly() {
    const toggle = document.getElementById('draft-only-toggle');
    return toggle ? toggle.checked : false;
  }

  // 前のページボタン
  const prevButton = document.getElementById('nav-prev');
  if (prevButton) {
    prevButton.addEventListener('click', async () => {
      try {
        const draftOnly = isDraftOnly();
        const response = await fetch(`/api/prev?current=${encodeURIComponent(currentPath)}&draftOnly=${draftOnly}`);
        const data = await response.json();
        if (data.prev) {
          window.location.href = data.prev;
        } else {
          alert('前のページはありません');
        }
      } catch (error) {
        console.error('前のページ取得エラー:', error);
      }
    });
  }

  // 次のページボタン
  const nextButton = document.getElementById('nav-next');
  if (nextButton) {
    nextButton.addEventListener('click', async () => {
      try {
        const draftOnly = isDraftOnly();
        const response = await fetch(`/api/next?current=${encodeURIComponent(currentPath)}&draftOnly=${draftOnly}`);
        const data = await response.json();
        if (data.next) {
          window.location.href = data.next;
        } else {
          alert('次のページはありません');
        }
      } catch (error) {
        console.error('次のページ取得エラー:', error);
      }
    });
  }

  // ランダムページボタン
  const randomButton = document.getElementById('nav-random');
  if (randomButton) {
    randomButton.addEventListener('click', async () => {
      try {
        const response = await fetch('/api/random');
        const data = await response.json();
        if (data.random) {
          window.location.href = data.random;
        } else {
          alert('ランダムページが見つかりません');
        }
      } catch (error) {
        console.error('ランダムページ取得エラー:', error);
      }
    });
  }
}

// DOMContentLoadedで初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavigation);
} else {
  initNavigation();
}
