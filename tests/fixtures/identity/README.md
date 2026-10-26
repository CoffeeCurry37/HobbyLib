# Matching labels v1

`cases.jsonl` contains synthetic, non-personal observations. Each line declares a stable case ID, independent series/group, source, category, split (`tuning` or `holdout`), `labelKind`, candidate Item patches, an input patch and expected `{status,targetItemId}`. Defaults are in `scripts/identity-evaluate.mjs`; unknowns remain empty. URLs use synthetic identifiers and are never fetched.

Run `node scripts/identity-evaluate.mjs [labels.jsonl] [report.json]`. The evaluator rejects series/listing leakage across splits and reports precision, recall, review rate, hard-conflict matches, source/category sample counts and Wilson intervals. Synthetic holdout is a regression partition, **not independently annotated real-world validation**. No production accuracy claim or automatic rollout threshold follows from it. Rule changes must not tune against a future real holdout.

For real labels use `labelKind: "human-reviewed"`, keep all observations of a series and listing in one split, remove personal fields, and retain source evidence and annotator/adjudication receipts in a separate private review process. Missing labels are not negatives. Conflicting ISBN/JAN, media, platform, cards and components must be annotated separately. Reports with mixed label kinds must be separated before making quality claims.
