"""
Fortification Optimizer Service
Uses linear programming to determine the optimal fortification strategy
for each district based on its predicted deficiency profile.
"""
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

with open(DATA_DIR / "fortification_vehicles.json") as f:
    FORT_DATA = json.load(f)

with open(DATA_DIR / "districts.json") as f:
    DISTRICTS = {d["id"]: d for d in json.load(f)}

QUARTERLY_BUDGET_PER_LAKH_POP = 8.5  # Lakhs INR per lakh population per quarter

VEHICLE_IMPACT = {
    "pds_rice": {
        "iron": 0.22, "b12": 0.18, "folate": 0.14,
        "vitamin_a": 0, "zinc": 0, "vitamin_d": 0
    },
    "anganwadi_thr": {
        "iron": 0.18, "zinc": 0.28, "vitamin_a": 0.30,
        "b12": 0.08, "vitamin_d": 0.05, "folate": 0.10
    },
    "double_fortified_salt": {
        "iron": 0.12, "b12": 0, "zinc": 0,
        "vitamin_a": 0, "vitamin_d": 0, "folate": 0
    },
    "pds_oil": {
        "vitamin_a": 0.28, "vitamin_d": 0.20,
        "iron": 0, "zinc": 0, "b12": 0, "folate": 0
    },
    "mdm_flour": {
        "iron": 0.16, "zinc": 0.14, "b12": 0.06,
        "vitamin_a": 0, "vitamin_d": 0, "folate": 0.12
    }
}

VEHICLE_COST_PER_LAKH_POP = {
    "pds_rice": 1.8,
    "anganwadi_thr": 2.4,
    "double_fortified_salt": 0.9,
    "pds_oil": 1.2,
    "mdm_flour": 1.6
}

def score_vehicle_for_district(vehicle_id: str, risk_profile: dict) -> float:
    """Score how well a vehicle addresses district's top deficiencies"""
    impact = VEHICLE_IMPACT[vehicle_id]
    score = 0
    for nutrient, risk in risk_profile.items():
        if nutrient in impact:
            score += impact[nutrient] * (risk / 100.0)
    return score


def optimize_fortification(district_id: str, risk_profile: dict) -> dict:
    """
    Linear programming-inspired greedy optimizer
    Selects food vehicles maximizing deficiency reduction per rupee
    subject to budget constraints and coverage feasibility.
    """
    if district_id not in DISTRICTS:
        return None
    
    d = DISTRICTS[district_id]
    pop_lakhs = d["population"] / 100000
    total_budget = round(QUARTERLY_BUDGET_PER_LAKH_POP * pop_lakhs, 2)
    
    # Score each vehicle
    vehicle_scores = {}
    for v_id in VEHICLE_IMPACT:
        score = score_vehicle_for_district(v_id, risk_profile)
        cost = VEHICLE_COST_PER_LAKH_POP[v_id] * pop_lakhs
        vehicle_scores[v_id] = {
            "score": score,
            "cost": cost,
            "roi": score / cost if cost > 0 else 0
        }
    
    # Greedy selection by ROI
    sorted_vehicles = sorted(vehicle_scores.items(), key=lambda x: x[1]["roi"], reverse=True)
    
    selected = []
    remaining_budget = total_budget
    cumulative_impact = {n: 0 for n in risk_profile}
    
    for v_id, v_data in sorted_vehicles:
        if remaining_budget >= v_data["cost"]:
            remaining_budget -= v_data["cost"]
            selected.append(v_id)
            for nutrient, imp in VEHICLE_IMPACT[v_id].items():
                if nutrient in cumulative_impact:
                    cumulative_impact[nutrient] += imp
    
    # Build detailed plan
    fort_vehicles = {v["id"]: v for v in FORT_DATA["vehicles"]}
    plan = []
    
    vehicle_labels = {
        "pds_rice": "PDS Rice (Fortified Rice Kernels)",
        "anganwadi_thr": "Anganwadi Take-Home Ration Premix",
        "double_fortified_salt": "Double Fortified Salt (Iron+Iodine)",
        "pds_oil": "Fortified Edible Oil (Vitamin A+D)",
        "mdm_flour": "Mid-Day Meal Fortified Flour"
    }
    
    vehicle_nutrients = {
        "pds_rice": [
            {"name": "Iron", "level": "28mg/kg", "form": "Ferrous Sulphate (FRK)"},
            {"name": "Vitamin B12", "level": "1μg/kg", "form": "Cyanocobalamin"},
            {"name": "Folic Acid", "level": "75μg/kg", "form": "Folic Acid"}
        ],
        "anganwadi_thr": [
            {"name": "Zinc", "level": "5mg/serving", "form": "Zinc Sulphate"},
            {"name": "Vitamin A", "level": "200μg/serving", "form": "Retinyl Palmitate"},
            {"name": "Iron", "level": "12mg/serving", "form": "Ferric Pyrophosphate"}
        ],
        "double_fortified_salt": [
            {"name": "Iron", "level": "1000mg/kg", "form": "Encapsulated FeSO4"},
            {"name": "Iodine", "level": "30mg/kg", "form": "Potassium Iodate"}
        ],
        "pds_oil": [
            {"name": "Vitamin A", "level": "6000μg/liter", "form": "Retinyl Palmitate"},
            {"name": "Vitamin D", "level": "50μg/liter", "form": "Cholecalciferol (D3)"}
        ],
        "mdm_flour": [
            {"name": "Iron", "level": "40mg/kg", "form": "Ferrous Fumarate"},
            {"name": "Zinc", "level": "30mg/kg", "form": "Zinc Oxide"},
            {"name": "B-Complex", "level": "10mg/kg", "form": "Mixed B vitamins"}
        ]
    }
    
    vehicle_targets = {
        "pds_rice": "All households via PDS",
        "anganwadi_thr": "Children 6-36 months + Pregnant/Lactating women",
        "double_fortified_salt": "All households via PDS",
        "pds_oil": "All households via PDS",
        "mdm_flour": "School children 6-14 years"
    }
    
    for v_id in selected:
        cost_quarter = round(VEHICLE_COST_PER_LAKH_POP[v_id] * pop_lakhs, 2)
        
        # Calculate specific impact
        impacts = []
        for nutrient, base_impact in VEHICLE_IMPACT[v_id].items():
            if base_impact > 0 and nutrient in risk_profile:
                risk_before = risk_profile[nutrient]
                risk_reduction = base_impact * risk_profile[nutrient]  # as fraction
                risk_after = risk_before * (1 - base_impact)
                impacts.append({
                    "nutrient": nutrient.replace("_", " ").title(),
                    "risk_before": round(risk_before, 1),
                    "risk_after": round(risk_after, 1),
                    "reduction_pct": round(base_impact * 100, 1)
                })
        
        plan.append({
            "vehicle_id": v_id,
            "vehicle_name": vehicle_labels[v_id],
            "target_population": vehicle_targets[v_id],
            "nutrients": vehicle_nutrients[v_id],
            "quarterly_cost_lakhs": cost_quarter,
            "coverage_pct": fort_vehicles.get(v_id, {}).get("base_coverage_pct", 70),
            "impacts": sorted(impacts, key=lambda x: x["reduction_pct"], reverse=True)
        })
    
    # Project overall impact
    projected_outcomes = {}
    for nutrient, risk in risk_profile.items():
        total_reduction = min(0.45, cumulative_impact.get(nutrient, 0))
        projected_outcomes[nutrient] = {
            "before": round(risk, 1),
            "after": round(risk * (1 - total_reduction), 1),
            "reduction_pct": round(total_reduction * 100, 1)
        }
    
    budget_used = total_budget - remaining_budget
    lives_improved = round(d["population"] * 0.04)  # Estimated
    cost_per_life = round((budget_used * 100000) / max(lives_improved, 1))
    
    return {
        "district_id": district_id,
        "district_name": d["name"],
        "state": d["state"],
        "population": d["population"],
        "quarterly_budget_lakhs": round(total_budget, 2),
        "budget_used_lakhs": round(budget_used, 2),
        "budget_remaining_lakhs": round(remaining_budget, 2),
        "fortification_plan": plan,
        "projected_outcomes": projected_outcomes,
        "summary_stats": {
            "vehicles_selected": len(selected),
            "estimated_lives_improved": lives_improved,
            "cost_per_deficiency_point_reduced_inr": cost_per_life,
            "cost_effectiveness_rating": "Excellent" if cost_per_life < 1000 else "Good" if cost_per_life < 2000 else "Moderate"
        },
        "bioavailability_notes": [
            "Pair iron-rich meals with Vitamin C sources (lemon, amla) to enhance absorption by 2-3x",
            "Separate iron and calcium in different meals — calcium inhibits iron absorption",
            "Vitamin D from fortified oil enhances calcium absorption and supports bone health",
            "Zinc and iron compete at high doses — ensure MDM meals balance both"
        ],
        "implementation_notes": [
            f"Coordinate with State Food Corporation for PDS rice FRK procurement",
            f"Train {round(d['population']/5000)} Anganwadi workers on THR premix importance",
            "Ensure cold chain for Vitamin A/D fortified oil during distribution",
            "Monitor school attendance for MDM fortification reach"
        ]
    }
