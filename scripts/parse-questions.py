"""Converte scripts/perguntas.txt em src/data/questions.json (tipado via src/data/questions.ts)."""
import json, re, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
lines = (root / "scripts" / "perguntas.txt").read_text(encoding="utf-8").splitlines()

lesson_re = re.compile(r"LIÇÃO\s+(\d+):\s*(.+)$")
q_re = re.compile(r"^\*\*(\d+)\.\s*(.+?)\*\*\s*$")
opt_re = re.compile(r"^([a-d])\)\s*(.+)$")
ans_re = re.compile(r"^✅\s*\*\*Resposta:\s*([a-d])\.\*\*\s*(.+)$")

questions, lesson, cur = [], None, None
for raw in lines:
    line = raw.strip()
    if (m := lesson_re.search(line)):
        lesson = {"number": int(m.group(1)), "title": m.group(2).strip()}
    elif (m := q_re.match(line)):
        cur = {"id": int(m.group(1)), "lesson": lesson["number"], "lessonTitle": lesson["title"],
               "prompt": m.group(2).strip(), "options": []}
    elif (m := opt_re.match(line)) and cur:
        cur["options"].append({"key": m.group(1), "text": m.group(2).strip()})
    elif (m := ans_re.match(line)) and cur:
        cur["answer"] = m.group(1)
        cur["explanation"] = m.group(2).strip()
        assert len(cur["options"]) == 4, cur
        questions.append(cur); cur = None

assert len(questions) == 200, len(questions)
assert [q["id"] for q in questions] == list(range(1, 201))
(root / "src" / "data" / "questions.json").write_text(json.dumps(questions, ensure_ascii=False, indent=1), encoding="utf-8")
print("ok", len(questions))
