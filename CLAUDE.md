ツェッテルカステン方式で書いている

## レビュー項目

### レビュー対象

`git diff` を見て、ファイル名から draft が外れたファイルをレビューの対象にしてください。

### 作成基準

メモの作成基準を満たしているか確認する。

1. 3回ルール(頻度)

同じことを3回調べた/考えたこと。

2. 10分ルール(難易度)

理解に10分以上かかったこと。

3. 驚きルール(意外性)

「へぇ、そうなのか」と思ったこと。直感的ではないこと、じっさいに確かめたこと。

### フォーマット

このメモはツェッテルカステン方式である。フォーマットを満たしているか確認する。

- 1つのメモには1つの事実だけを書く
- 疑問/答えでは別ファイルにメモする

### レビュー内容

- 内容が正しいか厳密に検証する
- 批判的に確認する
- 真に理解しているかを確かめる質問を列挙する。目的、仕組み、比較、...

### 伝え方

日本語でレビューする。

## コードブロックの実行

メモのコードブロックを実行して `#+RESULTS:` を埋めるときは、起動中の Emacs に `emacsclient --eval` で実行させる。素の `emacs --batch` では手元の `org-babel-default-header-args`(`:wrap "src"` など)やパッケージ(ob-git-permalink など)が効かず、結果の形が変わる。

- 実行前に、そのファイルのバッファが未保存の変更を持っていないか確かめる。持っていたら触らない
- ディスクの方が新しければ先に読み直す。読み直さないと、手元の Emacs が読み直すかを尋ねて止まる
- `org-babel-execute-buffer` は使わない。`:wrap "src"` の結果は言語なしの `#+begin_src` になり、それを実行しようとして止まる
- `#+begin_src <言語>` を順に探してブロックごとに `org-babel-execute-src-block` し、最後に保存する。言語を変えるときは、 `:wrap src c` のように結果が同じ言語で囲まれるブロックがないか確かめる。あると結果まで実行してしまう
- もともと開いていなかったバッファは、終わったら閉じる

```elisp
(let* ((path "<ファイル>")
       (existing (get-file-buffer path)))
  (if (and existing (buffer-modified-p existing))
      "ABORT: 未保存の変更がある"
    (with-current-buffer (or existing (find-file-noselect path))
      (unless (verify-visited-file-modtime (current-buffer))
        (revert-buffer t t t))
      (let ((org-confirm-babel-evaluate nil))
        (save-excursion
          (goto-char (point-min))
          (while (re-search-forward "^[ \t]*#\\+begin_src shell" nil t)
            (org-babel-execute-src-block))))
      (save-buffer)
      (unless existing (kill-buffer))
      "ok")))
```
