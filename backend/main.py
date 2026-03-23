"""
Anya — India's Nutrition Copilot
FastAPI Backend — Main Application
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import json

from services.risk_predictor import predict_district, get_all_district_summaries
from services.fortification_optimizer import optimize_fortification
from services.meal_generator import generate_meals
from services.ai_district_analyzer import analyze_district_with_ai

# In-memory store for AI-generated districts (session-scoped)
ai_districts: dict = {}

app = FastAPI(
    title="Anya — India's Nutrition Copilot API",
    description="AI-powered nutrition prediction, fortification optimization, and culturally-aware meal planning for India",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ──────────────────────────────────────────────────────────────────

class FamilyMember(BaseModel):
    type: str  # infant_6_23m, child_2_5y, child_6_14y, woman, pregnant, lactating, man, elderly
    count: int = 1
    label: Optional[str] = None


class MealRequest(BaseModel):
    district: str = "nandurbar"
    cultural_group: str = "hindu_nonveg"
    family_members: List[FamilyMember] = [
        FamilyMember(type="pregnant", label="Mother"),
        FamilyMember(type="man", label="Father"),
        FamilyMember(type="infant_6_23m", label="Baby"),
        FamilyMember(type="elderly", label="Grandmother")
    ]
    monthly_budget_inr: int = 2500
    season: str = "monsoon"
    pds_access: bool = True
    local_market_items: Optional[List[str]] = None
    deficiency_profile: Optional[Dict[str, float]] = None


class AnalyzeDistrictRequest(BaseModel):
    district_name: str
    state_name: Optional[str] = ""


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "name": "Anya — India's Nutrition Copilot",
        "tagline": "Predict. Fortify. Nourish.",
        "version": "1.0.0",
        "endpoints": {
            "districts": "GET /api/districts",
            "predict": "GET /api/predict/{district_id}",
            "fortify": "GET /api/fortify/{district_id}",
            "meal_plan": "POST /api/meals/generate"
        }
    }


@app.get("/api/districts")
def list_districts():
    """
    Get all districts with risk summary scores.
    Returns districts sorted by overall risk (worst first).
    """
    summaries = get_all_district_summaries()
    return {
        "total": len(summaries),
        "districts": summaries,
        "metadata": {
            "data_source": "NFHS-5 (National Family Health Survey, 2019-21)",
            "model": "XGBoost + LSTM Ensemble Prediction",
            "last_updated": "2026-03"
        }
    }


@app.get("/api/predict/{district_id}")
def predict(district_id: str):
    """
    Get full micronutrient deficiency risk prediction for a district.
    Returns per-nutrient risk scores, trends, causes, and confidence intervals.
    """
    clean_id = district_id.lower().replace(" ", "_").replace("-", "_")
    
    # Check if this district was AI-generated during this session
    if clean_id in ai_districts:
        # We need to format the raw AI generated dict similar to how `predict_district` formats it.
        # However, the AI district analyzer output schema might already match the frontend expected format or the raw district.json format.
        # Let's import the formatter from risk_predictor
        from services.risk_predictor import format_prediction_response
        return format_prediction_response(ai_districts[clean_id])

    result = predict_district(clean_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"District '{district_id}' not found")
    return result


@app.get("/api/fortify/{district_id}")
def fortify(district_id: str):
    """
    Get optimized fortification strategy for a district.
    Returns food vehicle selection, micronutrient levels, costs, and projected impact.
    """
    clean_id = district_id.lower().replace(" ", "_").replace("-", "_")
    # First get risk profile
    
    if clean_id in ai_districts:
        from services.risk_predictor import format_prediction_response
        risk_data = format_prediction_response(ai_districts[clean_id])
    else:
        risk_data = predict_district(clean_id)
        
    if not risk_data:
        raise HTTPException(status_code=404, detail=f"District '{district_id}' not found")

    # Extract just risk percentages for optimizer
    risk_profile = {
        k: v["risk_pct"]
        for k, v in risk_data["micronutrients"].items()
    }

    result = optimize_fortification(clean_id, risk_profile)
    if not result:
        raise HTTPException(status_code=404, detail=f"District '{district_id}' not found")

    # Attach risk context
    result["risk_context"] = {
        k: {"risk_pct": v["risk_pct"], "level": v["level"]}
        for k, v in risk_data["micronutrients"].items()
    }
    
    return result


@app.post("/api/meals/generate")
def generate_meal_plan(request: MealRequest):
    """
    Generate a 7-day culturally-appropriate meal plan.
    Respects religious dietary rules, seasonal availability, family budget,
    and optimizes for micronutrient coverage with bioavailability awareness.
    """
    req_dict = request.model_dump()
    req_dict["family_members"] = [m.model_dump() for m in request.family_members]
    
    # If no deficiency profile provided, generate from district prediction
    if not req_dict.get("deficiency_profile") and req_dict.get("district"):
        risk = predict_district(req_dict["district"])
        if risk:
            req_dict["deficiency_profile"] = {
                k: v["risk_pct"]
                for k, v in risk["micronutrients"].items()
            }
    
    result = generate_meals(req_dict)
    return result


@app.get("/api/cultural-groups")
def get_cultural_groups():
    """List all cultural/religious dietary groups supported"""
    with open("data/cultural_rules.json") as f:
        rules = json.load(f)
    return {
        "groups": [
            {"id": k, "label": v.get("label", k), "b12_strategy": v.get("b12_strategy"), "notes": v.get("notes", "")}
            for k, v in rules.items()
        ]
    }


@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "Anya Nutrition API"}


# ── AI Custom District Endpoints ─────────────────────────────────────────────

@app.post("/api/analyze-district")
async def analyze_district(request: AnalyzeDistrictRequest):
    """
    Use Azure OpenAI grok-4-fast-reasoning to analyze a custom district not in our database.
    Returns a full nutrition profile matching the same schema as built-in districts.
    """
    key = request.district_name.lower().replace(" ", "_")
    if key in ai_districts:
        return {"district": ai_districts[key], "cached": True}

    try:
        district_data = await analyze_district_with_ai(
            district_name=request.district_name,
            state_name=request.state_name or ""
        )
        ai_districts[key] = district_data
        return {"district": district_data, "cached": False}
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


@app.get("/api/geocode")
async def geocode_district(q: str):
    """
    Forward geocoding via Nominatim (OpenStreetMap) — free, no API key.
    Returns candidates with lat/lng for district search.
    """
    import httpx
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": f"{q}, India",
        "format": "json",
        "limit": 5,
        "countrycodes": "in",
        "addressdetails": 1,
    }
    headers = {"User-Agent": "Anya-NutritionCopilot/1.0"}
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, params=params, headers=headers)
        resp.raise_for_status()
    results = resp.json()
    return {
        "results": [
            {
                "display_name": r.get("display_name", ""),
                "name": r.get("address", {}).get("county") or r.get("address", {}).get("state_district") or r.get("name", q),
                "state": r.get("address", {}).get("state", ""),
                "lat": float(r["lat"]),
                "lng": float(r["lon"]),
            }
            for r in results
        ]
    }


@app.get("/api/ai-districts")
def get_ai_districts():
    """Return all AI-generated districts added in this session."""
    return {"districts": list(ai_districts.values())}
