import re
import html
import json

with open("audit_new.html", "r", encoding="utf-8") as f:
    text = f.read()

# Replace escaped characters
text = (
    text.replace(r'\"', '"')
    .replace(r'\n', '\n')
    .replace(r'\u003c', '<')
    .replace(r'\u003e', '>')
    .replace(r'\u0026', '&')
    .replace(r'\u0027', "'")
)

print("=== DIMENSIONS ===")
dim_matches = re.findall(r'\{"dim":"([^"]+)","name":"([^"]+)","score":"([^"]+)","status":"([^"]+)","keyFinding":"([^"]+)"\}', text)
for d in dim_matches:
    print(f"{d[0]}: {d[1]} | {d[2]} | {d[3]} | {d[4]}")

# Extract all findings
print("\n=== FINDINGS ===")
# Finding pattern: D[1-5]\.[1-9] with score
findings_pattern = re.findall(r'(D\d\.\d)\s+([^:(]+)\s*\((\d+/\d+),\s*([A-Za-z]+)\)', text)
for f in findings_pattern:
    print(f"{f[0]}: {f[1].strip()} | {f[2]} | {f[3]}")

# Also extract full finding text
output_findings = []
matches = list(re.finditer(r'(D\d\.\d)\s+([^:(]+)\s*\((\d+/\d+),\s*([A-Za-z]+)\)', text))
for i, m in enumerate(matches):
    start = m.start()
    end = matches[i+1].start() if i + 1 < len(matches) else len(text)
    chunk = text[start:end]
    output_findings.append(chunk)

with open("parsed_new_findings.txt", "w") as f:
    f.write("\n\n--------------------\n\n".join(output_findings))

# Action plan
pos_ap = text.find("Quick wins")
if pos_ap != -1:
    with open("parsed_new_action_plan.txt", "w") as f:
        f.write(text[pos_ap:])
    print("\nAction plan found and saved to parsed_new_action_plan.txt")
else:
    print("\nNo 'Quick wins' found in text")
