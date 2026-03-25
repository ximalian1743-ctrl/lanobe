from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import List, Tuple

BLOCK_SPLIT_RE = re.compile(r"\n\s*\n+")
VOCAB_WITH_READING_RE = re.compile(r"^(.*?)\s*[（(](.*?)[）)]\s*[:：]\s*(.*)$")
VOCAB_SIMPLE_RE = re.compile(r"^(.*?)\s*[:：]\s*(.*)$")
FURIGANA_RE = re.compile(r"\[[^\]]*\]")

KANA_ONLY_RE = re.compile(r"^[ぁ-ゖァ-ヺー・･]+$")
NAME_READING_MAP = {
    "温水和彦": "ぬくみず かずひこ",
    "八奈見杏菜": "やなみ あんな",
    "焼塩檸檬": "やきしお れもん",
    "小鞠知花": "こまり ちか",
    "温水佳樹": "ぬくみず かじゅ",
    "佳樹": "かじゅ",
    "月之木古都": "つきのき こと",
    "玉木慎太郎": "たまき しんたろう",
    "志喜屋夢子": "しきや ゆめこ",
    "放虎原ひばり": "ほうこばる ひばり",
    "綾野光希": "あやの みつき",
    "朝雲千早": "あさぐも ちはや",
    "袴田草介": "はかまだ そうすけ",
    "姫宮華恋": "ひめみや かれん",
    "甘夏古奈美": "あまなつ こなみ",
    "小抜小夜": "こぬき さよ",
}


def normalize_ja(text: str) -> str:
    text = text.strip()
    # Fix known name-reading inconsistency seen in volume 01.
    text = text.replace("佳[か]樹[じゆ]", "佳[か]樹[じゅ]")
    text = text.replace("佳樹[かじゆ]", "佳樹[かじゅ]")
    return text


def normalize_zh(text: str) -> str:
    return text.strip()


def normalize_word(surface: str, reading: str, gloss: str) -> Tuple[str, str, str]:
    surface = surface.strip()
    reading = reading.strip()
    gloss = gloss.strip()

    if surface in NAME_READING_MAP:
        reading = NAME_READING_MAP[surface]
    elif surface == "温水" and reading == "ぬくみず":
        reading = "ぬくみず"
    elif surface == "八奈見" and reading == "やなみ":
        reading = "やなみ"
    elif surface == "焼塩" and reading == "やきしお":
        reading = "やきしお"
    elif surface == "小鞠" and reading == "こまり":
        reading = "こまり"

    if not reading:
        reading = surface if KANA_ONLY_RE.fullmatch(surface) else surface

    return surface, reading, gloss


def split_csv_like(raw: str) -> List[str]:
    parts: List[str] = []
    buf: List[str] = []
    depth = 0
    for ch in raw:
        if ch in "(（":
            depth += 1
        elif ch in ")）" and depth > 0:
            depth -= 1

        if ch in ",，" and depth == 0:
            part = "".join(buf).strip()
            if part:
                parts.append(part)
            buf = []
            continue
        buf.append(ch)

    tail = "".join(buf).strip()
    if tail:
        parts.append(tail)
    return parts


def split_vocab_items(raw: str) -> List[Tuple[str, str, str]]:
    raw = raw.strip()
    if not raw:
        return []

    parts = split_csv_like(raw)

    items: List[Tuple[str, str, str]] = []
    for part in parts:
        part = part.strip()
        if not part:
            continue

        m = VOCAB_WITH_READING_RE.match(part)
        if m:
            surface, reading, gloss = m.groups()
            items.append(normalize_word(surface, reading, gloss))
            continue

        m = VOCAB_SIMPLE_RE.match(part)
        if m:
            surface, gloss = m.groups()
            reading = surface.strip() if KANA_ONLY_RE.fullmatch(surface.strip()) else ""
            items.append(normalize_word(surface, reading, gloss))
            continue

    # dedupe while preserving order
    deduped: List[Tuple[str, str, str]] = []
    seen = set()
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        deduped.append(item)
    return deduped


def is_vocab_line(text: str) -> bool:
    text = text.strip()
    if not text or not re.search(r"[:：]", text):
        return False
    if re.search(r"[（(].*?[）)]\s*[:：]", text):
        return True
    if re.search(r"[,，].+[:：]", text):
        return True
    # single gloss item without explicit reading, e.g. ラノベ: 轻小说
    if re.fullmatch(r"[^。！？!?“”「」『』]{1,120}[:：].+", text):
        return True
    return False


def looks_japanese(text: str) -> bool:
    text = text.strip()
    if not text:
        return False
    if is_vocab_line(text):
        return False
    return bool(re.search(r"[ぁ-ゖァ-ヺ\[\]「」『』々〆ヶ]", text))


def is_symbol_only_text(text: str) -> bool:
    t = FURIGANA_RE.sub("", text).strip()
    t = re.sub(r"[\s\"'“”‘’「」『』（）()\[\]【】〈〉<>《》]", "", t)
    if not t:
        return True
    return re.fullmatch(r"[\-—―ー〜～~·•…\.。!！?？＊*◇◆□■○●・:：;；/\\|_=+っッ]+", t) is not None


def format_entry(ja: str, zh: str, words: List[Tuple[str, str, str]]) -> str:
    ja = normalize_ja(ja)
    zh = normalize_zh(zh)
    if is_symbol_only_text(ja):
        return "pause: 500"

    lines = [f"ja: {ja}"]
    if zh:
        lines.append(f"zh: {zh}")
    for surface, reading, gloss in words:
        lines.append(f"word: {surface} | {reading} | {gloss}")
    return "\n".join(lines)


def convert_block(block: str) -> List[str]:
    raw_lines = [ln.strip() for ln in block.splitlines() if ln.strip()]
    if not raw_lines:
        return []

    if raw_lines[0].startswith("jp:"):
        lines = [raw_lines[0][3:].strip()] + raw_lines[1:]
    else:
        lines = raw_lines

    out: List[str] = []
    i = 0
    while i < len(lines):
        current = lines[i].strip()
        if not current:
            i += 1
            continue

        if is_vocab_line(current):
            i += 1
            continue

        ja = current
        i += 1

        zh = ""
        if i < len(lines) and not is_vocab_line(lines[i]):
            zh = lines[i].strip()
            i += 1

        words: List[Tuple[str, str, str]] = []
        if i < len(lines) and is_vocab_line(lines[i]):
            words = split_vocab_items(lines[i])
            i += 1

        out.append(format_entry(ja, zh, words))

    return out


def convert_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    blocks = BLOCK_SPLIT_RE.split(text.strip())
    converted_blocks: List[str] = []
    for block in blocks:
        converted_blocks.extend(convert_block(block))
    return "\n\n".join(block for block in converted_blocks if block.strip()) + "\n"


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python migrate_makeine_volume.py <file> [<file> ...]", file=sys.stderr)
        return 1

    for arg in sys.argv[1:]:
        path = Path(arg)
        original = path.read_text(encoding="utf-8")
        converted = convert_text(original)
        path.write_text(converted, encoding="utf-8", newline="\n")
        print(f"OK: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
