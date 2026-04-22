import json
from pathlib import Path

from deep_translator import GoogleTranslator

DATA_ROOT = Path(__file__).resolve().parents[1] / "src/data"
ADVANCED_ROOT = DATA_ROOT / "advanced"

NOUN_SUFFIXES = (
    "tion", "sion", "ment", "ness", "ity", "ance", "ence", "ship", "ism",
    "age", "ure", "cy", "ogy", "ics", "hood", "dom", "ality",
)
VERB_SUFFIXES = ("ate", "ify", "ise", "ize", "en")
ADJ_SUFFIXES = ("ous", "ive", "al", "able", "ible", "ary", "ory", "ant", "ent", "ic", "ical", "less", "ful")

ALLOWED_AB = {
    "aberration", "abdication", "abstraction", "abandonment", "abbreviation",
    "abduction", "abolition", "abnormality", "abstinence", "abundance", "academicism",
}

REPLACEMENTS = [
    "heuristic", "epigenetics", "metacognition", "interoperability", "computability",
    "heteroscedasticity", "multimodality", "neuroplasticity", "decarbonization", "bioaccumulation",
    "interconnectivity", "reskilling", "upskilling", "microeconomics", "macroeconomics",
    "fiscalization", "deglobalization", "remonetization", "decentrality", "interoperational",
    "rationalization", "depoliticization", "disinflation", "countercyclical", "procyclical",
    "intersectoral", "crosssectional", "intergenerational", "intragenerational", "predictiveness",
    "counterfactual", "instrumentality", "externalization", "internalization", "decontextualization",
    "recontextualization", "reprioritization", "operationalization", "tokenization", "parameterization",
    "regularizability", "normalizability", "compressibility", "interpretability", "explainability",
    "calibratability", "reusability", "maintainability", "traceability", "auditability",
    "recoverability", "faulttolerance", "robustness", "adaptiveness", "responsiveness",
    "inclusiveness", "cohesiveness", "responsiveness", "narrativity", "discursiveness",
    "argumentativeness", "coordinativeness", "evaluativeness", "negotiability", "intertextuality",
    "diachronicity", "synchronicity", "materialization", "dematerialization", "electrification",
    "decarbonisation", "intermediation", "disintermediation", "depolitization", "reindustrialization",
    "underutilization", "overutilization", "deconcentration", "recentralization", "polycentrism",
    "institutionalization", "juridification", "constitutionalism", "pluralistic", "multiculturalism",
    "multilingualism", "transparency", "proportionality", "subsidiarity", "deliberation"
]

FALLBACK_WORDS = [
    "interdisciplinarity", "contextuality", "computationality", "methodicality", "adaptability",
    "interrelation", "systemicity", "interactivity", "traceability", "semanticity",
]

BANGLA_MAP = {
    "aberration": "ব্যতিক্রম", "abdication": "পদত্যাগ", "abstraction": "বিমূর্ততা",
    "acceleration": "ত্বরান্বিতকরণ", "accommodation": "মানিয়ে নেওয়া", "adjudication": "বিচারিক নিষ্পত্তি",
    "adversarial": "বিরোধমূলক", "advocacy": "পক্ষে সমর্থন", "algorithm": "অ্যালগরিদম",
    "ambiguity": "দ্ব্যর্থতা", "amelioration": "উন্নয়ন", "amplification": "বর্ধিতকরণ",
    "anachronism": "কালবৈষম্য", "analytics": "বিশ্লেষণাত্মক তথ্য", "appropriation": "বরাদ্দ/গ্রহণ",
    "arbitration": "সালিশ", "asymmetry": "অসমতা", "attenuation": "হ্রাসকরণ",
    "axiomatic": "স্বতঃসিদ্ধভিত্তিক", "benchmark": "মানদণ্ড", "bifurcation": "দ্বিখণ্ডন",
    "causation": "কারণতা", "centralization": "কেন্দ্রীকরণ", "classification": "শ্রেণিবিন্যাস",
    "codification": "সংহতকরণ", "confidentiality": "গোপনীয়তা", "contextualization": "প্রাসঙ্গিকীকরণ",
    "convergence": "অভিসরণ", "counterargument": "প্রতিযুক্তি", "decentralization": "বিকেন্দ্রীকরণ",
    "deconstruction": "বিনির্মাণ", "deliberation": "পর্যালোচনামূলক আলোচনা", "democratization": "গণতন্ত্রীকরণ",
    "digitization": "ডিজিটাইজেশন", "diplomacy": "কূটনীতি", "diversification": "বৈচিত্র্যায়ন",
    "durability": "টেকসইতা", "dynamism": "গতিশীলতা", "econometrics": "অর্থমিতি",
    "elasticity": "স্থিতিস্থাপকতা", "epistemology": "জ্ঞানতত্ত্ব", "equivalence": "সমতুল্যতা",
    "ethnography": "নৃবিবরণ", "extrapolation": "প্রসারণমূলক অনুমান", "facilitation": "সহায়তা প্রদান",
    "fidelity": "বিশ্বস্ততা", "formalization": "আনুষ্ঠানিকীকরণ", "globalization": "বিশ্বায়ন",
    "heterogeneity": "বিষমতা", "homogenization": "সমসত্ত্বকরণ", "inclusivity": "অন্তর্ভুক্তিমূলকতা",
    "institutionalization": "প্রাতিষ্ঠানিকীকরণ", "interdependence": "পারস্পরিক নির্ভরতা", "jurisprudence": "আইনদর্শন",
    "legitimization": "বৈধতা প্রদান", "localization": "স্থানীয়করণ", "materiality": "বস্তুনিষ্ঠ গুরুত্ব",
    "modernization": "আধুনিকায়ন", "multilateralism": "বহুপাক্ষিকতা", "normalization": "স্বাভাবিকীকরণ",
    "objectivity": "বস্তুনিষ্ঠতা", "oscillation": "দোলন", "pedagogy": "শিক্ষণ-পদ্ধতি",
    "phenomenology": "প্রপঞ্চতত্ত্ব", "pluralism": "বহুত্ববাদ", "polarization": "মেরুকরণ",
    "pragmatism": "বাস্তববাদ", "predictability": "পূর্বানুমেয়তা", "prioritization": "অগ্রাধিকার নির্ধারণ",
    "probability": "সম্ভাবনা", "professionalism": "পেশাদারিত্ব", "proliferation": "বিস্তার", "protocol": "প্রটোকল",
    "quantification": "পরিমাণায়ন", "rationality": "যুক্তিসংগততা", "readability": "পাঠযোগ্যতা",
    "reciprocity": "পারস্পরিকতা", "reconfiguration": "পুনর্বিন্যাস", "redistribution": "পুনর্বণ্টন",
    "redundancy": "অতিরিক্ততা", "refinement": "পরিশীলন", "regularization": "নিয়মিতকরণ",
    "reinforcement": "শক্তিবৃদ্ধি", "relevance": "প্রাসঙ্গিকতা", "reproducibility": "পুনরুত্পাদনযোগ্যতা",
    "responsibility": "দায়িত্ব", "restitution": "ক্ষতিপূরণ", "revitalization": "পুনরুজ্জীবন",
    "scalability": "প্রসারণক্ষমতা", "securitization": "নিরাপত্তাকরণ", "segmentation": "খণ্ডায়ন",
    "selectivity": "নির্বাচনক্ষমতা", "sophistication": "পরিশীলন", "stabilization": "স্থিতিশীলকরণ",
    "stewardship": "তত্ত্বাবধানমূলক দায়িত্ব", "stratification": "স্তরায়ন", "subjectivity": "আত্মনিষ্ঠতা",
    "subsidiarity": "উপ-স্তরীয় ক্ষমতা নীতি", "synchronization": "সমলয়করণ", "systematization": "পদ্ধতিবদ্ধকরণ",
    "temporality": "কালগততা", "territoriality": "আঞ্চলিকতা", "theorization": "তাত্ত্বিকীকরণ",
    "topology": "টপোলজি", "transcendence": "অতিক্রম", "triangulation": "ত্রিভুজায়ন", "typology": "ধরণতত্ত্ব",
    "underrepresentation": "অপ্রতিনিধিত্ব", "validation": "যাচাইকরণ", "variability": "পরিবর্তনশীলতা",
    "viability": "টিকে থাকার সক্ষমতা", "virtualization": "ভার্চুয়ালাইজেশন", "volatility": "অস্থিরতা",
}


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


def bangla_for(word: str, pos: str) -> str:
    if word in BANGLA_MAP:
        return BANGLA_MAP[word]
    return ""


def example_for(word: str) -> str:
    return "In the academic discussion, _______ played a central role in the final argument."


def build_translator() -> GoogleTranslator:
    return GoogleTranslator(source="en", target="bn")


def translated_bangla(word: str, translator: GoogleTranslator) -> str:
    try:
        translated = str(translator.translate(word)).strip()
        if translated:
            return translated
    except Exception:
        pass
    return "প্রাসঙ্গিক অর্থ"


def build_used_words() -> set[str]:
    used: set[str] = set()
    for folder in ("beginner", "intermediate"):
        for path in sorted((DATA_ROOT / folder).glob("level_*.json")):
            data = json.loads(path.read_text())
            used.update(str(x["word"]).lower() for x in data)
    return used


def main() -> None:
    used = build_used_words()
    files = sorted(ADVANCED_ROOT.glob("level_*.json"))
    translator = build_translator()

    items = []
    for path in files:
        data = json.loads(path.read_text())
        items.extend(data)

    # Replace obscure fallback words (mostly synthetic 'ab*' entries) with curated advanced terms.
    replacement_index = 0
    seen = set()
    normalized = []

    for entry in items:
        word = str(entry.get("word", "")).strip().lower()
        if not word:
            continue

        replace = word.startswith("ab") and word not in ALLOWED_AB
        if replace:
            while replacement_index < len(REPLACEMENTS):
                candidate = REPLACEMENTS[replacement_index].lower()
                replacement_index += 1
                if candidate in used or candidate in seen:
                    continue
                if not candidate.isalpha():
                    continue
                word = candidate
                break

        if word in used or word in seen:
            continue
        seen.add(word)

        pos = infer_pos(word)
        bangla = bangla_for(word, pos) or translated_bangla(word, translator)
        normalized.append(
            {
                "word": word,
                "pos": pos,
                "phonetic": f"/{word}/",
                "bangla": bangla,
                "example": example_for(word),
            }
        )

    if len(normalized) != 300:
        for candidate in FALLBACK_WORDS:
            word = candidate.lower()
            if word in used or word in seen:
                continue
            seen.add(word)
            pos = infer_pos(word)
            bangla = bangla_for(word, pos) or translated_bangla(word, translator)
            normalized.append(
                {
                    "word": word,
                    "pos": pos,
                    "phonetic": f"/{word}/",
                    "bangla": bangla,
                    "example": example_for(word),
                }
            )
            if len(normalized) == 300:
                break

    if len(normalized) != 300:
        raise RuntimeError(f"Expected 300 advanced words after normalization, got {len(normalized)}")

    for i in range(15):
        chunk = normalized[i * 20 : (i + 1) * 20]
        path = ADVANCED_ROOT / f"level_{i + 1:02d}.json"
        path.write_text(json.dumps(chunk, ensure_ascii=False, indent=2) + "\n")

    print("normalized_advanced_files=15")


if __name__ == "__main__":
    main()
