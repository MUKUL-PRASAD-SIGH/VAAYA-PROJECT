"""
Lightweight AI layer for Content Studio:
- enhancement (tighten prose, create summary)
- theme/tag extraction (simple heuristics)
- safety / plagiarism heuristics placeholder
You can later swap internals for a hosted LLM or your Gemini service.
"""

def enhance_and_moderate(title, body, tags=None, media=None):
    tags = tags or []
    text = body.strip()

    # naive “enhancement”: trim spaces + ensure one-line summary
    summary = (text[:160] + "…") if len(text) > 160 else text

    # themes (toy logic; replace with real NER/LLM)
    themes = []
    lower = (title + " " + body).lower()
    if any(w in lower for w in ["myth","legend","curse","folklore","temple","heritage"]):
        themes.append("heritage")
    if any(w in lower for w in ["weaver","craft","handloom","artisan","textile"]):
        themes.append("craft")
    if any(w in lower for w in ["festival","dance","song","ritual"]):
        themes.append("festival")

    # safety flags (basic heuristics)
    flags = {"safety":"pass", "plagiarism":"low"}
    if any(bad in lower for bad in ["hate","violence","abuse"]):
        flags["safety"]="warn"

    enhanced_body = text  # keep as-is for now; you can run LLM rewrite later
    return {
        "summary": summary,
        "enhanced_body": enhanced_body,
        "themes": list(set(themes + (tags or []))),
        "flags": flags
    }
