# RenalRadar — COMPLIANCE.md

## What this project IS
A camera-and-voice **food-documentation companion** for people managing chronic kidney
disease (CKD) in Southeast Asia. It helps users:
1. **Photograph a meal** → dishes are segmented (SAM 3.1) and identified (Muse Spark)
2. **See estimated nutrients** (sodium, potassium, phosphorus, protein, fluid) — computed by
   deterministic code from **generic, published, cited** per-100g/serving values
3. **Read plain-language information** about why those nutrients matter in renal diets —
   hedged, sourced, generic (BM/EN)
4. **Log meals by voice** (Muse Voice Transcribe) and review history
5. **Generate a weekly summary** that ends with **questions to discuss with their dietitian**

## What this project IS NOT (hard rules — enforced by a Guardrail pass in code)
- ❌ It does NOT diagnose any condition
- ❌ It does NOT prescribe or recommend diets, foods, medicines, or treatment
- ❌ It does NOT use personal health targets (no "your limit is X")
- ❌ It does NOT score severity or predict outcomes
- ❌ It never replaces professional medical advice — every screen carries the disclaimer
- Every weekly summary ends with **questions for the user's dietitian**, never instructions

## Data provenance
- Nutrient values: public sources only (USDA FoodData Central, Malaysian Food Composition
  Database, NKF patient-education materials) — each dish entry carries its source
- Values are per-100g or per-typical-serving, clearly marked; portion estimates are
  user-adjustable; unknown values stay marked **unknown** — never invented
- No personal health data leaves the user's control beyond their own log storage

## Alignment with hackathon rules
- Anti-project list: NOT a medical-advice generator (informational tracking + education only)
- New work: this repository is built Oct 27–Nov 4, 2026 for the Meta Global AI Developer
  Hackathon — see commit history; prior art is clearly marked
- Meta models: SAM 3.1 (segmentation), Muse Spark (identification + explanations),
  Muse Voice Transcribe (logging), Muse Spark Open (open-weights lane)
