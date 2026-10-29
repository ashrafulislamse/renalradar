#!/usr/bin/env python3
"""Generates docs/architecture.drawio (editable source) + docs/architecture.svg (README render)
from ONE layout spec — the two never diverge."""

# (id, label, x, y, w, h, style_key, subtitle)
BOXES = [
    ("client",  "Mobile PWA — Next.js\nCamera capture · Voice (MediaRecorder)\nBM / EN interface",            40,  60,  190, 84,  "client"),
    ("api",     "API layer — Vercel\nPOST /api/analyze (job)\nGET /api/analyze/:id (poll)\nPOST /api/voice · GET /api/weekly", 290, 52, 230, 100, "api"),
    ("sam",     "SAM 3.1\nplate → dish masks → crops",                                                        580, 40,  220, 52,  "ai"),
    ("spark",   "Muse Spark 1.3 — ORCHESTRATOR\nfood ID (visual CoT) vs SEA DB\nexplanations · citations (BM/EN)", 580, 122, 220, 76, "ai"),
    ("guard",   "Guardrail — advice-detector\nrewrite or refuse",                                             580, 228, 220, 52,  "guard"),
    ("nutrient","Nutrient engine — deterministic TS\nDB values × portion · ZERO LLM",                          850, 46,  230, 56,  "core"),
    ("fooddb",  "SEA food DB — 20 verified dishes\nper-serving values · sources cited\nunknown stays unknown", 850, 132, 230, 68,  "core"),
    ("voice",   "Muse Voice Transcribe\nBM/EN meal voice-logs",                                               850, 228, 230, 52,  "ai"),
    ("supa",    "Supabase — Postgres (meals, items,\ncorrections, summaries) · RLS · Storage",                290, 260, 230, 68,  "store"),
    ("eval",    "Eval harness — GitHub Actions\n25-meal benchmark → accuracy report",                         40,  260, 190, 68,  "store"),
    ("fw",      "Fireworks — Muse Spark Open\nopen-weights lane ($10K flag)",                                 580, 310, 220, 52,  "ai"),
    ("banner",  "COMPLIANCE: documentation tool — informational notes only · every summary ends with dietitian questions · never medical advice", 40, 396, 1040, 40, "banner"),
]

EDGES = [
    ("client", "api",    "photo"),
    ("api",    "sam",    "job"),
    ("sam",    "spark",  "crops"),
    ("spark",  "nutrient","dishes"),
    ("nutrient","fooddb","lookup"),
    ("fooddb", "guard",  "values+notes"),
    ("guard",  "api",    "verified output"),
    ("api",    "supa",   "persist"),
    ("eval",   "supa",   "benchmark"),
    ("client", "voice",  "voice log"),
    ("voice",  "spark",  "transcript"),
    ("fw",     "spark",  "open-weights lane"),
]

STYLES = {
    "client": ("#0d1424", "#F97316", "#f0f6fc"),
    "api":    ("#0d1424", "#FDBA74", "#f0f6fc"),
    "ai":     ("#101827", "#F97316", "#f0f6fc"),
    "core":   ("#0f1a12", "#2ea44f", "#e6f2ea"),
    "guard":  ("#1a0f0d", "#f85149", "#ffebe9"),
    "store":  ("#0d1117", "#8b949e", "#e6edf3"),
    "banner": ("#1a0f0d", "#F97316", "#FDBA74"),
}

def drawio():
    cells = []
    for i, (bid, label, x, y, w, h, sk, *_) in enumerate(BOXES):
        fill, stroke, font = STYLES[sk]
        cells.append(f'<mxCell id="{bid}" value="{label}" style="rounded=1;whiteSpace=wrap;html=1;arcSize=12;fillColor={fill};strokeColor={stroke};fontColor={font};fontSize=11;fontFamily=Helvetica;spacing=6;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
    for i, (s, t, lbl) in enumerate(EDGES):
        cells.append(f'<mxCell id="e{i}" value="{lbl}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeColor=#F97316;fontColor=#FDBA74;fontSize=9;labelBackgroundColor=#0d1117;" edge="1" parent="1" source="{s}" target="{t}"><mxGeometry relative="1" as="geometry"/></mxCell>')
    return ('<mxfile host="app.diagrams.net" modified="2026-10-29" agent="rena" version="24">'
            '<diagram id="renal-arch" name="Architecture">'
            '<mxGraphModel dx="1200" dy="700" grid="1" gridSize="10" page="1" pageWidth="1120" pageHeight="470" math="0" shadow="0">'
            f'<root><mxCell id="0"/><mxCell id="1" parent="0"/>{"".join(cells)}</root>'
            '</mxGraphModel></diagram></mxfile>')

def svg():
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="470" viewBox="0 0 1120 470" font-family="Segoe UI,Helvetica,sans-serif">',
             '<rect width="1120" height="470" fill="#0a0f1a" rx="12"/>']
    for bid, label, x, y, w, h, sk, *_ in BOXES:
        fill, stroke, font = STYLES[sk]
        parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{fill}" stroke="{stroke}" stroke-opacity="0.8"/>')
        lines = label.split("\n")
        for li, line in enumerate(lines):
            size = 12 if li == 0 else 10
            weight = 'font-weight="600"' if li == 0 else ''
            color = font if li == 0 else (font if sk in ("core", "banner") else "#c9d1d9")
            op = ' opacity="0.85"' if li else ''
            parts.append(f'<text x="{x+12}" y="{y+20+li*15}" font-size="{size}" {weight} fill="{color}"{op}>{line.replace("&","&amp;")}</text>')
    def anchor(bid):
        b = next(x for x in BOXES if x[0] == bid)
        return (b[2], b[3], b[4], b[5])
    for s, t, lbl in EDGES:
        sx, sy, sw, sh = anchor(s); tx, ty, tw, th = anchor(t)
        x1, y1 = sx + sw, sy + sh/2
        x2, y2 = tx, ty + th/2
        if abs(y1 - y2) < 6: path = f'M{x1} {y1} L{x2} {y2}'
        else: path = f'M{x1} {y1} C{x1+40} {y1} {x2-40} {y2} {x2} {y2}'
        parts.append(f'<path d="{path}" fill="none" stroke="#F97316" stroke-opacity="0.65"/>')
        parts.append(f'<circle cx="{x2}" cy="{y2}" r="3" fill="#F97316"/>')
        parts.append(f'<text x="{(x1+x2)/2}" y="{(y1+y2)/2 - 6}" font-size="9" fill="#FDBA74" text-anchor="middle" opacity="0.9">{lbl}</text>')
    parts.append('</svg>')
    return "".join(parts)

import os
os.makedirs("docs", exist_ok=True)
open("docs/architecture.drawio", "w").write(drawio())
open("docs/architecture.svg", "w").write(svg())
print("drawio + svg generated")
