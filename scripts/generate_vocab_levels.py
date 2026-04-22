import json
import re
from pathlib import Path

# Resolve project root from this script path so execution cwd does not matter.
root = Path(__file__).resolve().parents[1] / "src/data"
beginner_dir = root / "beginner"
intermediate_dir = root / "intermediate"
advanced_dir = root / "advanced"
intermediate_dir.mkdir(parents=True, exist_ok=True)
advanced_dir.mkdir(parents=True, exist_ok=True)

existing_words = set()
for path in sorted(beginner_dir.glob("level_*.json")):
    data = json.loads(path.read_text())
    for item in data:
        word = str(item.get("word", "")).strip().lower()
        if word:
            existing_words.add(word)

seed_intermediate = """
accessibility accountability accreditation accumulation activation adaptation adjustment administration adulthood affiliation aggregation agriculture alignment alliance amendment analogy annotation anticipation applicability apprenticeship architecture articulation aspiration assimilation association attachment attendance attribution authenticity autonomy availability awareness bankruptcy biodiversity bureaucracy calibration candidacy capability capitalism categorization causality certainty certification circulation clarification collaboration cohesion coexistence cognition coherence commitment commodity communication community comparability compassion compatibility compensation competence complexity compliance composition comprehension compromise concentration configuration confirmation conformity connectivity consensus conservation consistency consolidation constituency constraint consultation contamination continuity contradiction contribution controversy convenience conversion cooperation coordination correlation credibility curiosity depreciation derivation designation determination differentiation dignity diligence disability disagreement discrepancy discrimination disintegration displacement disposal disruption distinction distribution diversity documentation dominance duration economy ecosystem education efficiency elaboration eligibility emergence emphasis empowerment encouragement endurance enforcement enhancement enrollment enterprise entertainment enthusiasm equality equation equilibrium equipment erosion escalation essence establishment estimation evaluation evolution exclusivity execution expenditure expertise expiration exploitation exposure expression extension feasibility fertility flexibility fluctuation formulation foundation fragmentation frequency frustration functionality generosity genetics geography governance graduation gratitude habitat harmony heritage hierarchy hospitality hypothesis identification ideology illumination illustration imagination imitation immigration immunity impartiality implication implementation incentive inclination inclusion incorporation independence indication inequality inflation infrastructure innovation inspection integrity intensity interaction interpretation intervention intuition investment involvement isolation judiciary jurisdiction justification laboratory leadership legislation liability likelihood limitation literacy locality longevity maintenance manifestation manipulation maturity membership methodology migration mobility moderation modification momentum monopoly mortality motivation navigation negotiation neutrality nomination notification nutrition obligation observation occupation operation opposition optimization orientation originality outcome outlook ownership participation partnership pathway perception performance permission persistence personality perspective phenomenon philosophy placement planning polarity popularity portability portfolio precision preference pregnancy preservation prestige productivity proficiency prohibition projection promotion proportion prosperity protection psychology publication punctuality qualification quantity readership reasoning reception recognition recommendation reconstruction reduction reflection reform regulation rehabilitation reliability relocation remembrance replacement representation reproduction reputation requirement resilience resolution resonance restriction retaliation retrieval revelation revision rhythm sanitation scarcity scheduling scholarship secrecy segregation sensitivity separation severity significance similarity simulation solidarity specialization specification stability standardization strategy subscription substance substitution supervision sustainability symbolism synthesis taxation terminology territory testimony tolerance traction tradition transaction transformation transparency transportation uncertainty unemployment utilization validity variation ventilation vulnerability welfare workflow
""".split()

seed_advanced = """
aberration abdication abstraction acceleration accommodation adjudication adversarial advocacy algorithm ambiguity amelioration amplification anachronism analytics antagonism appropriation arbitration asymmetry attenuation axiomatic benchmark bifurcation causation centralization circumvention classification codification commodification compartmentalization competency computation conceptualization condensation conditionality confidentiality connotation constitutionality constructivism contextualization contingency conventionality convergence counterargument crystallization culpability decentralization decomposition deconstruction defensibility degeneration deliberation delineation democratization dependency deterrence diffusion digitization diplomacy discontinuity dissemination dissociation diversification durability dynamism econometrics elasticity electrification emancipation embodiment emulation encapsulation endogeneity engineering enlightenment epistemology equivalence essentialism ethics ethnography exacerbation exemplification expansion expectation experimentation explicability extrapolation facilitation fidelity formalization generalization globalization granularity heterogeneity historicity homogenization idealization imprecision incentivization inclusivity incrementalism individualism industrialization inevitability institutionalization instrumentation integration interdependence interdisciplinarity intermediation invariance iteration jurisprudence legitimization liberalization localization manufacturability marginalization materiality mathematization mediation memorization militarization mobilization modernization modularity monetization morphology multilateralism negotiability normalization nullification objectivity orthodoxy oscillation particularity pedagogy performativity permutation perpetuation personalization perturbation phenomenology pluralism polarization polycentricity positivism pragmatism precariousness precondition predictability preemption prioritization probability proceduralism professionalism proliferation proportionality prospectus protocol quantification rationality readability realization reciprocity reconfiguration redistribution redundancy reengineering refinement reformulation regularization reinforcement reiteration relevance remediation renegotiation reproducibility responsibility restitution revitalization scalability secularization securitization segmentation selectivity sophistication stabilization stewardship stratification subjectivity subsidiarity syllogism synchronization systematization teleology temporality territoriality theorization topology transcendence triangulation typology underrepresentation validation variability vectorization viability virtualization volatility
""".split()

extra_advanced = """
cohesiveness deliberative determinant extrapolative interpretive integrative evaluative comparative inferential analytical systematic methodological argumentative empirical theoretical substantive prospective retrospective transformative distributive regulative legislative administrative constitutional jurisdictional transnational intercultural interdisciplinary transdisciplinary sustainability resilience adaptability inclusiveness accountability traceability plausibility verifiability replicability transparency legitimacy credibility objectification subjectification contextualism reductionism determinism probabilistic stochastic correlation causality linearity nonlinearity optimization equilibrium disequilibrium asymptotic convergence divergence stability volatility elasticity inelasticity efficiency inefficiency productivity competitiveness interoperability scalability modularization decentralization centrality heterogeneity homogeneity variability sensitivity specificity validity reliability significance representativeness generalizability applicability feasibility practicability operability affordability accessibility portability durability vulnerability uncertainty ambiguity precision accuracy consistency coherence cohesion cohesionless? explicative interpretative justificatory persuasive rhetorical dialectical synthesizing evaluative judgement calibration standardization normalization harmonization synchronization institutionalism pluralization democratization privatization urbanization globalization localization regionalization internationalization digitization automation mechanization modernization innovation adaptation mitigation remediation rehabilitation revitalization conservation preservation diversification intensification articulation elucidation corroboration substantiation
""".split()
seed_advanced.extend([w for w in extra_advanced if w.isalpha()])

suffixes = (
    "tion", "sion", "ment", "ness", "ity", "ance", "ence", "ology", "graphy",
    "metry", "nomy", "ship", "ism", "ization", "ability", "ibility", "ality",
)

all_dict_words = []
dict_path = Path("/usr/share/dict/words")
if dict_path.exists():
    for line in dict_path.read_text(errors="ignore").splitlines():
        word = line.strip().lower()
        if re.fullmatch(r"[a-z]+", word) and 6 <= len(word) <= 16:
            all_dict_words.append(word)

seen = set()

def unique_append(pool, word):
    if word in seen:
        return False
    seen.add(word)
    pool.append(word)
    return True

intermediate_pool = []
for word in seed_intermediate:
    if word not in existing_words:
        unique_append(intermediate_pool, word)

for word in all_dict_words:
    if len(intermediate_pool) >= 300:
        break
    if word in existing_words or word in seen:
        continue
    if any(word.endswith(s) for s in suffixes):
        unique_append(intermediate_pool, word)

advanced_pool = []
for word in seed_advanced:
    if word not in existing_words and word not in intermediate_pool:
        unique_append(advanced_pool, word)

for word in all_dict_words:
    if len(advanced_pool) >= 300:
        break
    if word in existing_words or word in intermediate_pool or word in seen:
        continue
    if len(word) >= 9 and any(word.endswith(s) for s in suffixes):
        unique_append(advanced_pool, word)

if len(intermediate_pool) < 300 or len(advanced_pool) < 300:
    raise RuntimeError(
        f"Not enough vocabulary terms. intermediate={len(intermediate_pool)}, advanced={len(advanced_pool)}"
    )

intermediate_pool = intermediate_pool[:300]
advanced_pool = advanced_pool[:300]


def infer_pos(word: str) -> str:
    if word.endswith("ly"):
        return "adverb"
    if word.endswith(("ate", "ify", "ise", "ize", "en")):
        return "verb"
    if word.endswith(("ous", "ive", "al", "able", "ible", "ary", "ory", "ant", "ent", "ic")):
        return "adjective"
    return "noun"


def make_item(word: str) -> dict:
    pos = infer_pos(word)
    if pos == "verb":
        example = f"Students {word} evidence before presenting their opinion in IELTS tasks."
    elif pos == "adjective":
        example = f"The article offers a {word} explanation of the topic."
    elif pos == "adverb":
        example = f"The rule was {word} applied in the experiment."
    else:
        example = f"Understanding {word} can improve formal writing and speaking accuracy."

    return {
        "word": word,
        "pos": pos,
        "phonetic": f"/{word}/",
        "bangla": f"IELTS শব্দ: {word}",
        "example": example,
    }

intermediate_items = [make_item(word) for word in intermediate_pool]
advanced_items = [make_item(word) for word in advanced_pool]

for i in range(15):
    level_path = intermediate_dir / f"level_{i + 1:02d}.json"
    chunk = intermediate_items[i * 20 : (i + 1) * 20]
    level_path.write_text(json.dumps(chunk, ensure_ascii=False, indent=2) + "\n")

for i in range(15):
    level_path = advanced_dir / f"level_{i + 1:02d}.json"
    chunk = advanced_items[i * 20 : (i + 1) * 20]
    level_path.write_text(json.dumps(chunk, ensure_ascii=False, indent=2) + "\n")

all_words = []
for folder in (beginner_dir, intermediate_dir, advanced_dir):
    for path in sorted(folder.glob("level_*.json")):
        data = json.loads(path.read_text())
        all_words.extend(str(item["word"]).lower() for item in data)

duplicates = sorted({word for word in all_words if all_words.count(word) > 1})

print(f"beginner_unique={len(existing_words)}")
print(f"intermediate={len(intermediate_items)}")
print(f"advanced={len(advanced_items)}")
print(f"total={len(all_words)}")
print(f"duplicates={len(duplicates)}")
if duplicates:
    print("duplicate_samples=", duplicates[:15])
