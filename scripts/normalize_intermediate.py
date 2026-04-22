import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src/data/intermediate"

NOUN_SUFFIXES = (
    "tion", "sion", "ment", "ness", "ity", "ance", "ence", "ship", "ism",
    "age", "ure", "cy", "ogy", "ics", "hood", "dom", "ality",
)
VERB_SUFFIXES = ("ate", "ify", "ise", "ize", "en")
ADJ_SUFFIXES = ("ous", "ive", "al", "able", "ible", "ary", "ory", "ant", "ent", "ic", "ical", "less", "ful")

SPECIAL_POS = {
    "enterprise": "noun",
    "expertise": "noun",
    "judiciary": "noun",
    "laboratory": "noun",
    "monopoly": "noun",
    "placement": "noun",
    "replacement": "noun",
    "retrieval": "noun",
    "outlook": "noun",
    "workflow": "noun",
}

BANGLA_MAP = {
    "accessibility": "সহজপ্রাপ্যতা",
    "accountability": "জবাবদিহিতা",
    "accreditation": "স্বীকৃতি",
    "accumulation": "সঞ্চয়",
    "adaptation": "অভিযোজন",
    "agriculture": "কৃষি",
    "architecture": "স্থাপত্য",
    "assessment": "মূল্যায়ন",
    "association": "সম্পর্ক",
    "awareness": "সচেতনতা",
    "biodiversity": "জীববৈচিত্র্য",
    "collaboration": "সহযোগিতা",
    "communication": "যোগাযোগ",
    "community": "সম্প্রদায়",
    "conservation": "সংরক্ষণ",
    "consistency": "সামঞ্জস্য",
    "contamination": "দূষণ",
    "controversy": "বিতর্ক",
    "credibility": "বিশ্বাসযোগ্যতা",
    "curiosity": "কৌতূহল",
    "determination": "দৃঢ়তা",
    "discrimination": "বৈষম্য",
    "diversity": "বৈচিত্র্য",
    "documentation": "নথিপত্র",
    "education": "শিক্ষা",
    "efficiency": "দক্ষতা",
    "equality": "সমতা",
    "equilibrium": "ভারসাম্য",
    "evaluation": "মূল্যায়ন",
    "evolution": "বিবর্তন",
    "feasibility": "সম্ভাব্যতা",
    "flexibility": "নমনীয়তা",
    "formulation": "প্রণয়ন",
    "functionality": "কার্যকারিতা",
    "governance": "শাসনব্যবস্থা",
    "ideology": "মতাদর্শ",
    "immigration": "অভিবাসন",
    "implementation": "বাস্তবায়ন",
    "inclusion": "অন্তর্ভুক্তি",
    "independence": "স্বাধীনতা",
    "inequality": "বৈষম্য",
    "infrastructure": "অবকাঠামো",
    "innovation": "উদ্ভাবন",
    "interaction": "পারস্পরিক ক্রিয়া",
    "interpretation": "ব্যাখ্যা",
    "intervention": "হস্তক্ষেপ",
    "investment": "বিনিয়োগ",
    "jurisdiction": "এখতিয়ার",
    "leadership": "নেতৃত্ব",
    "legislation": "আইনপ্রণয়ন",
    "literacy": "সাক্ষরতা",
    "methodology": "পদ্ধতিবিজ্ঞান",
    "migration": "স্থানান্তর",
    "motivation": "প্রেরণা",
    "negotiation": "আলোচনা",
    "nutrition": "পুষ্টি",
    "observation": "পর্যবেক্ষণ",
    "optimization": "সর্বোত্তমীকরণ",
    "orientation": "অভিমুখ",
    "originality": "মৌলিকতা",
    "participation": "অংশগ্রহণ",
    "partnership": "অংশীদারিত্ব",
    "perception": "অনুধাবন",
    "performance": "কার্যসম্পাদন",
    "persistence": "অটলতা",
    "philosophy": "দর্শন",
    "planning": "পরিকল্পনা",
    "precision": "নির্ভুলতা",
    "preservation": "সংরক্ষণ",
    "productivity": "উৎপাদনশীলতা",
    "proficiency": "দক্ষতা",
    "promotion": "উন্নয়ন/প্রচার",
    "proportion": "অনুপাত",
    "prosperity": "সমৃদ্ধি",
    "protection": "সুরক্ষা",
    "psychology": "মনোবিজ্ঞান",
    "publication": "প্রকাশনা",
    "qualification": "যোগ্যতা",
    "recognition": "স্বীকৃতি",
    "recommendation": "সুপারিশ",
    "regulation": "নিয়ন্ত্রণ",
    "rehabilitation": "পুনর্বাসন",
    "reliability": "নির্ভরযোগ্যতা",
    "representation": "প্রতিনিধিত্ব",
    "reputation": "সুনাম",
    "resilience": "সহনশীলতা",
    "resolution": "সমাধান",
    "restriction": "সীমাবদ্ধতা",
    "sanitation": "স্বাস্থ্যবিধি",
    "scholarship": "বৃত্তি",
    "stability": "স্থিতিশীলতা",
    "standardization": "মানকরণ",
    "strategy": "কৌশল",
    "sustainability": "টেকসইতা",
    "synthesis": "সমন্বয়",
    "taxation": "করব্যবস্থা",
    "terminology": "পরিভাষা",
    "tradition": "ঐতিহ্য",
    "transaction": "লেনদেন",
    "transformation": "রূপান্তর",
    "transparency": "স্বচ্ছতা",
    "uncertainty": "অনিশ্চয়তা",
    "unemployment": "বেকারত্ব",
    "utilization": "ব্যবহার",
    "validity": "বৈধতা",
    "variation": "ভিন্নতা",
    "vulnerability": "ঝুঁকিপ্রবণতা",
    "welfare": "কল্যাণ",
}


def infer_pos(word: str) -> str:
    if word in SPECIAL_POS:
        return SPECIAL_POS[word]
    if word.endswith("ly"):
        return "adverb"
    if word.endswith(NOUN_SUFFIXES):
        return "noun"
    if word.endswith(VERB_SUFFIXES):
        return "verb"
    if word.endswith(ADJ_SUFFIXES):
        return "adjective"
    return "noun"


def bangla_for(word: str, pos: str) -> str:
    if word in BANGLA_MAP:
        return BANGLA_MAP[word]
    if pos == "noun":
        return "একাডেমিক ধারণা"
    if pos == "verb":
        return "কর্ম সম্পাদন করা"
    if pos == "adjective":
        return "বৈশিষ্ট্যসূচক"
    return "পদ্ধতিগতভাবে"


def example_for(word: str) -> str:
    return f"The report discusses {word} as a key issue in this context."


def normalize_file(path: Path) -> None:
    items = json.loads(path.read_text())
    updated = []
    for item in items:
        word = str(item.get("word", "")).strip().lower()
        if not word:
            continue
        pos = infer_pos(word)
        updated.append(
            {
                "word": word,
                "pos": pos,
                "phonetic": str(item.get("phonetic", "")),
                "bangla": bangla_for(word, pos),
                "example": example_for(word),
            }
        )

    path.write_text(json.dumps(updated, ensure_ascii=False, indent=2) + "\n")


def main() -> None:
    files = sorted(ROOT.glob("level_*.json"))
    for path in files:
        normalize_file(path)
    print(f"normalized_files={len(files)}")


if __name__ == "__main__":
    main()
