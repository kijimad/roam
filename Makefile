.DEFAULT_GOAL := help

# build tasks ================

.PHONY: update-index
update-index: ## indexページを更新する
	emacs --batch -l ./publish.el --funcall kd/update-index-table

.PHONY: update-dlinks
update-dlinks: ## denote linksページを更新する(ローカルで実行する用)
	emacs --batch -l ./publish.el --funcall kd/update-dlinks-table

.PHONY: org2html
org2html: ## org projectをhtmlに一括変換する
	emacs --batch -l ./publish.el --funcall generate-org-roam-db
	emacs --batch -l ./publish.el --funcall kd/publish
	cp -r ./images ./public/
	cp -r ./buseum ./public/
	cp -r ./pdfs ./public/

.PHONY: node-graph
node-graph: ## ファイルの関係性グラフを描画する
	emacs --batch -l ./publish.el --funcall generate-org-roam-db
	pip3 install -r requirements.txt --break-system-packages
	python3 node_graph/build_graph.py > public/js/graph.json

.PHONY: pmd-graph
pmd-graph: ## ポモドーロの記録ファイルを公開ディレクトリに移す
	cp pmd.csv public/js/

.PHONY: file-graph
file-graph: ## ファイル数の統計情報をグラフ化する
	ruby ./git-file/git-file.rb > ./git-file/git-file.dat
	gnuplot ./git-file/git-file.plot

.PHONY: line-graph
line-graph: ## 行数の統計情報をグラフ化する
	ruby ./git-line/git-line.rb > ./git-line/git-line.dat
	gnuplot ./git-line/git-line.plot

.PHONY: gen-file-table
gen-file-table: ## ファイルの情報を書き込む
	# 日本語のファイルがあると文字化けする対策
	git config --global core.quotepath false
	ruby ./file-count/table.rb >> ./index.org

.PHONY: odp2pdf
odp2pdf: ## ODPスライドをPDFに変換する
	cd ./pdfs && \
	libreoffice --convert-to pdf *.odp

# development ================

FILES ?= ./*.org
.PHONY: textlint
textlint:
	docker build . --target textlint -t roam_textlint
	docker run -v $(PWD):/work/roam -w /work/roam --rm roam_textlint bash -c "npx textlint -c ./.textlintrc $(FILES)"

.PHONY: relink
relink: ## リンクのタイトルをすべて更新する
	find . -name '*.org' | xargs -n1 ./scripts/relink.sh

.PHONY: rename
rename: ## denoteファイルをすべて更新する
	emacs --batch -l ./publish.el --funcall kd/denote-batch-rename-in-current-directory

.PHONY: server
server: ## webサーバを起動する
	docker compose up -d

.PHONY: watch
watch: ## 自動更新する
	./scripts/watch.sh

.PHONY: prunefile
prunefile: ## 不要なファイルを消す
	./scripts/prunefile.sh

.PHONY: help
help: ## ヘルプを表示する
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
