"""Regenerates docs/architecture.drawio to mirror docs/architecture.svg (v2 lanes/geometry)."""
BOXES = [
    ("client1","Camera capture",40,64,190,66),("client2","Review and correct",40,170,190,66),
    ("client3","Voice log (BM / EN)",40,276,190,66),("client4","Weekly summary",40,382,190,66),
    ("api1","POST /api/analyze - job",300,64,210,60),("api2","async worker - pipeline",300,158,210,118),
    ("api3","POST /api/voice",300,310,210,56),("api4","GET /api/weekly",300,400,210,60),
    ("sam","SAM 3.1 - segmentation",580,64,300,66),("spark","Muse Spark 1.3 - ORCHESTRATOR",580,152,300,70),
    ("sub1","food-ID subagent",580,240,92,54),("sub2","citations subagent",684,240,92,54),("sub3","notes BM/EN subagent",788,240,92,54),
    ("voice","Muse Voice Transcribe",580,316,300,58),("fw","Muse Spark Open - Fireworks",580,396,300,58),
    ("eng","Nutrient engine - deterministic",950,64,250,76),("db","SEA food DB - 20 dishes",950,168,250,84),
    ("guard","Guardrail - advice-detector",950,280,250,66),("supa","Supabase - Postgres RLS Storage",950,374,250,76),
    ("eval","Eval harness - GH Actions",950,478,250,56),
]
EDGES = [("client1","api1","photo"),("api1","api2","job"),("api2","sam","crops"),("sam","spark","masks"),
    ("spark","sub1","fan-out"),("sub3","eng","dish names"),("eng","db","lookup"),("db","guard","notes check"),
    ("client3","api3","audio"),("api3","voice","transcript"),("voice","fw","lane"),("api4","supa","persist"),("eval","supa","benchmark")]
cells = []
for bid,label,x,y,w,h in BOXES:
    cells.append(f'<mxCell id="{bid}" value="{label}" style="rounded=1;whiteSpace=wrap;html=1;arcSize=14;fillColor=#101827;strokeColor=#F97316;fontColor=#f0f6fc;fontSize=11;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
for i,(s,t,lbl) in enumerate(EDGES):
    cells.append(f'<mxCell id="e{i}" value="{lbl}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeColor=#F97316;fontColor=#FDBA74;fontSize=9;" edge="1" parent="1" source="{s}" target="{t}"><mxGeometry relative="1" as="geometry"/></mxCell>')
xml = ('<mxfile host="app.diagrams.net"><diagram id="renal-arch" name="Architecture">'
    '<mxGraphModel dx="1200" dy="700" grid="1" page="1" pageWidth="1240" pageHeight="640">'
    f'<root><mxCell id="0"/><mxCell id="1" parent="0"/>{"".join(cells)}</root></mxGraphModel></diagram></mxfile>')
open('docs/architecture.drawio','w').write(xml)
print('drawio regenerated to match svg v2')
