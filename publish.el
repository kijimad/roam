;; Initialize package sources
(require 'package)

(defun yes-or-no-p (dummy) t)

(defvar bootstrap-version)
(let ((bootstrap-file
       (expand-file-name "straight/repos/straight.el/bootstrap.el" user-emacs-directory))
      (bootstrap-version 5))
  (unless (file-exists-p bootstrap-file)
    (with-current-buffer
        (url-retrieve-synchronously
         "https://raw.githubusercontent.com/raxod502/straight.el/develop/install.el"
         'silent 'inhibit-cookies)
      (goto-char (point-max))
      (eval-print-last-sexp)))
  (load bootstrap-file nil 'nomessage))

;; Set the package installation directory so that packages aren't stored in the
;; ~/.emacs.d/elpa path.
(setq package-user-dir (expand-file-name "./.packages"))
(setq package-archives '(("melpa" . "https://melpa.org/packages/")
                         ("elpa" . "https://elpa.gnu.org/packages/")
                         ("org" . "http://orgmode.org/elpa/")))
(setq debug-on-error t)

;; Initialize the package system
(package-initialize)
(unless package-archive-contents
  (package-refresh-contents))

;; Install use-package
(unless (package-installed-p 'use-package)
  (package-install 'use-package))
(require 'use-package)

;; Unfortunately this is necessary for now...
(load-file "./ox-slimhtml.el")

;; https://github.com/org-roam/org-roam/issues/2485 の対応
(use-package emacsql
  :ensure t
  :straight (:host github :repo "magit/emacsql" :commit "491105a01f58bf0b346cbc0254766c6800b229a2"))

;; Install other dependencies
(use-package esxml
  :ensure t)

(add-to-list 'load-path "./vendor/denote-2.0.0")
(require 'denote)
(require 'denote-org-dblock)
(setq denote-directory ".")
(setq denote-file-type 'org)

;; バージョンが上がったら動かなくなったため...
;; (use-package denote
;;   :ensure t
;;   :straight (:host github :repo "protesilaos/denote")
;;   :custom ((denote-directory "./")
;;            (denote-file-type 'org)))

;; (use-package denote-org
;;   :ensure t)

(use-package org-roam
  :ensure t)
(setq org-roam-directory "./")
(setq org-roam-db-location "./org-roam.db")
(setq org-roam-v2-ack t)
(setq org-id-link-to-org-use-id t)
(setq org-id-extra-files (org-roam--list-files org-roam-directory))

(use-package htmlize
  :ensure t)

(use-package webfeeder
  :straight (:host github :repo "emacsmirror/webfeeder")
  :ensure t)

;; libxmlが利用できるときは webfeeder-body-libxml を使う。フォールバックの関数 webfeeder-body-default は<article>で囲まれているかで判定するようである。現時点では<article>で囲われてないので、フォールバックの関数を使うとcontentは空になる
;; 記事内容の中に特定のパターンが含まれていると壊れたXMLになってしまう。変換時のエラーというわけではない
;; TODO: 有効かのチェックをやる
;; (setq webfeeder-body-function 'webfeeder-body-default)

(require 'ox-publish)

(setq make-backup-files nil)
(setq org-export-with-smart-quotes t)
(setq org-html-checkbox-type 'html)
(setq org-babel-default-header-args '((:session . "none")
                                      (:results . "replace")
                                      (:exports . "code")
                                      (:cache . "no")
                                      (:noweb . "no")
                                      (:hlines . "no")
                                      (:tangle . "no")
                                      (:wrap . "src")
                                      ))
;; CIでNo org-babel-execute function for bash!と出るので
(org-babel-do-load-languages 'org-babel-load-languages
                             '((shell . t)
                               (emacs-lisp . t)
                               ))

;; ignore org-babel warning
(setq python-indent-guess-indent-offset nil)

;; View
(setq dw/site-title   "Insomnia")
(setq dw/site-tagline "")

(setq org-publish-use-timestamps-flag t
      org-publish-timestamp-directory "./.org-cache/"
      org-export-with-section-numbers nil
      org-export-use-babel nil
      org-export-with-smart-quotes t
      org-export-with-sub-superscripts nil
      org-export-with-tags 'not-in-toc
      org-export-with-toc nil)

;; 本番のGitHub Pagesでは絶対パス
;; 開発環境では相対パス
(defvar kd/site-url (if (string-equal (getenv "PRODUCTION") "true")
                        "https://kijimad.github.io/roam"
                      ".")
  "The URL for the site being generated.")

(defun dw/site-header (info)
  (let* ((file (plist-get info :output-file)))
    (concat
     (sxml-to-xml
      `(div (div (@ (class "header"))
                 (div (@ (class "container"))
                      (div (@ (class "row"))
                           (div (@ (class "col-sm-12 col-md-12"))
                                (nav (@ (class "navbar navbar-light"))
                                     ;; (a (@ (class "nav-link text-dark") (href "/roam")) "Insomnia")
                                     ))))))))))

;; 参考 https://github.com/SystemCrafters/systemcrafters.github.io/blob/master/publish.el
(defun dw/site-footer (info)
  (concat
   ;; "</div></div>"
   (sxml-to-xml
    `(footer (@ (class "footer py-3"))
             (div (@ (class "container"))
                  (div (@ (class "row "))
                       (div (@ (class "col-md-4")) "")
                       (div (@ (class "col-sm col-md"))
                            (nav (@ (class "navbar"))
                                 (a (@ (class "nav-link text-secondary small px-0") (href "./index.html")) "Insomnia")
                                 (a (@ (class "nav-link text-secondary small px-0") (href "./sitemap.html")) "Sitemap")
                                 (a (@ (class "nav-link text-secondary small px-0") (href "https://github.com/kijimaD/roam")) "Repository")
                                 (a (@ (class "nav-link text-secondary small px-0") (href "https://github.com/kijimaD")) "@kijimaD")))
                       (div (@ (class "col-md-4")) "")))))
   ;; 今のところBootstrapのJS箇所は使っていない
   ;; (sxml-to-xml
   ;;  `(script (@ (src "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"))))
   ))

;; 表は Bootstrap の見た目にする。HTML5 では org-html-table-default-attributes が使われないので、書き出した表にクラスを足す
(defun kd/html-table-bootstrap (table backend _info)
  (when (org-export-derived-backend-p backend 'html)
    (replace-regexp-in-string "<table" "<table class=\"table\" data-bs-theme=\"dark\"" table t t)))
(add-to-list 'org-export-filter-table-functions #'kd/html-table-bootstrap)

(setq org-html-preamble  #'dw/site-header
      org-html-postamble #'dw/site-footer
      org-html-html5-fancy nil
      ;; コードの色分けはブラウザの highlight.js に任せる
      org-html-htmlize-output-type nil
      org-html-self-link-headlines t
      org-html-validation-link nil
      org-html-doctype "html5")

(setq my-blog-extra-head
      (concat
       ;; ブラウザは、そのサイトのホスト直下に favicon.ico が 設置されていることを期待する。
       ;; GitHub Pagesにデプロイすると、リポジトリ名の下で配信するのでルートパスではfaviconが配置されていないことになる。
       (format "<link rel='shortcut icon' type='image/x-icon' href='%s/favicon.ico' />" kd/site-url)

       ;; サイズが比較的大きいので非同期に読み込ませる
       ;; PageSpeed Insights で指摘された項目
       ;; link要素にはasync属性やdefer属性がない
       ;; 記法の参考: https://qiita.com/rana_kualu/items/95a7adf8420ea2b9f657
       "<link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css' media='print' onload='this.media=\"all\"' />"

       ;; ルートディレクトリにないorgファイルをエクスポートした場合、相対パスが変わる。絶対パスにするとGH pagesのルートディレクトリがpublicの一つ上の階層になる(/リポジトリ名/public)ため、ローカル環境で使えなくなる。つまりローカルでは`/`でokなのに、本番では`/roam`としないといけない。
       (format "<link rel='preload' href='%s/css/fonts/izumi16.woff2' as='font' type='font/woff2' crossorigin />" kd/site-url)
       ;; コードの色分け。既定の版にない言語は別に読み込む
       "<link rel='stylesheet' href='https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/styles/base16/gruvbox-dark-medium.min.css' />"
       "<script defer src='https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/highlight.min.js'></script>"
       "<script defer src='https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/languages/haskell.min.js'></script>"
       "<script defer src='https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/languages/clojure.min.js'></script>"
       "<script defer src='https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/languages/scala.min.js'></script>"
       "<script defer src='https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/languages/lisp.min.js'></script>"
       "<script defer src='https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/languages/dockerfile.min.js'></script>"
       ;; defer のスクリプトはすべて DOMContentLoaded の前に実行されるので、1つ読めなくても残りの言語には色が付く
       ;; 言語は org が pre に付ける src-言語 のクラスから読ませる。org の shell はスクリプトなので bash として扱う
       "<script>addEventListener('DOMContentLoaded', () => {
  if (!window.hljs) return;
  hljs.configure({languageDetectRe: /\\bsrc-([\\w-]+)\\b/i});
  hljs.unregisterLanguage('shell');
  hljs.registerAliases(['shell', 'sh'], {languageName: 'bash'});
  hljs.registerAliases(['emacs-lisp', 'elisp'], {languageName: 'lisp'});
  hljs.highlightAll();
});</script>"
       (format "<link rel='stylesheet' href='%s/css/site.css' />" kd/site-url)
       (format "<link rel='stylesheet' href='%s/css/code.css' />" kd/site-url)

       ))

;; Compile
(setq org-publish-project-alist
      `(
        ("kijima:roam"
         :recursive t
         :base-extension "org"
         :base-directory "./"
         :exclude "NEWS.org" ;; FIXME: can't specify .packages directory...
         :publishing-function org-html-publish-to-html
         :publishing-directory "./public"

         :html-link-home "/"
         :html-head nil ;; cleans up anything that would have been in there.
         :html-head-extra ,my-blog-extra-head
         :html-head-include-default-style nil
         :html-head-include-scripts nil

         :html-link-up ""
         :html-link-home ""
         :with-timestamps nil
         :with-toc nil

         :sitemap-title "Sitemap"
         :auto-sitemap t ;; generate sitemap.org automatically
         :author "kijimaD"
         )))

(defun generate-org-roam-db ()
  (interactive)
  (setq org-roam-graph-viewer nil)
  (setq org-roam-graph-link-hidden-types '("https" "http" "file"))
  (setq org-roam-v2-ack t)
  (org-roam-db-sync))

(setq org-todo-keywords '((type "TODO" "WIP" "|" "DONE" "CLOSE")))
(setq org-todo-keyword-faces
      '(("TODO" . (:foreground "orange" :weight bold))
        ("WIP" . (:foreground "DeepSkyBlue" :weight bold))
        ("DONE" . (:foreground "green" :weight bold))
        ("CLOSE" . (:foreground "DarkOrchid" :weight bold))))

(setq org-agenda-exporter-settings
      '((ps-number-of-columns 2)
        (ps-landscape-mode t)
        (org-agenda-add-entry-text-maxlines 0)
        (org-agenda-show-log nil)
        (org-agenda-with-colors t)
        (org-agenda-remove-tags t)
        (htmlize-output-type 'inline-css)))

(setq org-agenda-prefix-format
      `((agenda . " %i %-12(vulpea-agenda-category)%?-12t% s")
        (todo . " %i %-12(vulpea-agenda-category) ")
        (tags . " %i %-12(vulpea-agenda-category) ")
        (search . " %i %-12(vaulpea-agenda-category) ")))

;; original -> https://d12frosted.io/posts/2020-06-24-task-management-with-roam-vol2.html
(defun vulpea-agenda-category ()
  (let* ((title (vulpea-buffer-prop-get "title")))
    title))

(defun vulpea-buffer-prop-get (name)
  "Get a buffer property called NAME as a string."
  (org-with-point-at 1
    (if (re-search-forward (concat "^#\\+" name ": \\(.*\\)")
                           (point-max) t)
        (buffer-substring-no-properties
         (match-beginning 1)
         (match-end 1))
      "")))

(defun kd/update-index-table ()
  "Update index.org table."
  (let ((org-agenda-files '("./")))
    (find-file "index.org")
    (org-dblock-update t)
    (org-babel-execute-buffer)
    (save-buffer)))

(defun kd/update-dlinks-table ()
  "Update kdoc.org table."
  (let ((org-agenda-files '("./")))
    (find-file "dlinks.org")
    (org-dblock-update t)
    (org-babel-execute-buffer)
    (save-buffer)))

(defun kd/denote-batch-rename-in-current-directory ()
    "Rename denote files."
    (interactive)
    (let ((files (directory-files "." t ".*T.*--.*__.*\\.org")))
      (dolist (file files)
        (message file)
        (when (denote-file-is-note-p file)
          (message "Renaming: %s" file)
          (denote-rename-file-using-front-matter file 0))
        )))

(defun kd/publish ()
  "Execute publish."
  (org-publish-all t)
  (org-batch-store-agenda-views)

  (let ((entries))
    ;; 直近のエントリだけを載せる
    (setq entries (cl-subseq
                   (sort
                    ;; ファイル名だけのリスト
                    (directory-files (expand-file-name "./public/") nil ".+?--.+?\\.html$")
                    #'string>)
                   0 20))

    (webfeeder-build
     "atom.xml"
     "./public"
     kd/site-url
     entries
     :builder 'webfeeder-make-atom
     :title "Insomnia"
     :description "Insomnia"
     :author "Kijima Daigo"
     )))

;; バックリンクをつける
;; https://www.takeokunn.org/posts/permanent/20231219122351-how_to_manage_blog_by_org_roam/
(defun collect-backlinks-string (backend)
  (interactive)
  (when (org-roam-node-at-point)
    (goto-char (point-max))
    ;; Add a new header for the references
    (let* ((backlinks (org-roam-backlinks-get (org-roam-node-at-point)))
           (results))
      (when (> (length backlinks) 0)
        (insert "\n\n* Backlinks\n")
        (dolist (backlink backlinks)
          (message (concat "-> backlink: " (org-roam-node-title (org-roam-backlink-source-node backlink))))
          (let* ((source-node (org-roam-backlink-source-node backlink))
                 (node-file (org-roam-node-file source-node))
                 (file-name (file-name-nondirectory node-file))
                 (title (org-roam-node-title source-node)))
            (add-to-list 'results (format "- [[./%s][%s]]\n" file-name title))))
        (setq results (sort results 'string<))
        (dolist (result results)
          (insert result))))))
(add-hook 'org-export-before-processing-functions #'collect-backlinks-string)

(provide 'publish)
