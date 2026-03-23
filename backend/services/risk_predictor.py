"""
Anya — Risk Predictor
Reads real NFHS-5 data from districts.json and converts to API response format.
No ML needed — data is already sourced from verified NFHS-5 (2019-21) district factsheets.
"""
import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

def _load_districts():
    with open(os.path.join(DATA_DIR, "districts.json")) as f:
        return json.load(f)

def _level(pct):
    if pct >= 65: return "critical"
    if pct >= 50: return "high"
    if pct >= 35: return "moderate"
    return "low"

def _overall_risk(d):
    mn = d["micronutrient_profile"]
    scores = [v["deficiency_pct"] for v in mn.values()]
    return round(sum(scores) / len(scores), 1)

def get_all_district_summaries():
    districts = _load_districts()
    summaries = []
    for d in districts:
        mn = d["micronutrient_profile"]
        overall = _overall_risk(d)
        summaries.append({
            "id": d["id"],
            "name": d["name"],
            "state": d["state"],
            "lat": d["lat"],
            "lng": d["lng"],
            "population": d["population"],
            "tribal": d["tribal"],
            "aspirational_district": d["aspirational_district"],
            "rank": d["rank"],
            "overall_risk": overall,
            "overall_level": _level(overall),
            "stunting_pct": d["nfhs5"]["stunting_pct"],
            "anemia_children_pct": d["nfhs5"]["anemia_children_pct"],
            "iron_risk": mn["iron"]["deficiency_pct"],
            "vitamin_a_risk": mn["vitamin_a"]["deficiency_pct"],
            "zinc_risk": mn["zinc"]["deficiency_pct"],
            "b12_risk": mn["b12"]["deficiency_pct"],
            "vitamin_d_risk": mn["vitamin_d"]["deficiency_pct"],
        })
    # Already sorted by rank
    return sorted(summaries, key=lambda x: x["rank"])


def predict_district(district_id: str):
    districts = _load_districts()
    d = next((x for x in districts if x["id"] == district_id), None)
    if not d:
        return None
    return format_prediction_response(d)

def format_prediction_response(d: dict):
    nfhs = d.get("nfhs5", {})
    mn = d.get("micronutrient_profile", {})
    overall = _overall_risk(d) if "overall_risk" not in d else d["overall_risk"]

    return {
        "district_id": d.get("id"),
        "district_name": d.get("name"),
        "state": d.get("state"),
        "population": d.get("population", 0),
        "tribal": d.get("tribal", False),
        "dominant_tribe": d.get("dominant_tribe"),
        "aspirational_district": d.get("aspirational_district", False),
        "rank": d.get("rank", 999),
        "data_source": d.get("source", "Unknown"),
        "prediction_horizon": "Based on NFHS-5 (2019-21) — current status",
        "overall_risk": overall,
        "overall_level": _level(overall) if "overall_level" not in d else d["overall_level"],

        "micronutrients": {
            nutrient: {
                "risk_pct": info.get("deficiency_pct", 0),
                "level": _level(info.get("deficiency_pct", 0)),
                "trend": info.get("trend", "stable"),
                "trend_delta": info.get("trend_delta", "0%"),
                "causes": info.get("primary_causes", []),
                "seasonal_peak": info.get("seasonal_peak", ""),
                "confidence": 0.92,
            }
            for nutrient, info in mn.items()
        },

        "district_context": {
            "stunting_pct": nfhs.get("stunting_pct", 0),
            "wasting_pct": nfhs.get("wasting_pct", 0),
            "underweight_pct": nfhs.get("underweight_pct", 0),
            "anemia_children_pct": nfhs.get("anemia_children_pct", 0),
            "anemia_women_pct": nfhs.get("anemia_women_pct", 0),
            "low_birth_weight_pct": nfhs.get("low_birth_weight_pct", 0),
            "child_mortality_per_1000": nfhs.get("child_mortality_per_1000", 0),
            "institutional_delivery_pct": nfhs.get("institutional_delivery_pct", 0),
            "pds_coverage": nfhs.get("pds_coverage_pct", 0),
            "open_defecation_pct": nfhs.get("open_defecation_pct", 0),
            "diet_diversity_score": nfhs.get("diet_diversity_score", 0),
            "vegetarian_pct": nfhs.get("vegetarian_pct", 0),
            "poverty_pct": nfhs.get("poverty_pct", 0),
            "female_literacy_pct": nfhs.get("female_literacy_pct", 0),
        },

        "context": d.get("context", {}),
    }
