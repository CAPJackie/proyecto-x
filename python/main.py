import re
import urllib.request
import xml.etree.ElementTree as ET

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://127.0.0.1:3001"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

TRENDS_RSS_URL = "https://trends.google.com/trending/rss?geo=CO"
HT_NS = "https://trends.google.com/trending/rss"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/125.0.0.0 Safari/537.36"
)


def _parse_traffic(raw: str) -> float:
    if not raw:
        return 0.0
    m = re.match(r"\s*([\d.]+)\s*([KM]?)", raw, re.IGNORECASE)
    if not m:
        return 0.0
    n = float(m.group(1))
    suffix = m.group(2).upper()
    if suffix == "K":
        n *= 1_000
    elif suffix == "M":
        n *= 1_000_000
    return n


@app.get("/trends")
def get_trends():
    try:
        req = urllib.request.Request(TRENDS_RSS_URL, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=15) as resp:
            xml_bytes = resp.read()

        root = ET.fromstring(xml_bytes)
        items = root.findall(".//item")

        results = []
        for item in items[:10]:
            title_el = item.find("title")
            traffic_el = item.find(f"{{{HT_NS}}}approx_traffic")
            if title_el is None or not title_el.text:
                continue
            keyword = title_el.text.strip()
            raw_traffic = traffic_el.text if traffic_el is not None else ""
            results.append({"keyword": keyword, "score": _parse_traffic(raw_traffic)})

        results.sort(key=lambda x: x["score"], reverse=True)
        return {"trends": results}

    except Exception as e:
        return {"error": str(e), "trends": []}


@app.get("/health")
def health():
    return {"status": "ok"}
