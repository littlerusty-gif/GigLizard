import re

with open("/tmp/full_audit_readable.txt") as f:
    text = f.read()

# Pattern for findings
pattern = r"(D\d+\.\d+)\s+([^(]+)\s*\((\d+)/(\d+),\s*([^)]+)\):\s*(.*?)(?=(?:<p><strong>D\d+\.\d+|<h3>|<h2>|<div|$))"
matches = re.findall(pattern, text, re.DOTALL)

print(f"Total findings parsed: {len(matches)}\n")
with open("/tmp/parsed_findings.txt", "w") as out:
    for code, name, score, max_score, status, body in matches:
        clean_body = re.sub(r"<[^>]+>", "", body).strip()
        clean_body = clean_body.replace("â€œ", "\"").replace("â€\x9d", "\"").replace("â€\x94", "—").replace("â€\x99", "'")
        out.write(f"[{code}] {name.strip()} ({score}/{max_score}, {status.strip()})\n")
        out.write(f"Insights: {clean_body}\n\n")

# Pattern for action plan
print("Extracting Action Plan...")
plan_match = re.search(r"<h2>Action plan</h2>(.*?)(?=<footer|<div class=\"border-t\"|$)", text, re.DOTALL)
if plan_match:
    plan_text = plan_match.group(1)
    # clean tags but keep headings
    with open("/tmp/parsed_action_plan.txt", "w") as out:
        out.write(plan_text)
    print("Action plan saved to /tmp/parsed_action_plan.txt")
else:
    print("Action plan not found with direct regex, searching...")
    idx = text.find("Quick wins")
    if idx != -1:
        with open("/tmp/parsed_action_plan.txt", "w") as out:
            out.write(text[idx-50:idx+15000])
        print("Action plan snippet saved")
