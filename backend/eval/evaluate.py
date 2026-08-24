"""
tagging evaluation (F1 + IoU/Jaccard)

compares model predictions against ground-truth labels for the multi-label
tagger and then:
  * single-label fields (category, formality, season, pattern):
      accuracy, macro-F1, weighted-F1, and a per-class breakdown
  * multi-label field (occasion):
      IoU / Jaccard (sample-averaged) + micro-F1 + macro-F1

running:
  python evaluate.py --truth ground_truth.json --pred predictions.json
  python evaluate.py --demo # runs on fabricated data so you can see the output shape

Records are matched across the two files by "garment_id".
"""

import argparse
import json
import sys
from collections import defaultdict

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    jaccard_score,
)
from sklearn.preprocessing import MultiLabelBinarizer

SINGLE_LABEL_FIELDS = ["category", "formality", "season", "pattern"]
MULTI_LABEL_FIELDS = ["occasion"]


def _load(path):
    with open(path) as fh:
        return json.load(fh)


def _index(records):
    return {r["garment_id"]: r for r in records}


def _aligned_pairs(truth, pred):
    """Return records present in BOTH files, aligned by garment_id."""
    t_idx, p_idx = _index(truth), _index(pred)
    common = [gid for gid in t_idx if gid in p_idx]
    missing = [gid for gid in t_idx if gid not in p_idx]
    if missing:
        print(f"  [warn] {len(missing)} truth ids had no prediction (skipped)\n")
    return [(t_idx[gid], p_idx[gid]) for gid in common]


def eval_single_label(pairs, field):
    y_true = [str(t.get(field, "")).lower() for t, _ in pairs]
    y_pred = [str(p.get(field, "")).lower() for _, p in pairs]

    acc = accuracy_score(y_true, y_pred)
    macro = f1_score(y_true, y_pred, average="macro", zero_division=0)
    weighted = f1_score(y_true, y_pred, average="weighted", zero_division=0)

    print(f"── {field} (single-label, n={len(y_true)}) ──")
    print(f"   accuracy    : {acc:.3f}")
    print(f"   macro-F1    : {macro:.3f}")
    print(f"   weighted-F1 : {weighted:.3f}")
    print("   per-class:")
    report = classification_report(y_true, y_pred, zero_division=0, digits=3)
    print("   " + report.replace("\n", "\n   "))
    print()
    return {"accuracy": acc, "macro_f1": macro, "weighted_f1": weighted}


def eval_multi_label(pairs, field):
    y_true = [_as_list(t.get(field)) for t, _ in pairs]
    y_pred = [_as_list(p.get(field)) for _, p in pairs]

    mlb = MultiLabelBinarizer()
    mlb.fit(y_true + y_pred)
    Y_true = mlb.transform(y_true)
    Y_pred = mlb.transform(y_pred)

    # Jaccard averaged over samples == mean IoU of predicted vs true tag sets
    iou = jaccard_score(Y_true, Y_pred, average="samples", zero_division=0)
    micro = f1_score(Y_true, Y_pred, average="micro", zero_division=0)
    macro = f1_score(Y_true, Y_pred, average="macro", zero_division=0)

    print(f"── {field} (multi-label, n={len(y_true)}) ──")
    print(f"   IoU / Jaccard (per-sample mean) : {iou:.3f}")
    print(f"   micro-F1                        : {micro:.3f}")
    print(f"   macro-F1                        : {macro:.3f}")
    print(f"   label set                       : {list(mlb.classes_)}")
    print()
    return {"iou_jaccard": iou, "micro_f1": micro, "macro_f1": macro}


def _as_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v).lower() for v in value]
    return [str(value).lower()]


def _demo_data():
    truth = [
        {"garment_id": "1", "category": "kurti", "formality": "formal",
         "season": "summer", "pattern": "floral", "occasion": ["party", "work"]},
        {"garment_id": "2", "category": "daura suruwal", "formality": "formal",
         "season": "winter", "pattern": "solid", "occasion": ["formal event"]},
        {"garment_id": "3", "category": "jeans", "formality": "casual",
         "season": "all-season", "pattern": "solid", "occasion": ["everyday wear"]},
        {"garment_id": "4", "category": "haku patasi", "formality": "formal",
         "season": "winter", "pattern": "solid", "occasion": ["formal event", "party"]},
    ]
    pred = [
        {"garment_id": "1", "category": "kurti", "formality": "formal",
         "season": "summer", "pattern": "floral", "occasion": ["party"]},
        {"garment_id": "2", "category": "daura suruwal", "formality": "formal",
         "season": "winter", "pattern": "solid", "occasion": ["formal event"]},
        {"garment_id": "3", "category": "trousers", "formality": "casual",
         "season": "summer", "pattern": "solid", "occasion": ["everyday wear"]},
        {"garment_id": "4", "category": "saree", "formality": "formal",
         "season": "winter", "pattern": "solid", "occasion": ["formal event", "party"]},
    ]
    return truth, pred


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--truth", help="ground-truth JSON")
    ap.add_argument("--pred", help="predictions JSON")
    ap.add_argument("--demo", action="store_true", help="run on fabricated data")
    ap.add_argument("--out", default="metrics_report.json", help="where to save results")
    args = ap.parse_args()

    if args.demo:
        truth, pred = _demo_data()
    elif args.truth and args.pred:
        truth, pred = _load(args.truth), _load(args.pred)
    else:
        ap.error("give --truth and --pred, or use --demo")

    pairs = _aligned_pairs(truth, pred)
    if not pairs:
        print("No overlapping garment_ids between the two files.")
        sys.exit(1)

    print(f"\nEvaluating {len(pairs)} garments\n")
    results = {}
    for field in SINGLE_LABEL_FIELDS:
        results[field] = eval_single_label(pairs, field)
    for field in MULTI_LABEL_FIELDS:
        results[field] = eval_multi_label(pairs, field)

    with open(args.out, "w") as fh:
        json.dump(results, fh, indent=2)
    print(f"Saved summary → {args.out}")


if __name__ == "__main__":
    main()