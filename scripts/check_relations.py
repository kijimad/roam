"""KDOC の関連の向き(新→古)とラベルを確かめる。"""

import glob
import os
import re
import sys

LINK_RE = re.compile(r"\[\[(?:id|denote):(\d{8}T\d{6})")
# denote-links は自動生成の一覧なので数えない
DBLOCK_RE = re.compile(r"^#\+BEGIN: denote-links.*?^#\+END:", re.M | re.S | re.I)
TAG_RE = re.compile(r"__(?:draft_)?(\w+)\.org$")
EXCLUDE = {"project", "structure"}
ITEM_RE = re.compile(r"^\s*-\s+(.*\[\[(?:id|denote):\d{8}T\d{6}.*)$", re.M)
LABEL_RE = re.compile(r"^[^\[\n:：]+[:：]")


def relation_section(text):
    if "* 関連" not in text:
        return ""
    return re.split(r"(?m)^\* ", text.split("* 関連", 1)[1])[0]


def main():
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
    files = {re.match(r"(\d{8}T\d{6})", f).group(1): f for f in glob.glob("*--kdoc-*.org")}
    direction, labels = [], []
    for k, f in sorted(files.items()):
        text = DBLOCK_RE.sub("", open(f, encoding="utf-8").read())
        if TAG_RE.search(f).group(1) not in EXCLUDE:
            for x in sorted(set(LINK_RE.findall(text))):
                if x in files and x > k:
                    direction.append(f"{f}\n  -> {files[x]}")
        for m in ITEM_RE.finditer(relation_section(text)):
            if not LABEL_RE.match(m.group(1)):
                labels.append(f"{f}\n  {m.group(1)}")

    for title, found in (("古いメモから新しいメモへのリンク", direction), ("ラベルのない関連", labels)):
        if found:
            print(f"## {title}: {len(found)} 件")
            print("\n".join(found))
            print()
    if direction or labels:
        sys.exit(1)


if __name__ == "__main__":
    main()
