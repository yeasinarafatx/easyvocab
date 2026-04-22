import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "src/data"
EXAM_ROOT = DATA_ROOT / "exam"

BCS_POOL = [
    "appointment", "authority", "ballot", "bicameral", "bylaw", "cabinet", "candidature", "census",
    "citizen", "civilian", "coalition", "commissioner", "committee", "constituency", "consultative",
    "decree", "deputation", "directive", "disbursement", "district", "electoral", "electorate",
    "eligibility", "empowerment", "enactment", "enforcement", "executive", "federal", "federation",
    "fiscal", "gazette", "grievance", "hierarchy", "impeachment", "inaugural", "institutional",
    "juridical", "jurisdictional", "legislation", "legislative", "legislator", "liaison", "mandate",
    "ministerial", "municipal", "nomination", "ombudsman", "ordinance", "oversight", "parliamentary",
    "participation", "policy", "polling", "prerogative", "procurement", "ratification", "referendum",
    "regulatory", "representation", "revenue", "scrutiny", "secretariat", "secrecy", "sovereign",
    "statutory", "subcommittee", "subsidy", "supervision", "tribunal", "transparency", "verification",
    "veto", "vigilance", "ward", "whistleblower", "zoning", "administrative", "advisory", "allocation",
    "audit", "budgetary", "capacity", "civilservice", "compliance", "coordination", "decentralization",
    "delegation", "development", "discretion", "divisional", "duty", "electioneering", "empirical",
    "federalism", "governor", "implementation", "integrity", "locality", "monitoring", "municipality",
    "opposition", "planning", "project", "publicservice", "quota", "reformist", "responsibility",
    "standardization", "statute", "taxation", "union", "urbanization", "welfare", "approval", "assessment",
    "appeal", "articulate", "authorization", "benchmark", "biannual", "briefing", "candidate", "censorship",
    "charter", "civilservice", "codification", "congress", "consent", "constituent", "contractual",
    "correction", "council", "cumulative", "debate", "defer", "democratic", "document", "demand",
    "empirical", "equitable", "formal", "guideline", "inclusive", "initiate", "interpretive", "national",
    "official", "participatory", "pragmatic", "poll", "representative", "reliability", "remuneration",
    "resolution", "secretary", "statecraft", "territorial", "voter", "voterlist", "widespread", "prerogative",
    "parliamentary", "judicial", "legislator", "legislative", "oversight", "monitoring", "enquiry", "executive",
    "federalism", "governor", "impeachment", "inauguration", "liaison", "mandate", "minister", "municipal",
    "ordnance", "policy", "public", "quota", "scrutiny", "service", "subcommittee", "transparency", "tribunal",
    "vigilance", "whistleblower", "zoning", "administrative", "advisory", "budgetary", "capacity", "citizenship",
    "civilian", "compliance", "consultation", "corruption", "deputation", "district", "electorate", "eligibility",
    "enforcement", "fiscal", "grievance", "hierarchy", "implementation", "jurisdiction", "legislation", "planning",
    "reformist", "responsibility", "standardization", "taxation", "verification", "ward", "subsidy", "sovereign",
]

BANK_POOL = [
    "accrual", "amortization", "annuity", "arbitrage", "asset", "audit", "balance", "banknote",
    "benchmark", "bond", "brokerage", "budget", "capital", "cash", "cashflow", "cheque", "clearance",
    "collateral", "commission", "commodity", "compound", "credit", "creditor", "currency", "debit",
    "default", "deflation", "deposit", "depreciation", "derivative", "dividend", "drawer", "escrow",
    "equity", "exchange", "expense", "finance", "fiscal", "forex", "fund", "guarantee", "hedge",
    "income", "inflation", "insurance", "interest", "inventory", "investment", "invoice", "issuer",
    "ledger", "leverage", "liability", "liquidity", "loan", "markup", "monetary", "money", "mortgage",
    "nonperforming", "overdraft", "payment", "payee", "payer", "portfolio", "premium", "principal",
    "profit", "quotation", "refinance", "refund", "remittance", "reserve", "revenue", "risk",
    "savings", "settlement", "share", "solvency", "speculation", "spread", "stock", "statement",
    "treasury", "turnover", "underwrite", "valuation", "voucher", "withdrawal", "yield", "banking",
    "banker", "bankrupt", "bookkeeping", "capitalgain", "chargeback", "clearinghouse", "coupon",
    "customer", "debt", "debenture", "depositary", "discount", "financial", "funding", "fundraise",
    "interestrate", "invoiceable", "kiting", "leverage", "markup", "nonperforming", "payment",
    "receivable", "reconciliation", "redemption", "security", "settlement", "statement", "teller",
    "transaction", "transfer", "underwriting", "vault", "withdraw", "writeoff", "yielding", "balancebook",
    "budgeting", "capitalization", "creditline", "depositor", "discounting", "financially", "forecast",
    "guarantor", "indebted", "installment", "liquid", "mortgagor", "payroll", "rate", "recovery",
    "reimbursement", "remit", "solvent", "speculative", "treasurer", "valuation", "workingcapital",
]


def read_used_words() -> set[str]:
    used: set[str] = set()
    for path in sorted(DATA_ROOT.glob("*/*.json")):
        if path.parent.name == "exam" and path.name in {"level_16.json", "level_17.json", "level_18.json", "level_19.json", "level_20.json", "level_26.json", "level_27.json", "level_28.json", "level_29.json", "level_30.json"}:
            continue
        data = json.loads(path.read_text())
        for item in data:
            word = str(item.get("word", "")).strip().lower()
            if word:
                used.add(word)
    return used


def infer_pos(word: str) -> str:
    if word.endswith("ly"):
        return "adverb"
    if word.endswith(("tion", "sion", "ment", "ness", "ity", "ance", "ence", "ship", "ism", "age", "ure", "dom", "logy", "graphy", "acy", "al")):
        return "noun"
    if word.endswith(("ate", "ify", "ise", "ize", "en")):
        return "verb"
    if word.endswith(("ous", "ive", "ary", "ory", "ant", "ent", "ic", "ical", "able", "ible", "less", "ful")):
        return "adjective"
    return "noun"


def make_synonyms(pos: str) -> list[str]:
    if pos == "verb":
        return ["act", "perform"]
    if pos == "adjective":
        return ["descriptive", "qualitative"]
    if pos == "adverb":
        return ["smoothly", "steadily"]
    return ["term", "concept"]


def make_antonyms(pos: str) -> list[str]:
    if pos == "verb":
        return ["stop", "avoid"]
    if pos == "adjective":
        return ["opposite", "different"]
    if pos == "adverb":
        return ["differently", "otherwise"]
    return ["absence", "lack"]


def build_entries(words: list[str], start_id: int, tag: str, bangla: str, definition: str, example: str) -> list[dict]:
    entries = []
    for index, word in enumerate(words, start=0):
        pos = infer_pos(word)
        entries.append(
            {
                "id": start_id + index,
                "word": word,
                "pos": pos,
                "phonetic": f"/{word}/",
                "bangla": bangla,
                "definition": definition,
                "example": example,
                "synonyms": make_synonyms(pos),
                "antonyms": make_antonyms(pos),
                "examTags": [tag],
                "difficulty": "advanced",
            }
        )
    return entries


def pick_words(pool: list[str], used: set[str], count: int) -> list[str]:
    picked: list[str] = []
    seen: set[str] = set()
    for word in pool:
        word = word.lower().replace(" ", "").replace("-", "")
        if not re.fullmatch(r"[a-z]+", word):
            continue
        if word in used or word in seen:
            continue
        picked.append(word)
        seen.add(word)
        if len(picked) == count:
            break
    return picked


def write_levels(level_numbers: list[int], words: list[str], start_id: int, tag: str, bangla: str, definition: str, example: str) -> None:
    entries = build_entries(words, start_id, tag, bangla, definition, example)
    for offset, level_number in enumerate(level_numbers):
        chunk = entries[offset * 20 : (offset + 1) * 20]
        path = EXAM_ROOT / f"level_{level_number:02d}.json"
        path.write_text(json.dumps(chunk, ensure_ascii=False, indent=2) + "\n")


def main() -> None:
    used = read_used_words()

    bcs_words = pick_words(BCS_POOL, used, 100)
    if len(bcs_words) < 100:
        raise RuntimeError(f"BCS tail needs 100 words, got {len(bcs_words)}")
    for word in bcs_words:
        used.add(word)

    bank_words = pick_words(BANK_POOL, used, 100)
    if len(bank_words) < 100:
        raise RuntimeError(f"Bank tail needs 100 words, got {len(bank_words)}")

    write_levels(
        [16, 17, 18, 19, 20],
        bcs_words,
        900 + 1,
        "BCS",
        "BCS পরীক্ষার গুরুত্বপূর্ণ শব্দ",
        "A BCS exam vocabulary term used in governance and public administration contexts.",
        "The policy note highlights _______ in a public administration context.",
    )

    write_levels(
        [26, 27, 28, 29, 30],
        bank_words,
        1100 + 1,
        "Bank",
        "Bank পরীক্ষার গুরুত্বপূর্ণ শব্দ",
        "A banking or finance term used in professional and exam contexts.",
        "The financial report mentions _______ in the bank statement.",
    )

    print(f"bcs_words_written={len(bcs_words)}")
    print(f"bank_words_written={len(bank_words)}")


if __name__ == "__main__":
    main()
