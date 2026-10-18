import re
import html
import json

with open("audit_full.html", "r", encoding="utf-8") as f:
    raw = f.read()

# Replace escaped characters
cleaned = (
    raw.replace(r'\"', '"')
    .replace(r'\n', '\n')
    .replace(r'\u003c', '<')
    .replace(r'\u003e', '>')
    .replace(r'\u0026', '&')
    .replace('&amp;', '&')
    .replace('&quot;', '"')
    .replace('&#39;', "'")
    .replace(r"\'", "'")
)

with open("audit_cleaned.txt", "w", encoding="utf-8") as out:
    out.write(cleaned)

print("Saved audit_cleaned.txt length:", len(cleaned))

# Let's search for findings D1.1, D1.2, etc.
# Check where D1.1 appears and print context
matches = re.finditer(r'(D\d\.\d)', cleaned)
finding_positions = {}
for m in matches:
    code = m.group(1)
    if code not in finding_positions:
        finding_positions[code] = []
    finding_positions[code].append(m.start())

print("Found codes:", sorted(finding_positions.keys()))
