import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "src/data"
EXAM_ROOT = DATA_ROOT / "exam"
EXAM_ROOT.mkdir(parents=True, exist_ok=True)

NOUN_SUFFIXES = (
    "tion", "sion", "ment", "ness", "ity", "ance", "ence", "ship", "ism", "age", "ure",
    "cy", "ogy", "ics", "hood", "dom", "ality", "ness", "tude", "al",
)
VERB_SUFFIXES = ("ate", "ify", "ise", "ize", "en", "ify")
ADJ_SUFFIXES = ("ous", "ive", "al", "able", "ible", "ary", "ory", "ant", "ent", "ic", "ical", "less", "ful", "ed")

MANUAL_GRE = [
    "abate", "aberrant", "abhor", "abjure", "abridge", "abstain", "abstruse", "acerbic", "acquiesce",
    "acrimony", "acuity", "adamant", "adept", "aesthetic", "affable", "affinity", "affirm", "aggrandize",
    "agile", "agnostic", "alacrity", "alleviate", "aloof", "altruism", "ambivalent", "ameliorate", "anachronism",
    "anodyne", "apathy", "appease", "arcane", "ardent", "assiduous", "austere", "banal", "benevolent",
    "brusque", "candor", "capricious", "cerebral", "chicanery", "cogent", "collude", "complacent", "conundrum",
    "corroborate", "credulous", "deleterious", "demur", "deride", "diatribe", "didactic", "disparate",
    "disparage", "duplicitous", "eclectic", "efface", "effervescent", "egregious", "elucidate", "emulate",
    "enervate", "ephemeral", "equivocal", "esoteric", "exacerbate", "exculpate", "exonerate", "expedient",
    "fatuous", "feckless", "fervent", "fortuitous", "fractious", "garrulous", "grandiose", "harangue",
    "heterodox", "implacable", "impugn", "inchoate", "incipient", "intransigent", "intrepid", "laconic",
    "laudable", "loquacious", "magnanimous", "malaise", "mendacious", "mercurial", "mitigate", "morose",
    "nebulous", "nefarious", "nonchalant", "obdurate", "obfuscate", "obsequious", "onerous", "opaque",
    "ostentatious", "parsimonious", "paucity", "pejorative", "perfidious", "pernicious", "perspicacious",
    "phlegmatic", "pithy", "platitude", "pragmatic", "precocious", "precipitate", "prescient", "presumptuous",
    "probity", "proclivity", "prodigal", "propitious", "punctilious", "quandary", "quiescent", "recondite",
    "redolent", "relegate", "remonstrate", "repudiate", "salient", "sardonic", "scurrilous", "sequester",
    "solicitous", "sophistry", "spurious", "taciturn", "tenacious", "tirade", "toady", "travesty",
    "trenchant", "ubiquitous", "untenable", "vacillate", "verbose", "virulent", "vitriol", "warrant", "zealous",
]

MANUAL_BCS = [
    "accountability", "accreditation", "administration", "administrative", "agriculture", "amendment",
    "annexation", "arbitration", "authority", "bureaucracy", "cabinet", "candidature", "centralization",
    "citizenship", "civil", "coalition", "commission", "committee", "communication", "consultation",
    "constitution", "coordination", "corruption", "decentralization", "delegation", "democracy",
    "development", "election", "eligibility", "empowerment", "enforcement", "entitlement", "federation",
    "governance", "inspection", "institution", "legislation", "local", "ministry", "municipality",
    "ordinance", "parliament", "policy", "population", "procurement", "project", "public", "reform",
    "regulation", "rehabilitation", "revenue", "service", "sovereignty", "statute", "subsidy",
    "supervision", "transparency", "union", "welfare", "district", "regional", "planning", "budget",
    "directorate", "discretion", "empirical", "evaluation", "execution", "fiscal", "implementation",
    "initiative", "jurisdiction", "leadership", "oversight", "participation", "personnel", "procedural",
    "resolution", "responsibility", "secretariat", "streamlining", "tender", "transfer", "treasury",
    "uniform", "urbanization", "vigilance", "voluntary", "workflow", "workforce", "accountable", "advisory",
    "admission", "allocation", "amnesty", "assessment", "authorization", "beneficiary", "capacity",
    "compliance", "confidentiality", "cooperation", "credibility", "deputation", "deregulation",
    "disbursement", "discretionary", "electoral", "enquiry", "ethics", "federal", "governing", "grant",
    "grievance", "implementation", "integrity", "licence", "mandate", "monitoring", "oversight", "quota",
    "ratification", "scrutiny", "sensitivity", "sovereign", "standardization", "statutory", "subcommittee",
    "subsidiary", "taxation", "territorial", "threshold", "transit", "tribunal", "verification",
]

MANUAL_BANK = [
    "account", "accountant", "accounting", "accrue", "asset", "audit", "bank", "banknote", "balance",
    "bond", "brokerage", "capital", "cash", "cheque", "clearance", "collateral", "commission", "commodity",
    "credit", "currency", "debit", "deposit", "dividend", "drawer", "equity", "escrow", "exchange",
    "expense", "finance", "fiscal", "fund", "hedge", "interest", "inventory", "investment", "invoice",
    "ledger", "liability", "liquidity", "loan", "margin", "mortgage", "overdraft", "payment", "portfolio",
    "principal", "profit", "rate", "receipt", "remittance", "reserve", "revenue", "risk", "savings",
    "settlement", "share", "solvency", "stock", "treasury", "turnover", "underwriting", "valuation",
    "voucher", "withdrawal", "yield", "amortization", "annuity", "arbitrage", "bearish", "bullish",
    "capitalization", "clearinghouse", "collection", "compound", "consumer", "counterparty", "creditor",
    "debenture", "debtor", "default", "discount", "exchangeable", "forex", "guarantee", "income",
    "indebted", "insolvency", "insurance", "issuer", "kiting", "leverage", "markup", "monetary",
    "nonperforming", "payment", "premium", "quotation", "refinance", "refund", "reconciliation",
    "repo", "security", "speculation", "spread", "subscription", "transaction", "treasurer", "underwrite",
    "valuation", "wire", "withdraw", "writeoff", "yielding", "assetbase", "bookkeeping", "budgeting",
    "capitalgain", "cashflow", "chargeback", "creditline", "debt", "depositary", "draft", "e-commerce",
]

CATEGORY_CONFIG = [
    {
        "tag": "GRE",
        "start_level": 1,
        "manual": MANUAL_GRE,
        "definition": "An advanced vocabulary term used in GRE reading, vocabulary, or reasoning questions.",
        "bangla": "GRE পরীক্ষার উন্নত শব্দ",
        "example": "The passage uses _______ to describe a subtle idea in a challenging context.",
        "word_hint": "GRE",
        "seed_score": lambda w: 0,
    },
    {
        "tag": "BCS",
        "start_level": 11,
        "manual": MANUAL_BCS,
        "definition": "A public administration or governance term useful for BCS exam preparation.",
        "bangla": "BCS পরীক্ষার জন্য গুরুত্বপূর্ণ শব্দ",
        "example": "The policy note highlights _______ in a public administration context.",
        "word_hint": "BCS",
        "seed_score": lambda w: 0,
    },
    {
        "tag": "Bank",
        "start_level": 21,
        "manual": MANUAL_BANK,
        "definition": "A banking or finance term used in professional and exam contexts.",
        "bangla": "Bank পরীক্ষার জন্য গুরুত্বপূর্ণ শব্দ",
        "example": "The financial report mentions _______ in the bank statement.",
        "word_hint": "Bank",
        "seed_score": lambda w: 0,
    },
]

COMMON_FINANCE_HINTS = {
    "bank", "cash", "credit", "debit", "deposit", "loan", "interest", "balance", "asset", "liability",
    "equity", "fund", "profit", "loss", "risk", "market", "share", "stock", "bond", "currency", "exchange",
    "payment", "withdraw", "transfer", "treasury", "invoice", "ledger", "audit", "capital", "savings",
    "mortgage", "collateral", "remittance", "portfolio", "dividend", "yield", "forex", "finance",
}

COMMON_BCS_HINTS = {
    "policy", "public", "administration", "governance", "minister", "ministry", "district", "national",
    "civil", "service", "committee", "commission", "reform", "regulation", "development", "budget",
    "election", "parliament", "constitution", "citizen", "local", "urban", "rural", "taxation", "welfare",
}

GRE_PREFIXES = ("ab", "ac", "ad", "an", "anti", "bene", "circum", "con", "counter", "de", "dis", "ex", "hyper", "im", "in", "inter", "macro", "micro", "mis", "non", "ob", "per", "pre", "pro", "re", "sub", "super", "trans", "ultra", "under", "un")
BCS_SUFFIXES = ("tion", "sion", "ment", "ness", "ity", "ance", "ence", "ship", "ism", "dom", "logy", "graphy", "acy", "ary", "ory", "al", "ical", "ive", "ive", "ic")
BANK_SUFFIXES = ("ing", "ment", "tion", "ance", "ence", "ity", "al", "ary", "ary", "able", "ible", "er", "or")


def read_existing_words() -> set[str]:
    used: set[str] = set()
    for path in sorted((DATA_ROOT).glob("*/*.json")):
        data = json.loads(path.read_text())
        for item in data:
            word = str(item.get("word", "")).strip().lower()
            if word:
                used.add(word)
    return used


def load_dict_words() -> list[str]:
    dict_path = Path("/usr/share/dict/words")
    if not dict_path.exists():
        return []
    words: list[str] = []
    for line in dict_path.read_text(errors="ignore").splitlines():
        word = line.strip().lower()
        if re.fullmatch(r"[a-z]+", word) and 5 <= len(word) <= 16:
            words.append(word)
    return words


def infer_pos(word: str) -> str:
    if word.endswith("ly"):
        return "adverb"
    if word.endswith(NOUN_SUFFIXES):
        return "noun"
    if word.endswith(VERB_SUFFIXES):
        return "verb"
    if word.endswith(ADJ_SUFFIXES):
        return "adjective"
    return "noun"


def make_synonyms(word: str, pos: str) -> list[str]:
    base = {
        "noun": ["concept", "term"],
        "verb": ["act", "perform"],
        "adjective": ["descriptive", "qualified"],
        "adverb": ["mannerly", "smoothly"],
    }
    return base.get(pos, ["related", "associated"])


def make_antonyms(word: str, pos: str) -> list[str]:
    base = {
        "noun": ["absence", "lack"],
        "verb": ["stop", "avoid"],
        "adjective": ["opposite", "different"],
        "adverb": ["differently", "otherwise"],
    }
    return base.get(pos, ["opposite"])


def score_gre(word: str) -> int:
    score = 0
    if word.startswith(GRE_PREFIXES):
        score += 3
    if word.endswith(("ity", "tion", "sion", "ous", "ive", "ate", "ence", "ance", "ism", "ary", "ory", "al", "ic", "ure")):
        score += 4
    if 6 <= len(word) <= 12:
        score += 2
    if word in COMMON_FINANCE_HINTS or word in COMMON_BCS_HINTS:
        score -= 5
    return score


def score_bcs(word: str) -> int:
    score = 0
    if word.endswith(BCS_SUFFIXES):
        score += 4
    if any(hint in word for hint in COMMON_BCS_HINTS):
        score += 6
    if 6 <= len(word) <= 14:
        score += 2
    if word in COMMON_FINANCE_HINTS:
        score -= 3
    return score


def score_bank(word: str) -> int:
    score = 0
    if any(hint in word for hint in COMMON_FINANCE_HINTS):
        score += 7
    if word.endswith(BANK_SUFFIXES):
        score += 2
    if 5 <= len(word) <= 13:
        score += 1
    return score


def build_pool(manual: list[str], dict_words: list[str], scorer, used: set[str]) -> list[str]:
    pool: list[str] = []
    seen: set[str] = set()

    for word in manual:
        word = word.lower().replace("-", "")
        if re.fullmatch(r"[a-z]+", word) and word not in used and word not in seen:
            pool.append(word)
            seen.add(word)

    scored = sorted(dict_words, key=lambda w: (scorer(w), len(w)), reverse=True)
    for word in scored:
        if word in used or word in seen:
            continue
        if not re.fullmatch(r"[a-z]+", word):
            continue
        pool.append(word)
        seen.add(word)
        if len(pool) >= 240:
            break

    return pool


def make_entry(word: str, word_id: int, tag: str, definition: str, bangla: str, example: str) -> dict:
    pos = infer_pos(word)
    return {
        "id": word_id,
        "word": word,
        "pos": pos,
        "phonetic": f"/{word}/",
        "bangla": bangla,
        "definition": definition,
        "example": example,
        "synonyms": make_synonyms(word, pos),
        "antonyms": make_antonyms(word, pos),
        "examTags": [tag],
        "difficulty": "advanced",
    }


def chunk(items: list[dict], size: int) -> list[list[dict]]:
    return [items[i : i + size] for i in range(0, len(items), size)]


def main() -> None:
    used = read_existing_words()
    dict_words = load_dict_words()
    if not dict_words:
        raise RuntimeError("/usr/share/dict/words not available; cannot generate exam word bank automatically.")

    all_outputs: list[dict] = []
    for config in CATEGORY_CONFIG:
        pool = build_pool(config["manual"], dict_words, config["seed_score"], used)
        # remove words already consumed by previous categories
        unique_pool: list[str] = []
        seen = set()
        for word in pool:
            if word not in used and word not in seen:
                unique_pool.append(word)
                seen.add(word)
        if len(unique_pool) < 200:
            raise RuntimeError(f"Not enough words for {config['tag']}: {len(unique_pool)} found")
        unique_pool = unique_pool[:200]
        for word in unique_pool:
            used.add(word)
        start_id = 600 + (config["start_level"] - 1) * 20 + 1
        for index, word in enumerate(unique_pool):
            word_id = start_id + index
            definition = config["definition"]
            bangla = config["bangla"]
            example = config["example"]
            all_outputs.append(make_entry(word, word_id, config["tag"], definition, bangla, example))

    if len(all_outputs) != 600:
        raise RuntimeError(f"Expected 600 exam words, got {len(all_outputs)}")

    for level_index in range(30):
        level_items = all_outputs[level_index * 20 : (level_index + 1) * 20]
        level_path = EXAM_ROOT / f"level_{level_index + 1:02d}.json"
        level_path.write_text(json.dumps(level_items, ensure_ascii=False, indent=2) + "\n")

    print(f"generated_exam_files={30}")
    print(f"generated_exam_words={len(all_outputs)}")


if __name__ == "__main__":
    main()
