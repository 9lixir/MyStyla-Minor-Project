import argparse
import json
import statistics
import time
import urllib.error
import urllib.parse
import urllib.request


DEFAULT_WEATHER = {
    "temperature_c": 22,
    "feels_like_c": 22,
    "humidity_percent": 65,
    "precipitation_mm": 0,
    "wind_kph": 8,
    "condition": "clear",
    "style_profile": "mild",
}


def percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    index = min(len(values) - 1, round((pct / 100) * (len(values) - 1)))
    return values[index]


def request_json(method: str, url: str, payload: dict | None = None) -> tuple[int, bytes]:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read()
    except urllib.error.URLError as exc:
        return 0, str(exc).encode("utf-8")
    except TimeoutError as exc:
        return 0, str(exc).encode("utf-8")


def measure(endpoint: dict, runs: int, warmup: int) -> dict:
    durations = []
    errors = 0
    statuses: dict[int, int] = {}
    ok_statuses = set(endpoint.get("ok_statuses", []))

    for index in range(runs + warmup):
        started = time.perf_counter()
        status, _ = request_json(endpoint["method"], endpoint["url"], endpoint.get("payload"))
        elapsed_ms = (time.perf_counter() - started) * 1000

        if index < warmup:
            continue

        durations.append(elapsed_ms)
        statuses[status] = statuses.get(status, 0) + 1
        is_expected_status = status in ok_statuses if ok_statuses else 0 < status < 400
        if not is_expected_status:
            errors += 1

    durations.sort()
    return {
        "name": endpoint["name"],
        "runs": runs,
        "min_ms": round(min(durations), 2),
        "p50_ms": round(statistics.median(durations), 2),
        "p95_ms": round(percentile(durations, 95), 2),
        "p99_ms": round(percentile(durations, 99), 2),
        "max_ms": round(max(durations), 2),
        "error_rate": round(errors / runs, 3),
        "statuses": statuses,
    }


def with_query(url: str, params: dict[str, str]) -> str:
    return f"{url}?{urllib.parse.urlencode(params)}"


def build_endpoints(
    base_url: str,
    user_id: str,
    occasion: str,
    top_k: int,
    build_around_garment_id: str,
) -> list[dict]:
    base_url = base_url.rstrip("/")
    zero_embedding = [0.0] * 512
    accessory_payload = {
        "formality": "Formal",
        "garments": [
            {"dominant_colors": [{"hex": "#FFFFFF"}]},
            {"dominant_colors": [{"hex": "#111111"}]},
        ],
    }

    return [
        {"name": "root", "method": "GET", "url": f"{base_url}/"},
        {"name": "outfit_health", "method": "GET", "url": f"{base_url}/outfits/health"},
        {"name": "scanning_garments", "method": "GET", "url": f"{base_url}/scanning/garments"},
        {
            "name": "scanning_garments_with_tags",
            "method": "GET",
            "url": f"{base_url}/scanning/garments-with-tags",
        },
        {
            "name": "scanning_search_zero_vector",
            "method": "POST",
            "url": f"{base_url}/scanning/search",
            "payload": {"embedding": zero_embedding, "top_k": 1},
        },
        {
            "name": "weather_current_kathmandu",
            "method": "GET",
            "url": f"{base_url}/weather/current?latitude=27.7172&longitude=85.3240",
        },
        {
            "name": "outfits_generate_no_weather",
            "method": "POST",
            "url": f"{base_url}/outfits/generate",
            "payload": {"user_id": user_id, "occasion": occasion, "top_k": top_k, "weather": None},
        },
        {
            "name": "outfits_generate_with_weather",
            "method": "POST",
            "url": f"{base_url}/outfits/generate",
            "payload": {"user_id": user_id, "occasion": occasion, "top_k": top_k, "weather": DEFAULT_WEATHER},
        },
        {
            "name": "outfits_build_around",
            "method": "POST",
            "url": f"{base_url}/outfits/build-around",
            "payload": {
                "user_id": user_id,
                "garment_id": build_around_garment_id,
                "occasion": occasion,
                "top_k": top_k,
                "weather": DEFAULT_WEATHER,
            },
            # 404 is expected when the benchmark garment id is not present in local data.
            "ok_statuses": [200, 404],
        },
        {
            "name": "recommend_accessories",
            "method": "POST",
            "url": f"{base_url}/recommend/accessories",
            "payload": accessory_payload,
        },
        {
            "name": "classification_correct_tag_noop",
            "method": "POST",
            "url": with_query(
                f"{base_url}/classification/garments/{build_around_garment_id}/correct-tag",
                {
                    "field": "category",
                    "predicted": "kurti",
                    "corrected": "kurti",
                },
            ),
        },
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description="Measure MyStyla backend latency NFRs.")
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument("--runs", type=int, default=30)
    parser.add_argument("--warmup", type=int, default=3)
    parser.add_argument("--user-id", default="demo_user")
    parser.add_argument("--occasion", default="Office")
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--build-around-garment-id", default="demo_garment")
    parser.add_argument("--json", action="store_true", help="Print machine-readable JSON.")
    args = parser.parse_args()

    endpoints = build_endpoints(
        args.base_url,
        args.user_id,
        args.occasion,
        args.top_k,
        args.build_around_garment_id,
    )
    results = [measure(endpoint, args.runs, args.warmup) for endpoint in endpoints]

    if args.json:
        print(json.dumps(results, indent=2))
        return

    print(f"MyStyla latency benchmark: {args.base_url} ({args.runs} measured runs)")
    print("endpoint                       p50      p95      p99      max     err")
    print("-" * 72)
    for result in results:
        print(
            f"{result['name']:<30}"
            f"{result['p50_ms']:>7.2f}"
            f"{result['p95_ms']:>9.2f}"
            f"{result['p99_ms']:>9.2f}"
            f"{result['max_ms']:>9.2f}"
            f"{result['error_rate']:>8.1%}"
        )


if __name__ == "__main__":
    main()
