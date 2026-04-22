import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXAM_DIR = ROOT / "src" / "data" / "exam"


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


def main() -> None:
    files = sorted(EXAM_DIR.glob("level_*.json"))
    if len(files) != 30:
        raise RuntimeError(f"Expected 30 exam files, found {len(files)}")

    for path in files:
        data = json.loads(path.read_text(encoding="utf-8"))
        for item in data:
            word = str(item.get("word", "")).strip()
            pos = str(item.get("pos", "noun")).strip().lower()
            tags = item.get("examTags") or ["GRE"]
            tag = str(tags[0])
            definition = str(item.get("definition", "")).strip()
            synonyms = [str(x) for x in (item.get("synonyms") or [])]
            item["example"] = build_example(word, pos, tag, definition, synonyms)

        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"updated_exam_example_files={len(files)}")


if __name__ == "__main__":
    main()
