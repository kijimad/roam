"""リポジトリの統計を org の表で出す。使い方: stats.py repo|zettel"""

import glob
import os
import re
import subprocess
import sys
from collections import Counter
from datetime import datetime, timedelta

LINK_RE = re.compile(r"\[\[(?:id|denote):(\d{8}T\d{6})")
# denote-links は自動生成の一覧なので数えない
DBLOCK_RE = re.compile(r"^#\+BEGIN: denote-links.*?^#\+END:", re.M | re.S | re.I)
TAG_RE = re.compile(r"__(?:draft_)?(\w+)\.org$")
REL_RE = re.compile(r"^-\s*(?:([^\[\n:：]+)[:：])?[^\n]*?\[\[(?:id|denote):\d{8}T\d{6}\]\[[^]]*\]\](.*)$", re.M)
CATEGORY = {"permanent": "永続メモ", "book": "文献メモ", "essay": "エッセイ", "project": "プロジェクトメモ", "structure": "構造化メモ"}


def table(header, rows):
    print("| " + " | ".join(header) + " |")
    print("|-")
    for r in rows:
        print("| " + " | ".join(str(c) for c in r) + " |")
    print()


def components(keys, out):
    adj = {k: set() for k in keys}
    for k, v in out.items():
        for x in v:
            adj[k].add(x)
            adj[x].add(k)
    seen, sizes = set(), []
    for k in keys:
        if k in seen:
            continue
        stack, size = [k], 0
        seen.add(k)
        while stack:
            size += 1
            for x in adj[stack.pop()]:
                if x not in seen:
                    seen.add(x)
                    stack.append(x)
        sizes.append(size)
    return sorted(sizes, reverse=True)


def human(size):
    for unit in ("B", "K", "M", "G"):
        if size < 1024:
            return f"{size:.1f}{unit}" if unit != "B" else f"{size}B"
        size /= 1024
    return f"{size:.1f}T"


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True).stdout


def added_org(since, until=None):
    args = ["log", "--diff-filter=A", f"--since={since}", "--name-only", "--pretty=format:"]
    if until:
        args.append(f"--until={until}")
    return len({f for f in git(*args).splitlines() if "org" in f})


def repo():
    orgs = sorted(glob.glob("*.org"))
    texts = [open(f, encoding="utf-8").read() for f in orgs]
    body = "\n".join(texts)
    chars = sum(len(t) for t in texts)
    lines = sum(t.count("\n") for t in texts)
    images = [os.path.join(d, f) for d, _, fs in os.walk("images") for f in fs]
    count = lambda pattern: len(re.findall(pattern, body, re.M))

    table(["文書", "値"], [
        ["ビルド時刻", datetime.now().astimezone().strftime("%Y-%m-%dT%H:%M:%S")],
        [".orgファイル数", len(orgs)],
        [".orgファイルサイズ", human(sum(os.path.getsize(f) for f in orgs))],
        ["画像ファイル数(png, svg)", sum(1 for f in images if f.endswith((".png", ".svg")))],
        ["画像ファイルサイズ", human(sum(os.path.getsize(f) for f in images))],
        ["文字数", chars],
        ["行数", lines],
        ["句点の数", body.count("。")],
        ["読点の数", body.count("、")],
    ])

    table(["換算", "値"], [
        ["1ページ600文字とすると", f"{chars // 600}ページ"],
        ["本1冊300ページとすると", f"{chars // 600 // 300}冊"],
        ["本1冊10万文字とすると", f"{chars // 100000}冊"],
        ["本1冊2cmとすると", f"{chars // 100000 * 2}cm"],
        ["60行入るディスプレイだと", f"{lines // 60}枚分"],
        ["14インチディスプレイだと", f"{lines // 60 * 17 // 100}メートル"],
    ])

    table(["要素", "数"], [
        ["外部リンク", count(r"https?://")],
        ["内部リンク", count(r"\[\[id:")],
        ["見出し1", count(r"^\*\s+\S")],
        ["見出し2", count(r"^\*\*\s+\S")],
        ["見出し3", count(r"^\*\*\*\s+\S")],
        ["リスト", count(r"^-\s+\S")],
        ["脚注", count(r"\[fn:[^]]+\]")],
        ["挿入画像", count(r"^\[\[file:[^]]+\]\]")],
    ])

    status = {s: count(rf"^\*+\s+{s}\b") for s in ("TODO", "DONE", "WAIT", "WIP")}
    table(["ステータス", "数"], [*status.items(), ["合計", sum(status.values())]])

    log = git("log", "--date=format:%Y-%m-%dT%H:%M:%S", "--pretty=format:%ad").splitlines()
    table(["git", "値"], [
        ["コミット数", git("rev-list", "--count", "HEAD").strip()],
        ["最初のコミット", log[-1] if log else ""],
        ["最新のコミット", log[0] if log else ""],
    ])

    table(["期間", "追加した.orgファイル"], [
        [label, added_org(since)]
        for label, since in (("2年間", "2 years ago"), ("1年間", "1 year ago"), ("1ヶ月間", "1 month ago"), ("1週間", "1 week ago"))
    ])

    rows = []
    for i in range(1, 8):
        c = added_org(f"{i} days ago", f"{i - 1} days ago")
        rows.append([(datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"), c, "+" * c])
    table(["日付", "追加した.orgファイル", ""], rows)

    sites = {
        "MDN": r"https://(?:www\.)?developer\.mozilla\.org",
        "RFC": r"https://(?:www\.)?rfc-editor\.org",
        "Amazon(日本)": r"https://(?:www\.)?amazon\.co\.jp",
        "YouTube": r"https://(?:www\.)?youtube\.com",
        "Wikipedia": r"https://(?:[\w.]+\.)?wikipedia\.org",
    }
    table(["引用元", "引用数"], [[name, count(p)] for name, p in sites.items()])


def zettel():
    files = {re.match(r"(\d{8}T\d{6})", f).group(1): f for f in glob.glob("*--kdoc-*.org")}
    texts = {k: DBLOCK_RE.sub("", open(f, encoding="utf-8").read()) for k, f in files.items()}
    out = {k: {x for x in LINK_RE.findall(t) if x in files and x != k} for k, t in texts.items()}
    inn = Counter(x for v in out.values() for x in v)
    n = len(files)
    links = sum(len(v) for v in out.values())

    def ratio(keys):
        c = sum(1 for _ in keys)
        return f"{c} ({c * 100 // n}%)"

    since = (datetime.now() - timedelta(days=90)).strftime("%Y%m%d")
    recent = [k for k in files if k[:8] >= since]

    table(["指標", "値"], [
        ["KDOC数", n],
        ["ドラフト", sum(1 for f in files.values() if "__draft_" in f)],
        ["リンクの総数", links],
        ["1件あたりのリンク数(平均)", f"{links / n:.2f}"],
        ["ほかのKDOCへリンクしないKDOC", ratio(k for k in files if not out[k])],
        ["どのKDOCからもリンクされないKDOC", ratio(k for k in files if not inn[k])],
        ["孤立したKDOC(出入りとも0本)", ratio(k for k in files if not out[k] and not inn[k])],
        ["直近90日のKDOCのうちリンクしないもの", f"{sum(1 for k in recent if not out[k])} / {len(recent)}"],
    ])

    bins = [("0本", 0, 0), ("1本", 1, 1), ("2〜3本", 2, 3), ("4本以上", 4, 10**9)]
    table(["リンク数", "KDOC数"], [[label, sum(1 for k in files if lo <= len(out[k]) <= hi)] for label, lo, hi in bins])

    sizes = components(files, out)
    tag = {k: TAG_RE.search(f).group(1) for k, f in files.items()}
    hubbed = {x for k in files if tag[k] == "structure" for x in out[k]}
    year_ago = (datetime.now() - timedelta(days=365)).strftime("%Y%m%d")
    old_links = sum(1 for k, v in out.items() for x in v if x[:8] < year_ago and k[:8] >= year_ago)
    new_links = sum(len(v) for k, v in out.items() if k[:8] >= year_ago)
    rels = [m for k in files if "* 関連" in texts[k] for m in REL_RE.finditer(re.split(r"(?m)^\* ", texts[k].split("* 関連", 1)[1])[0])]
    described = sum(1 for m in rels if m.group(2).strip(" 。.\t"))
    table(["つながりの形", "値"], [
        ["つながったまとまりの数(孤立を含む)", len(sizes)],
        ["最大のまとまりに入るKDOC", f"{sizes[0]} ({sizes[0] * 100 // n}%)"],
        ["構造化メモからリンクされるKDOC", ratio(k for k in files if k in hubbed)],
        ["関連のリンクのうち説明があるもの", f"{described} / {len(rels)}"],
        ["古いメモから新しいメモへのリンク(プロジェクト・構造化メモを除く)", sum(1 for k, v in out.items() if tag[k] not in ("project", "structure") for x in v if x > k)],
        ["直近1年のKDOCのリンクのうち1年以上前のメモへのもの", f"{old_links} / {new_links}"],
    ])

    table(["カテゴリ", "KDOC数", "リンクしないもの"], [
        [name, c, f"{u} ({u * 100 // c}%)"]
        for key, name in CATEGORY.items()
        if (c := sum(1 for k in files if tag[k] == key))
        for u in [sum(1 for k in files if tag[k] == key and not out[k])]
    ])

    labels = Counter((m.group(1) or "(なし)").strip() for m in rels)
    table(["関連のラベル", "リンク数"], labels.most_common(8))


if __name__ == "__main__":
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
    {"repo": repo, "zettel": zettel}[sys.argv[1]]()
