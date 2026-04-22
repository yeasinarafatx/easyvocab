from __future__ import annotations

import json
import sys
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

import eng_to_ipa as ipa
from deep_translator import GoogleTranslator

ROOT = Path(__file__).resolve().parents[1]
EXAM_DIR = ROOT / "src" / "data" / "exam"

HEADERS = {"User-Agent": "Mozilla/5.0"}


def http_get_json(url: str, timeout: int = 20) -> Any:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return json.loads(res.read().decode("utf-8"))


def clean_text(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    return value


def normalize_token(token: str) -> str:
    return token.replace("_", " ").strip().lower()


def unique_words(values: list[str], limit: int = 4, exclude: str = "") -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    ex = normalize_token(exclude)
    for raw in values:
        token = normalize_token(raw)
        if not token or token == ex:
            continue
        if token in seen:
            continue
        if not re.fullmatch(r"[a-z][a-z\- ]*[a-z]", token):
            continue
        seen.add(token)
        out.append(token)
        if len(out) >= limit:
            break
    return out


def parse_dictionaryapi(word: str) -> dict[str, Any]:
    out: dict[str, Any] = {
        "pos": "noun",
        "phonetic": "",
        "definition": "",
        "synonyms": [],
        "antonyms": [],
    }

    url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{urllib.parse.quote(word)}"
    try:
        data = http_get_json(url)
    except Exception:
        return out

    if not isinstance(data, list) or not data:
        return out

    entry = data[0]

    phonetics = entry.get("phonetics") or []
    for p in phonetics:
        text = clean_text(p.get("text") or "")
        if text and any(ch in text for ch in "/ˈˌəɪʊɔæθðŋɑɒɛɜʃʒ"):
            out["phonetic"] = text if text.startswith("/") else f"/{text.strip('/')}/"
            break

    meanings = entry.get("meanings") or []
    syns: list[str] = []
    ants: list[str] = []

    for m in meanings:
        if out["pos"] == "noun":
            pos = clean_text(m.get("partOfSpeech") or "")
            if pos:
                out["pos"] = pos

        syns.extend(m.get("synonyms") or [])
        ants.extend(m.get("antonyms") or [])

        defs = m.get("definitions") or []
        for d in defs:
            if not out["definition"]:
                definition = clean_text(d.get("definition") or "")
                if definition:
                    out["definition"] = definition
            syns.extend(d.get("synonyms") or [])
            ants.extend(d.get("antonyms") or [])

    out["synonyms"] = unique_words(syns, limit=4, exclude=word)
    out["antonyms"] = unique_words(ants, limit=4, exclude=word)
    return out


def parse_datamuse(word: str) -> dict[str, Any]:
    out: dict[str, Any] = {
        "definition": "",
        "synonyms": [],
        "antonyms": [],
    }

    try:
        defs_url = f"https://api.datamuse.com/words?sp={urllib.parse.quote(word)}&md=d&max=1"
        defs_data = http_get_json(defs_url)
        if isinstance(defs_data, list) and defs_data:
            defs = defs_data[0].get("defs") or []
            if defs:
                raw = clean_text(defs[0])
                raw = re.sub(r"^[a-z]\t", "", raw)
                out["definition"] = raw
    except Exception:
        pass

    try:
        syn_url = f"https://api.datamuse.com/words?rel_syn={urllib.parse.quote(word)}&max=8"
        syn_data = http_get_json(syn_url)
        if isinstance(syn_data, list):
            out["synonyms"] = unique_words([x.get("word", "") for x in syn_data], limit=4, exclude=word)
    except Exception:
        pass

    try:
        ant_url = f"https://api.datamuse.com/words?rel_ant={urllib.parse.quote(word)}&max=8"
        ant_data = http_get_json(ant_url)
        if isinstance(ant_data, list):
            out["antonyms"] = unique_words([x.get("word", "") for x in ant_data], limit=4, exclude=word)
    except Exception:
        pass

    return out


def parse_wiktionary(word: str) -> dict[str, Any]:
    out: dict[str, Any] = {
        "definition": "",
    }

    url = f"https://en.wiktionary.org/api/rest_v1/page/definition/{urllib.parse.quote(word)}"
    try:
        data = http_get_json(url)
    except Exception:
        return out

    entries = data.get("en") or []
    for entry in entries:
        definitions = entry.get("definitions") or []
        for d in definitions:
            definition = clean_text(d.get("definition") or "")
            if definition:
                out["definition"] = re.sub(r"\[[^\]]+\]", "", definition).strip()
                return out

    return out


def parse_conceptnet(word: str) -> dict[str, Any]:
    out: dict[str, Any] = {
        "synonyms": [],
        "antonyms": [],
    }

    encoded = urllib.parse.quote(word.replace(" ", "_"))

    try:
        syn_url = (
            "https://api.conceptnet.io/query?start=/c/en/"
            f"{encoded}&rel=/r/Synonym&limit=20"
        )
        syn_data = http_get_json(syn_url)
        edges = syn_data.get("edges") or []
        values: list[str] = []
        for edge in edges:
            end_label = clean_text((edge.get("end") or {}).get("label") or "")
            if end_label:
                values.append(end_label)
        out["synonyms"] = unique_words(values, limit=4, exclude=word)
    except Exception:
        pass

    try:
        ant_url = (
            "https://api.conceptnet.io/query?start=/c/en/"
            f"{encoded}&rel=/r/Antonym&limit=20"
        )
        ant_data = http_get_json(ant_url)
        edges = ant_data.get("edges") or []
        values = []
        for edge in edges:
            end_label = clean_text((edge.get("end") or {}).get("label") or "")
            if end_label:
                values.append(end_label)
        out["antonyms"] = unique_words(values, limit=4, exclude=word)
    except Exception:
        pass

    return out


def synthesize_antonym(word: str, pos: str) -> str:
    w = word.lower().strip()
    if pos == "adjective":
        if w.startswith("un") and len(w) > 4:
            return w[2:]
        if w.startswith("in") and len(w) > 4:
            return w[2:]
        if w.startswith("im") and len(w) > 4:
            return w[2:]
        if w.startswith("ir") and len(w) > 4:
            return w[2:]
        if w.startswith("non") and len(w) > 5:
            return w[3:]
        return f"non {w}"
    if pos == "verb":
        return f"not {w}"
    return f"non {w}"


def pick_pos(pos: str) -> str:
    pos = pos.lower().strip()
    if pos in {"noun", "verb", "adjective", "adverb"}:
        return pos
    return "noun"


def build_phonetic(word: str, dapi_phonetic: str) -> str:
    ph = clean_text(dapi_phonetic)
    if ph:
        if not ph.startswith("/"):
            ph = f"/{ph.strip('/')}/"
        return ph

    generated = clean_text(ipa.convert(word))
    generated = generated.replace("*", "")
    if generated and generated != word.lower():
        return f"/{generated}/"

    return f"/{word.lower()}/"


def build_bangla(word: str, definition: str, translator: GoogleTranslator) -> str:
    try:
        translated_word = clean_text(translator.translate(word))
        if translated_word and not re.search(r"[A-Za-z]{3,}", translated_word):
            return translated_word
    except Exception:
        pass

    short_def = definition.split(";")[0].split(".")[0]
    short_def = clean_text(short_def)
    if len(short_def) > 90:
        short_def = short_def[:90].rsplit(" ", 1)[0]

    try:
        translated_def = clean_text(translator.translate(short_def or definition))
        if translated_def:
            return translated_def
    except Exception:
        pass

    return "প্রাসঙ্গিক অর্থ"


def hash_pick(word: str, size: int, salt: int) -> int:
    total = sum((i + 1 + salt) * ord(ch) for i, ch in enumerate(word.lower()))
    return total % size


def short_definition(definition: str) -> str:
    raw = (definition or "").strip().rstrip(".")
    if not raw:
        return "important in this context"
    bits = raw.split()
    if len(bits) > 8:
        raw = " ".join(bits[:8])
    return raw.lower()


def synonym_hint(synonyms: list[str]) -> str:
    for item in synonyms or []:
        token = str(item).strip()
        if token:
            return token
    return "key term"


def compose(word: str, starts: list[str], middles: list[str], ends: list[str], detail: str, hint: str) -> str:
    s = starts[hash_pick(word, len(starts), 1)]
    m = middles[hash_pick(word, len(middles), 3)]
    e = ends[hash_pick(word, len(ends), 7)]
    tail = [
        f"with focus on {detail}",
        f"as it is close to {hint}",
        f"to explain the idea of {detail}",
        f"where a similar notion is {hint}",
    ][hash_pick(word, 4, 11)]
    return f"{s} _______ {m} {e} {tail}."


def build_example(word: str, pos: str, tag: str, definition: str, synonyms: list[str]) -> str:
    p = (pos or "noun").strip().lower()
    detail = short_definition(definition)
    hint = synonym_hint(synonyms)

    if tag == "GRE":
        if p == "verb":
            return compose(
                word,
                [
                    "To support the argument, the author had to",
                    "In the final paragraph, the reviewer decided to",
                    "While analyzing the claim, students needed to",
                    "Before choosing an option, candidates tried to",
                ],
                [
                    "so that the logic stayed consistent",
                    "without weakening the central thesis",
                    "before evaluating the counterpoint",
                    "to make the conclusion more convincing",
                ],
                [
                    "in the GRE passage.",
                    "during the reasoning task.",
                    "for a stronger interpretation.",
                    "in the critical reading set.",
                ],
                detail,
                hint,
            )
        if p == "adjective":
            return compose(
                word,
                [
                    "The critic described the perspective as",
                    "The GRE passage introduced a",
                    "In the model answer, the tone felt",
                    "The writer's position seemed",
                ],
                [
                    "when compared with standard theories",
                    "to explain the shift in viewpoint",
                    "throughout the argument analysis",
                    "according to the evidence provided",
                ],
                [
                    "in the text.",
                    "for that question.",
                    "in the reading section.",
                    "within the discussion.",
                ],
                detail,
                hint,
            )
        if p == "adverb":
            return compose(
                word,
                [
                    "The conclusion was presented",
                    "The response was written",
                    "The evidence was interpreted",
                    "The final claim was explained",
                ],
                [
                    "to avoid logical gaps",
                    "for greater analytical clarity",
                    "while preserving coherence",
                    "to strengthen the overall inference",
                ],
                [
                    "in the GRE answer.",
                    "during the reading task.",
                    "for that argument.",
                    "in the solution note.",
                ],
                detail,
                hint,
            )
        return compose(
            word,
            [
                "In the GRE reading set, the term",
                "For the comprehension question,",
                "The central idea was clarified by",
                "In the paragraph analysis,",
            ],
            [
                "which highlighted the author's intent",
                "to frame the main argument clearly",
                "and guided the final inference",
                "while connecting key evidence",
            ],
            [
                "for the passage.",
                "in that section.",
                "for test-takers.",
                "in the explanation.",
            ],
            detail,
            hint,
        )

    if tag == "BCS":
        if p == "verb":
            return compose(
                word,
                [
                    "The ministry planned to",
                    "The committee decided to",
                    "In the policy memo, officers agreed to",
                    "For better administration, the department would",
                ],
                [
                    "to improve service delivery",
                    "while maintaining accountability",
                    "before implementing the reform",
                    "to address field-level challenges",
                ],
                [
                    "in public offices.",
                    "across districts.",
                    "under the new policy.",
                    "for effective governance.",
                ],
                detail,
                hint,
            )
        if p == "adjective":
            return compose(
                word,
                [
                    "The report recommended a",
                    "The board approved a",
                    "The district plan required a",
                    "The guideline followed a",
                ],
                [
                    "to ensure transparent implementation",
                    "for stronger institutional control",
                    "to improve administrative outcomes",
                    "for better policy execution",
                ],
                [
                    "across agencies.",
                    "in the public sector.",
                    "during reform efforts.",
                    "within government departments.",
                ],
                detail,
                hint,
            )
        if p == "adverb":
            return compose(
                word,
                [
                    "The proposal was reviewed",
                    "The action plan was presented",
                    "The implementation note was drafted",
                    "The final recommendation was submitted",
                ],
                [
                    "to avoid policy confusion",
                    "before cabinet discussion",
                    "for clearer administrative response",
                    "to justify the reform pathway",
                ],
                [
                    "in the BCS case study.",
                    "for the written answer.",
                    "during governance planning.",
                    "in the official brief.",
                ],
                detail,
                hint,
            )
        return compose(
            word,
            [
                "In BCS preparation,",
                "For administrative analysis,",
                "In governance-focused writing,",
                "During the viva discussion,",
            ],
            [
                "is used to explain policy decisions",
                "helps connect reform with practice",
                "supports arguments about public administration",
                "clarifies institutional responsibilities",
            ],
            [
                "in exam answers.",
                "for policy evaluation.",
                "in public sector contexts.",
                "for conceptual clarity.",
            ],
            detail,
            hint,
        )

    if p == "verb":
        return compose(
            word,
            [
                "Before final approval, the audit team had to",
                "The branch manager instructed staff to",
                "To reduce risk, officers must",
                "During reconciliation, analysts were asked to",
            ],
            [
                "before posting the final report",
                "while checking transaction history",
                "to maintain financial accuracy",
                "for stronger compliance control",
            ],
            [
                "in the branch office.",
                "for the bank statement.",
                "during routine operations.",
                "in daily banking practice.",
            ],
            detail,
            hint,
        )
    if p == "adjective":
        return compose(
            word,
            [
                "The bank adopted a",
                "The compliance unit required a",
                "The lending desk followed a",
                "The board approved a",
            ],
            [
                "to keep credit risk under control",
                "for stable financial operations",
                "to strengthen internal monitoring",
                "for better regulatory alignment",
            ],
            [
                "across all branches.",
                "during loan evaluation.",
                "in the risk framework.",
                "for portfolio management.",
            ],
            detail,
            hint,
        )
    if p == "adverb":
        return compose(
            word,
            [
                "The statement was checked",
                "Loan applications were processed",
                "The ledger was reviewed",
                "The final report was prepared",
            ],
            [
                "before submission to head office",
                "to avoid accounting errors",
                "while maintaining service quality",
                "for accurate reconciliation",
            ],
            [
                "in the bank workflow.",
                "during daily closing.",
                "for compliance review.",
                "in branch operations.",
            ],
            detail,
            hint,
        )

    return compose(
        word,
        [
            "In bank exam practice,",
            "In financial operations,",
            "For professional banking knowledge,",
            "In branch-level training,",
        ],
        [
            "is treated as a core concept",
            "plays an important role in decision-making",
            "is frequently tested in objective questions",
            "helps explain operational procedures",
        ],
        [
            "for candidates.",
            "in real scenarios.",
            "during assessments.",
            "for practical understanding.",
        ],
        detail,
        hint,
    )


def tag_for_level(level_number: int) -> str:
    if level_number <= 10:
        return "GRE"
    if level_number <= 20:
        return "BCS"
    return "Bank"


def hydrate_word(word: str, translator: GoogleTranslator, cache: dict[str, dict[str, Any]]) -> dict[str, Any]:
    key = word.lower()
    if key in cache:
        return cache[key]

    dapi = parse_dictionaryapi(word)

    dms: dict[str, Any] = {"definition": "", "synonyms": [], "antonyms": []}
    wiki: dict[str, Any] = {"definition": ""}
    cnet: dict[str, Any] = {"synonyms": [], "antonyms": []}

    if not dapi["definition"] or not dapi["synonyms"] or not dapi["antonyms"]:
        dms = parse_datamuse(word)

    if not dapi["definition"] and not dms["definition"]:
        wiki = parse_wiktionary(word)

    definition = dapi["definition"] or dms["definition"] or wiki["definition"]
    if not definition:
        definition = f"A lexical term used in academic and examination contexts as '{word}'."
    pos = pick_pos(dapi["pos"])

    synonyms = dapi["synonyms"] or dms["synonyms"]
    antonyms = dapi["antonyms"] or dms["antonyms"]

    if not synonyms or not antonyms:
        cnet = parse_conceptnet(word)

    synonyms = synonyms or cnet["synonyms"]
    antonyms = antonyms or cnet["antonyms"]

    synonyms_clean = unique_words(synonyms, limit=4, exclude=word)
    antonyms_clean = unique_words(antonyms, limit=4, exclude=word)

    if not synonyms_clean:
        synonyms_clean = [f"related to {word.lower()}"]

    if not antonyms_clean:
        antonyms_clean = [synthesize_antonym(word, pos)]

    item = {
        "pos": pos,
        "phonetic": build_phonetic(word, dapi["phonetic"]),
        "definition": definition,
        "synonyms": synonyms_clean,
        "antonyms": antonyms_clean,
        "bangla": build_bangla(word, definition, translator),
    }

    cache[key] = item
    time.sleep(0.05)
    return item


def fix_file(file_path: Path, level_number: int, translator: GoogleTranslator, cache: dict[str, dict[str, Any]]) -> None:
    data = json.loads(file_path.read_text(encoding="utf-8"))
    tag = tag_for_level(level_number)

    fixed: list[dict[str, Any]] = []
    for item in data:
        word = item["word"]
        details = hydrate_word(word, translator, cache)
        fixed.append(
            {
                "id": item["id"],
                "word": word,
                "pos": details["pos"],
                "phonetic": details["phonetic"],
                "bangla": details["bangla"],
                "definition": details["definition"],
                "example": build_example(word, details["pos"], tag, details["definition"], details["synonyms"]),
                "synonyms": details["synonyms"],
                "antonyms": details["antonyms"],
                "examTags": [tag],
                "difficulty": item.get("difficulty", "advanced"),
            }
        )

    file_path.write_text(json.dumps(fixed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    files = sorted(EXAM_DIR.glob("level_*.json"))
    if len(files) != 30:
        raise RuntimeError(f"Expected 30 exam files, found {len(files)}")

    start_level = 1
    end_level = 30
    if len(sys.argv) >= 2:
        start_level = max(1, min(30, int(sys.argv[1])))
    if len(sys.argv) >= 3:
        end_level = max(start_level, min(30, int(sys.argv[2])))

    translator = GoogleTranslator(source="en", target="bn")
    cache: dict[str, dict[str, Any]] = {}

    for idx, file_path in enumerate(files, start=1):
        if idx < start_level or idx > end_level:
            continue
        fix_file(file_path, idx, translator, cache)
        print(f"fixed {file_path.name}")

    print(f"exam data normalization complete: levels {start_level}-{end_level}")


if __name__ == "__main__":
    main()
