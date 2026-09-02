#!/usr/bin/env python3
"""Fetch Google Scholar citation metrics and write scholar-metrics.json.

Google Scholar has no public API, so this scrapes the public profile HTML.
If Scholar blocks the request, the existing JSON is left unchanged.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path

USER_ID = "AJjgcfsAAAAJ"
OUT = Path(__file__).resolve().parent.parent / "scholar-metrics.json"
URL = f"https://scholar.google.com/citations?user={USER_ID}&hl=en"


def fetch_html(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (compatible; BrooksBenardSiteBot/1.0; "
                "+https://brooksbenard.github.io)"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_metrics(html: str) -> dict:
    years = [int(y) for y in re.findall(r'class="gsc_g_t"[^>]*>(\d{4})', html)]
    counts = [int(v) for v in re.findall(r'class="gsc_g_al"[^>]*>(\d+)', html)]
    stats = [int(v) for v in re.findall(r'class="gsc_rsb_std"[^>]*>(\d+)', html)]

    if len(years) < 2 or len(counts) < 2 or len(stats) < 2:
        raise ValueError(
            f"Unexpected Scholar HTML shape "
            f"(years={len(years)}, counts={len(counts)}, stats={len(stats)})"
        )

    n = min(len(years), len(counts))
    return {
        "user": USER_ID,
        "updated": date.today().isoformat(),
        "citations": stats[0],
        "h_index": stats[2] if len(stats) > 2 else stats[1],
        "i10_index": stats[4] if len(stats) > 4 else None,
        "years": years[:n],
        "counts": counts[:n],
    }


def main() -> int:
    try:
        html = fetch_html(URL)
        data = parse_metrics(html)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError) as exc:
        print(f"Scholar metrics update skipped: {exc}", file=sys.stderr)
        return 0

    previous = {}
    if OUT.exists():
        try:
            previous = json.loads(OUT.read_text())
        except json.JSONDecodeError:
            previous = {}

    comparable_keys = ("citations", "h_index", "years", "counts")
    if all(previous.get(k) == data.get(k) for k in comparable_keys):
        print("Scholar metrics unchanged.")
        return 0

    OUT.write_text(json.dumps(data, indent=2) + "\n")
    print(
        f"Updated {OUT.name}: citations={data['citations']} "
        f"h_index={data['h_index']} years={data['years']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
