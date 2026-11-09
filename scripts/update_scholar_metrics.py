#!/usr/bin/env python3
"""Fetch Google Scholar citation metrics and write scholar-metrics.json.

Google Scholar has no public API and often blocks GitHub Actions IPs, so this
tries a direct fetch first, then free HTTP proxies. Exits non-zero if every
attempt fails so the workflow surfaces the problem instead of staying stuck.
"""

from __future__ import annotations

import json
import random
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path

USER_ID = "AJjgcfsAAAAJ"
OUT = Path(__file__).resolve().parent.parent / "scholar-metrics.json"
URL = f"https://scholar.google.com/citations?user={USER_ID}&hl=en"
DIRECT_ATTEMPTS = 3
PROXY_ATTEMPTS = 12
REQUEST_TIMEOUT = 20

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

PROXY_SOURCES = (
    "https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=5000&country=all&ssl=all&anonymity=all",
    "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt",
    "https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list-raw.txt",
)


def github_notice(level: str, message: str) -> None:
    """Emit a GitHub Actions annotation when running in CI."""
    safe = message.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
    print(f"::{level}::{safe}", flush=True)


def fetch_html(url: str, proxy: str | None = None) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    if proxy:
        handler = urllib.request.ProxyHandler(
            {"http": f"http://{proxy}", "https": f"http://{proxy}"}
        )
        opener = urllib.request.build_opener(handler)
        with opener.open(req, timeout=REQUEST_TIMEOUT) as resp:
            return resp.read().decode("utf-8", errors="replace")
    with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
        return resp.read().decode("utf-8", errors="replace")


def list_free_proxies() -> list[str]:
    proxies: list[str] = []
    for source in PROXY_SOURCES:
        try:
            req = urllib.request.Request(
                source,
                headers={"User-Agent": HEADERS["User-Agent"]},
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                text = resp.read().decode("utf-8", errors="replace")
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as exc:
            print(f"Proxy list fetch failed ({source}): {exc}", file=sys.stderr)
            continue
        for line in text.splitlines():
            line = line.strip()
            if re.fullmatch(r"\d{1,3}(?:\.\d{1,3}){3}:\d{2,5}", line):
                proxies.append(line)
    # Prefer a shuffled unique list so repeated CI runs don't hammer the same IPs.
    unique = list(dict.fromkeys(proxies))
    random.shuffle(unique)
    print(f"Loaded {len(unique)} free proxies from {len(PROXY_SOURCES)} sources.")
    return unique


def parse_metrics(html: str) -> dict:
    lowered = html.lower()
    if "sorry/index" in html or "captcha" in lowered or "unusual traffic" in lowered:
        raise ValueError("Scholar returned a captcha / block page")

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


def fetch_metrics() -> dict:
    errors: list[str] = []

    for attempt in range(1, DIRECT_ATTEMPTS + 1):
        try:
            print(f"Direct fetch attempt {attempt}/{DIRECT_ATTEMPTS}...")
            return parse_metrics(fetch_html(URL))
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError) as exc:
            errors.append(f"direct#{attempt}: {exc}")
            print(errors[-1], file=sys.stderr)
            if attempt < DIRECT_ATTEMPTS:
                time.sleep(2 * attempt)

    proxies = list_free_proxies()
    if not proxies:
        raise RuntimeError("Direct Scholar fetch failed and no free proxies were available")

    for attempt, proxy in enumerate(proxies[:PROXY_ATTEMPTS], start=1):
        try:
            print(f"Proxy fetch attempt {attempt}/{PROXY_ATTEMPTS} via {proxy}...")
            return parse_metrics(fetch_html(URL, proxy=proxy))
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError, OSError) as exc:
            errors.append(f"proxy#{attempt}({proxy}): {exc}")
            print(errors[-1], file=sys.stderr)

    raise RuntimeError(
        "All Scholar fetch attempts failed. "
        + " | ".join(errors[-5:])
    )


def main() -> int:
    try:
        data = fetch_metrics()
    except Exception as exc:  # noqa: BLE001 - surface any fetch failure to CI
        github_notice("error", f"Scholar metrics update failed: {exc}")
        print(f"Scholar metrics update failed: {exc}", file=sys.stderr)
        return 1

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
    msg = (
        f"Updated {OUT.name}: citations={data['citations']} "
        f"h_index={data['h_index']} years={data['years']}"
    )
    print(msg)
    github_notice("notice", msg)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
