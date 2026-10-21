ツェッテルカステン方式で書いている

メモのレビューは `zettel-review` スキルの手順で行う。

## コードブロックの実行

メモのコードブロックを実行して `#+RESULTS:` を埋めるときは、起動中の Emacs に `emacsclient --eval` で実行させる。素の `emacs --batch` では手元の `org-babel-default-header-args`(`:wrap "src"` など)やパッケージ(ob-git-permalink など)が効かず、結果の形が変わる。

- 実行前に、そのファイルのバッファが未保存の変更を持っていないか確かめる。持っていたら触らない
- ディスクの方が新しければ先に読み直す。読み直さないと、手元の Emacs が読み直すかを尋ねて止まる
- `org-babel-execute-buffer` は使わない。`:wrap "src"` の結果は言語なしの `#+begin_src` になり、それを実行しようとして止まる
- `#+begin_src <言語>` を順に探してブロックごとに `org-babel-execute-src-block` し、最後に保存する。言語を変えるときは、 `:wrap src c` のように結果が同じ言語で囲まれるブロックがないか確かめる。あると結果まで実行してしまう
- もともと開いていなかったバッファは、終わったら閉じる
- git-permalink のブロックは、ヘッダに `:wrap src <言語>` を付ける(例 `#+begin_src git-permalink :wrap src go`)。言語はリンク先のファイルの言語にする。付けないと結果が言語なしの `#+begin_src` になり、コードの色分けが効かない

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
