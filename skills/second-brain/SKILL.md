---
name: "second-brain"
version: "1.0.0"
description: "Personal second brain: saves links, screenshots, voice notes, files and random ideas the user sends, auto-tags and summarises them, and answers later recall questions like \"what was that article about Airbnb pricing I saved?\". Use when the user shares something to remember (\"save this\", \"remember\", \"note to self\", a bare URL, an image or audio with no instruction), or asks to find, recall, list or review something they saved earlier."
license: CC-BY-4.0
metadata:
  author: Eoghan Henn and contributors
  source: github.com/rebelytics/one-skill-to-rule-them-all
---

# Second Brain

Capture first, organise automatically, retrieve by meaning. The user should
never have to pick a folder or a tag. Everything is stored as plain markdown
on disk, so it outlives this skill and any one agent.

Storage root: `$SECOND_BRAIN_DIR`, default `~/second-brain`. All commands use
`scripts/brain.py` (Python 3, stdlib only), run from this skill's folder.

## Capture

Triggers: a bare link, image or audio with no instruction, "save/remember/
note this", or an idea stated in passing. Save it without asking questions,
then confirm in one line (title, tags).

1. **Understand the item first**, because the script stores what you give it
   and does no AI itself:
   - **Link**: use `--fetch` to pull the title and page text. If the fetch
     fails (paywall, login, JS-only page), use your own web access; if that
     fails too, save the link with what the user said about it.
   - **Screenshot or image**: look at it, transcribe visible text, describe
     it in the body. Pass the file with `--file --kind image`.
   - **Voice note or audio**: transcribe it with whatever transcription
     capability you have and put the transcript in the body. If you have
     none, save the file and say the transcript is missing; never invent one.
   - **Idea or note**: store the user's words verbatim in `--text`.
2. **Write a title** (specific, searchable), a **1 to 2 sentence summary**
   (include the *why it matters*, if the user said), and **3 to 6 tags**.
3. **Reuse existing tags.** Run `python3 scripts/brain.py tags` first and
   prefer a tag that already exists over a near-duplicate (`pricing`, not
   `prices`). Add specific tags (company, topic, person, project) plus one
   broad one.
4. Save:

```
python3 scripts/brain.py add --kind link --url "https://..." --fetch \
  --title "..." --summary "..." --tags "airbnb,pricing,short-term-rentals"
python3 scripts/brain.py add --kind image --file ~/Downloads/shot.png \
  --text "<transcribed text and description>" --title "..." --tags "..."
python3 scripts/brain.py add --kind idea --text "<verbatim idea>" --tags "..."
```

Several items in one message: one `add` per item. Never drop an item because
it looks unimportant; the user decides what matters when they search.

## Recall

Triggers: "what was that...", "find the thing about...", "what did I save on...",
"show me my notes on...", "what ideas did I have this week".

1. Turn the question into 2 to 5 keywords. **Expand with synonyms and likely
   tags** (Airbnb pricing: `airbnb`, `pricing`, `rates`, `short-term`),
   because search is keyword-based, not semantic.
2. `python3 scripts/brain.py search airbnb pricing` with `--since`/`--until`
   for "last week", `--tag`, or `--kind` when the question implies them.
3. No hits: retry with fewer or broader words, then check
   `brain.py tags` for the vocabulary actually in use. Only after that say
   nothing matched.
4. Read a promising item in full with `brain.py get <id>` before answering
   questions about its content.
5. Answer with the best match first: title, date, source link, and why it
   fits. If several plausibly match, list them briefly and let the user pick.
   Do not claim a match you did not see in the results.

`brain.py list --since 2026-01-01` gives a browse view for reviews like "what
did I capture this month?". Group by tag when summarising.

## Rules

- **Privacy**: the store is the user's local data. Never upload, publish or
  paste its contents anywhere the user did not ask for. Do not fetch links
  that look like private or signed URLs (password reset, magic login,
  pre-signed storage) unless asked; save them as a note instead.
- **Fidelity**: ideas and quotes are stored verbatim. Summaries are marked as
  summaries. Unknown fields stay empty rather than guessed.
- **No silent deletion or rewriting**: items are only changed or removed on
  the user's explicit request, by editing the file in `items/` and running
  `brain.py reindex`.
- **Pre-flight before replying to a capture**: the command printed `saved`,
  the tags were checked against `brain.py tags`, and the confirmation names
  the title and tags so the user can correct them.

## Making it effortless

The skill only works if the user can throw things at it from anywhere. Tell
them once, when first set up: a dedicated chat, project or messaging channel
wired to this skill gives the "send it throughout the day" experience; any
message there is a capture unless it is clearly a question.
