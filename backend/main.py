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
    cultural_group: str = "hindu_nonveg"  # See cultural_rules.json for options
    family_members: List[FamilyMember] = [
        FamilyMember(type="pregnant", label="Mother"),
        FamilyMember(type="man", label="Father"),
        FamilyMember(type="infant_6_23m", label="Baby"),
        FamilyMember(type="elderly", label="Grandmother")
    ]
    monthly_budget_inr: int = 2500
    season: str = "monsoon"  # monsoon, winter, summer, post_harvest
    pds_access: bool = True
    local_market_items: Optional[List[str]] = None
    deficiency_profile: Optional[Dict[str, float]] = None


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
    result = predict_district(district_id.lower().replace(" ", "_").replace("-", "_"))
    if not result:
        raise HTTPException(status_code=404, detail=f"District '{district_id}' not found")
    return result


@app.get("/api/fortify/{district_id}")
def fortify(district_id: str):
    """
    Get optimized fortification strategy for a district.
    Returns food vehicle selection, micronutrient levels, costs, and projected impact.
    """
    # First get risk profile
    risk_data = predict_district(district_id.lower().replace(" ", "_").replace("-", "_"))
    if not risk_data:
        raise HTTPException(status_code=404, detail=f"District '{district_id}' not found")
    
    # Extract just risk percentages for optimizer
    risk_profile = {
        k: v["risk_pct"]
        for k, v in risk_data["micronutrients"].items()
    }
    
    result = optimize_fortification(district_id.lower().replace(" ", "_").replace("-", "_"), risk_profile)
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
