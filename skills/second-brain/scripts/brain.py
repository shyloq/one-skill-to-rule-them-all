#!/usr/bin/env python3
"""Second-brain store: save, search and list captured items. Stdlib only.

Storage root: $SECOND_BRAIN_DIR, default ~/second-brain
  items/<id>.md        one markdown file per item (frontmatter + body)
  attachments/<id>.*   copied screenshots, audio, documents
  index.jsonl          one JSON line per item, rebuilt by `reindex`
"""
import argparse, datetime as dt, html, json, os, re, shutil, sys, urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(os.environ.get("SECOND_BRAIN_DIR", Path.home() / "second-brain")).expanduser()
ITEMS, ATT, INDEX = ROOT / "items", ROOT / "attachments", ROOT / "index.jsonl"
KINDS = ("link", "note", "idea", "image", "audio", "file")
STOP = set("a an the of to in on for and or is are was were be it this that with at by from as about what which i my me".split())


def slug(s, n=40):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:n] or "item"


def words(s):
    return [w for w in re.findall(r"[a-z0-9]+", s.lower()) if w not in STOP and len(w) > 1]


class _Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title, self.parts, self._skip, self._in_title = "", [], 0, False

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript"):
            self._skip += 1
        elif tag == "title":
            self._in_title = True

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript"):
            self._skip = max(0, self._skip - 1)
        elif tag == "title":
            self._in_title = False

    def handle_data(self, d):
        if self._in_title:
            self.title += d
        elif not self._skip and d.strip():
            self.parts.append(d.strip())


def fetch(url):
    """Best-effort page title and text. Returns ("", "") on any failure."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "second-brain/1.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            raw = r.read(2_000_000).decode(r.headers.get_content_charset() or "utf-8", "replace")
        p = _Text()
        p.feed(raw)
        return html.unescape(p.title).strip(), " ".join(p.parts)[:20000]
    except Exception as e:
        print(f"fetch failed ({e}); saving the link without page text", file=sys.stderr)
        return "", ""


def parse(path):
    txt = path.read_text(encoding="utf-8")
    m = re.match(r"---\n(.*?)\n---\n?(.*)", txt, re.S)
    meta = {}
    for line in (m.group(1) if m else "").splitlines():
        k, _, v = line.partition(": ")
        meta[k] = json.loads(v) if v[:1] in '["' else v
    meta["body"] = m.group(2) if m else txt
    meta["path"] = str(path)
    return meta


def load():
    return [parse(p) for p in sorted(ITEMS.glob("*.md"))] if ITEMS.exists() else []


def cmd_add(a):
    ITEMS.mkdir(parents=True, exist_ok=True)
    body = sys.stdin.read() if a.text == "-" else (a.text or "")
    title, source = a.title or "", a.source or ""
    if a.url:
        source = a.url
        if a.fetch:
            t, page = fetch(a.url)
            title, body = title or t, (body + "\n\n" + page).strip()
    now = dt.datetime.now().astimezone()
    iid = now.strftime("%Y%m%d-%H%M%S-") + slug(title or body[:40] or a.kind)
    att = ""
    if a.file:
        src = Path(a.file).expanduser()
        if not src.is_file():
            sys.exit(f"no such file: {src}")
        ATT.mkdir(parents=True, exist_ok=True)
        dest = ATT / (iid + src.suffix.lower())
        shutil.copy2(src, dest)
        att = str(dest.relative_to(ROOT))
    if not (title or body or att or source):
        sys.exit("nothing to save: give --text (or --text - for stdin), --url or --file")
    title = title or (body.strip().splitlines() or [source or "untitled"])[0][:80]
    tags = sorted({slug(t, 30) for t in a.tags.split(",") if t.strip()}) if a.tags else []
    meta = {"id": iid, "kind": a.kind, "title": title, "created": now.isoformat(timespec="seconds"),
            "tags": tags, "source": source, "attachment": att, "summary": a.summary or ""}
    front = "\n".join(f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in meta.items())
    (ITEMS / f"{iid}.md").write_text(f"---\n{front}\n---\n{body.strip()}\n", encoding="utf-8")
    cmd_reindex(None)
    print(f"saved {iid}  tags={','.join(tags) or '-'}")


def cmd_reindex(_):
    ROOT.mkdir(parents=True, exist_ok=True)
    with INDEX.open("w", encoding="utf-8") as f:
        for m in load():
            f.write(json.dumps({k: v for k, v in m.items() if k != "body"}, ensure_ascii=False) + "\n")


def score(m, terms):
    fields = ((m.get("title", ""), 5), (" ".join(m.get("tags", [])), 4), (m.get("summary", ""), 3),
              (m.get("source", ""), 1), (m.get("body", ""), 1))
    s = 0
    for t in terms:
        for text, w in fields:
            hay = set(words(text))
            if t in hay:
                s += w
            elif len(t) > 3 and any(len(h) > 3 and h[:4] == t[:4] for h in hay):
                s += w * 0.5
    return s


def show(m, snippet=""):
    print(f"- {m['created'][:10]}  [{m['kind']}] {m['title']}\n  id: {m['id']}  tags: {', '.join(m.get('tags', [])) or '-'}")
    if m.get("source"):
        print(f"  source: {m['source']}")
    if m.get("attachment"):
        print(f"  file: {ROOT / m['attachment']}")
    if m.get("summary"):
        print(f"  summary: {m['summary']}")
    if snippet:
        print(f"  > {snippet}")


def in_range(m, a):
    d = m["created"][:10]
    return (not a.since or d >= a.since) and (not a.until or d <= a.until)


def cmd_search(a):
    terms = words(" ".join(a.query))
    hits = []
    for m in load():
        if a.tag and slug(a.tag, 30) not in m.get("tags", []) or a.kind and m["kind"] != a.kind or not in_range(m, a):
            continue
        s = score(m, terms) if terms else 1
        if s > 0:
            hits.append((s, m))
    hits.sort(key=lambda x: (-x[0], x[1]["created"]), reverse=False)
    if not hits:
        print("no matches; try fewer or broader words, or `brain.py tags` to see what exists")
    for _, m in hits[: a.limit]:
        snip = ""
        for line in m["body"].splitlines():
            if any(t in line.lower() for t in terms):
                snip = line.strip()[:200]
                break
        show(m, snip)


def cmd_list(a):
    ms = [m for m in load() if in_range(m, a) and (not a.kind or m["kind"] == a.kind)
          and (not a.tag or slug(a.tag, 30) in m.get("tags", []))]
    for m in sorted(ms, key=lambda m: m["created"], reverse=True)[: a.limit]:
        show(m)


def cmd_tags(_):
    c = {}
    for m in load():
        for t in m.get("tags", []):
            c[t] = c.get(t, 0) + 1
    for t, n in sorted(c.items(), key=lambda x: (-x[1], x[0])):
        print(f"{n:4d}  {t}")


def cmd_get(a):
    p = ITEMS / f"{a.id}.md"
    print(p.read_text(encoding="utf-8") if p.exists() else sys.exit(f"no item {a.id}"))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    p = sp.add_parser("add", help="save an item")
    p.add_argument("--kind", choices=KINDS, default="note")
    p.add_argument("--title"); p.add_argument("--text"); p.add_argument("--url"); p.add_argument("--file")
    p.add_argument("--source"); p.add_argument("--summary"); p.add_argument("--tags", help="comma-separated")
    p.add_argument("--fetch", action="store_true", help="with --url: download title and page text")
    p.set_defaults(f=cmd_add)
    for name, f in (("search", cmd_search), ("list", cmd_list)):
        p = sp.add_parser(name)
        if name == "search":
            p.add_argument("query", nargs="+")
        p.add_argument("--tag"); p.add_argument("--kind", choices=KINDS)
        p.add_argument("--since", help="YYYY-MM-DD"); p.add_argument("--until", help="YYYY-MM-DD")
        p.add_argument("--limit", type=int, default=10)
        p.set_defaults(f=f)
    sp.add_parser("tags").set_defaults(f=cmd_tags)
    sp.add_parser("reindex").set_defaults(f=cmd_reindex)
    p = sp.add_parser("get"); p.add_argument("id"); p.set_defaults(f=cmd_get)
    a = ap.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
