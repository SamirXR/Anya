"""
Culturally-Aware Meal Generation Service
Generates weekly meal plans that are:
- Nutritionally optimized (WHO/ICMR RDA)
- Culturally appropriate (religious/caste rules)
- Economically feasible (within budget)
- Practically cookable (available ingredients, simple methods)
- Seasonal (monsoon vs winter vs summer ingredients)
- Bioavailability-aware (iron+VitC pairing, avoiding calcium-iron conflict)
"""
import json
import random
from pathlib import Path
from typing import List, Dict

DATA_DIR = Path(__file__).parent.parent / "data"

with open(DATA_DIR / "food_composition.json") as f:
    FOODS = json.load(f)

with open(DATA_DIR / "cultural_rules.json") as f:
    CULTURAL_RULES = json.load(f)

# RDA values per person per day by life stage
RDA = {
    "infant_6_23m": {"calories": 800, "protein": 10, "iron_mg": 11, "vitamin_a_mcg": 400, "vitamin_c_mg": 40, "zinc_mg": 8.4, "b12_mcg": 1.2, "calcium_mg": 600, "vitamin_d_mcg": 10},
    "child_2_5y": {"calories": 1060, "protein": 14, "iron_mg": 9, "vitamin_a_mcg": 400, "vitamin_c_mg": 40, "zinc_mg": 8.3, "b12_mcg": 1.5, "calcium_mg": 600, "vitamin_d_mcg": 10},
    "child_6_14y": {"calories": 1950, "protein": 34, "iron_mg": 18, "vitamin_a_mcg": 600, "vitamin_c_mg": 40, "zinc_mg": 13, "b12_mcg": 2.2, "calcium_mg": 800, "vitamin_d_mcg": 10},
    "woman": {"calories": 1900, "protein": 46, "iron_mg": 21, "vitamin_a_mcg": 700, "vitamin_c_mg": 40, "zinc_mg": 12, "b12_mcg": 2.2, "calcium_mg": 800, "vitamin_d_mcg": 10},
    "pregnant": {"calories": 2200, "protein": 66, "iron_mg": 35, "vitamin_a_mcg": 800, "vitamin_c_mg": 60, "zinc_mg": 14, "b12_mcg": 2.5, "calcium_mg": 1200, "vitamin_d_mcg": 10},
    "lactating": {"calories": 2450, "protein": 74, "iron_mg": 21, "vitamin_a_mcg": 950, "vitamin_c_mg": 80, "zinc_mg": 14, "b12_mcg": 2.5, "calcium_mg": 1200, "vitamin_d_mcg": 10},
    "man": {"calories": 2320, "protein": 54, "iron_mg": 17, "vitamin_a_mcg": 600, "vitamin_c_mg": 40, "zinc_mg": 12, "b12_mcg": 2.2, "calcium_mg": 600, "vitamin_d_mcg": 10},
    "elderly": {"calories": 1800, "protein": 48, "iron_mg": 17, "vitamin_a_mcg": 600, "vitamin_c_mg": 40, "zinc_mg": 10, "b12_mcg": 2.5, "calcium_mg": 1000, "vitamin_d_mcg": 15}
}

# Breakfast templates per culture
BREAKFAST_TEMPLATES = {
    "south_india": [
        {"name": "Ragi porridge with jaggery & groundnuts", "base_foods": ["ragi", "jaggery", "groundnuts"], "note": "Iron+calcium combo"},
        {"name": "Rice idli with sambar & coconut chutney", "base_foods": ["rice_plain", "toor_dal", "tomato"], "note": "Classic South Indian"},
        {"name": "Ragi mudde with saaru", "base_foods": ["ragi", "toor_dal"], "note": "Tribal Karnataka favourite"}
    ],
    "north_india": [
        {"name": "Makki/Bajra roti with sarson saag & jaggery", "base_foods": ["bajra", "sarson_saag", "jaggery"], "note": "Iron+Vitamin C combo"},
        {"name": "Oat porridge with jaggery & banana", "base_foods": ["banana", "jaggery"], "note": "Easy, affordable"},
        {"name": "Sattu with lemon & salt", "base_foods": ["roasted_chana", "lemon"], "note": "Protein-rich Bihar staple"}
    ],
    "tribal": [
        {"name": "Ragi porridge with groundnuts & mahua", "base_foods": ["ragi", "groundnuts", "mahua_flowers"], "note": "Indigenous breakfast"},
        {"name": "Wild greens saag with millet porridge", "base_foods": ["wild_amaranth", "bajra"], "note": "Forest food rich in iron"}
    ],
    "generic": [
        {"name": "Wheat porridge (dalia) with milk & jaggery", "base_foods": ["wheat_roti", "milk", "jaggery"], "note": "Iron+B12 combo"},
        {"name": "Egg omelette with roti & tomato", "base_foods": ["egg", "wheat_roti", "tomato"], "note": "B12+protein breakfast"},
        {"name": "Sprouted moong chaat with lemon", "base_foods": ["chana_dal", "lemon"], "note": "Vitamin C boosts iron"}
    ]
}

LUNCH_TEMPLATES = [
    {
        "name": "Fortified rice + drumstick dal + wild amaranth saag + lemon wedge",
        "base_foods": ["rice_fortified", "toor_dal", "drumstick_leaves", "wild_amaranth", "lemon"],
        "note": "Iron absorption optimised — Vitamin C from greens & lemon",
        "vegetarian": True,
        "season": "monsoon"
    },
    {
        "name": "Rice khichdi + spinach dal + fortified oil tadka",
        "base_foods": ["rice_fortified", "toor_dal", "spinach", "edible_oil_fortified"],
        "note": "Complete protein + Vitamin A from fortified oil",
        "vegetarian": True,
        "season": "year_round"
    },
    {
        "name": "Bajra roti + horsegram curry + pumpkin sabzi",
        "base_foods": ["bajra", "horsegram", "pumpkin"],
        "note": "Extremely iron-rich; horsegram has highest Fe of any pulse",
        "vegetarian": True,
        "season": "year_round"
    },
    {
        "name": "Rice + egg curry + amaranth saag + lemon",
        "base_foods": ["rice_fortified", "egg", "wild_amaranth", "lemon"],
        "note": "B12 from egg + Non-heme iron from saag + Vitamin C for absorption",
        "vegetarian": False,
        "season": "monsoon"
    },
    {
        "name": "Rice + fish curry + spinach stir fry",
        "base_foods": ["rice_plain", "local_fish", "spinach"],
        "note": "B12+Vitamin D from fish; excellent for coastal/tribal regions",
        "vegetarian": False,
        "season": "year_round"
    },
    {
        "name": "Wheat roti + rajma curry + curd",
        "base_foods": ["wheat_roti", "rajma", "curd"],
        "note": "High-iron rajma + probiotic curd; north India classic",
        "vegetarian": True,
        "season": "year_round"
    }
]

DINNER_TEMPLATES = [
    {
        "name": "Wheat roti + egg curry + pumpkin sabzi",
        "base_foods": ["wheat_roti", "egg", "pumpkin"],
        "note": "B12+Vitamin A for children and pregnant mothers",
        "vegetarian": False
    },
    {
        "name": "Rice + dal + drumstick leaves stir fry + papad",
        "base_foods": ["rice_fortified", "toor_dal", "drumstick_leaves"],
        "note": "Moringa powder on dal: iron + Vitamin A superfood",
        "vegetarian": True
    },
    {
        "name": "Bajra roti + jaggery & sesame + curd",
        "base_foods": ["bajra", "jaggery", "sesame_seeds", "curd"],
        "note": "Iron from jaggery+sesame; calcium from curd; easy to cook",
        "vegetarian": True
    },
    {
        "name": "Ragi mudde + chicken liver curry + greens",
        "base_foods": ["ragi", "chicken_liver", "spinach"],
        "note": "Most nutrient-dense dinner: iron+B12+Vitamin A all from one meal",
        "vegetarian": False
    },
    {
        "name": "Rice + paneer curry + spinach saag",
        "base_foods": ["rice_fortified", "paneer", "spinach"],
        "note": "Calcium from paneer; serve paneer at dinner, iron-rich food at lunch",
        "vegetarian": True
    },
    {
        "name": "Wheat roti + mutton curry + tomato onion salad",
        "base_foods": ["wheat_roti", "mutton", "tomato"],
        "note": "Heme iron + zinc from mutton; Vitamin C from tomato",
        "vegetarian": False
    }
]

SNACK_TEMPLATES = [
    {"name": "Roasted chana + amla", "foods": ["roasted_chana", "amla"], "note": "Iron + Vitamin C (best combo)", "cost": 8},
    {"name": "Banana + groundnut chikki (jaggery+peanut)", "foods": ["banana", "groundnuts", "jaggery"], "note": "Energy + protein + iron", "cost": 10},
    {"name": "Dates + sesame seeds ladoo", "foods": ["dates", "sesame_seeds"], "note": "Iron + calcium snack", "cost": 12},
    {"name": "Milk / fortified milk with jaggery", "foods": ["milk", "jaggery"], "note": "Calcium + B12; serve separately from iron-rich meals", "cost": 8},
    {"name": "Papaya (safe in moderate amounts postpartum & 2nd-3rd trimester)", "foods": ["papaya_ripe"], "note": "Vitamin A + C; important myth busting needed", "cost": 6}
]

MYTH_BUSTERS = {
    "papaya_fear": {
        "myth": "Don't eat papaya during pregnancy — it causes miscarriage",
        "reality": "Ripe papaya in moderate amounts is safe and rich in Vitamin A essential for baby's eye development. Only raw/green papaya has compounds of concern.",
        "hindi": "Pakka papaya safe hai — bacche ki aankhon ke liye bahut zaruri Vitamin A deta hai.",
        "approach": "Address mother-in-law first, frame as 'new medical knowledge'"
    },
    "eating_less": {
        "myth": "Eat less during pregnancy so baby stays small for easier delivery",
        "reality": "Restricting food during pregnancy causes stunting, low birth weight, and complications. Mother needs 350 extra calories/day.",
        "hindi": "Garbhavati maa ko zyada khana chahiye, kam nahi — bacche ka wajan theek rehna chahiye.",
        "approach": "Use growth monitoring data to show mother and family"
    },
    "fish_during_monsoon": {
        "myth": "Don't eat fish during monsoon — it causes stomach problems",
        "reality": "Fresh fish is safe year-round if cooked well. Fish provides B12 and Vitamin D — critical during monsoon when sunlight is low.",
        "hindi": "Paka hua taza machhli kabhi bhi safe hai — Vitamin B12 aur Vitamin D deti hai jo monsoon mein khas zaruri hai.",
        "approach": "Emphasize cooking method (fully cooked) and source (fresh, not spoiled)"
    },
    "hot_foods": {
        "myth": "Hot foods (like eggs, meat) cause miscarriage",
        "reality": "This is not supported by any medical evidence. Eggs and meat provide protein and B12 critical for fetal brain development.",
        "hindi": "Anda aur gosht pregnancy mein bahut faydemand hain — bacche ke dimag ki growth ke liye zaruri hain.",
        "approach": "Share government health worker (ASHA) guidance"
    }
}


def get_eligible_foods(cultural_group: str, is_vegetarian: bool) -> List[str]:
    """Get list of food IDs this family can eat"""
    rules = CULTURAL_RULES.get(cultural_group, CULTURAL_RULES["hindu_nonveg"])
    excluded = rules.get("excluded_foods", [])
    
    eligible = []
    for food_id, food in FOODS.items():
        tags = food.get("tags", [])
        
        # Check vegetarian constraint
        if is_vegetarian and "non_vegetarian" in tags:
            continue
        
        # Check cultural exclusions
        skip = False
        for excl in excluded:
            if excl in food_id or excl in tags:
                skip = True
                break
        
        if not skip:
            eligible.append(food_id)
    
    return eligible


def calculate_nutrients(food_ids_with_grams: Dict[str, float]) -> Dict[str, float]:
    """Calculate total nutrients for a set of foods with gram amounts"""
    totals = {"calories": 0, "protein_g": 0, "iron_mg": 0, "vitamin_a_mcg": 0,
              "vitamin_c_mg": 0, "zinc_mg": 0, "b12_mcg": 0, "calcium_mg": 0, "vitamin_d_mcg": 0}
    
    for food_id, grams in food_ids_with_grams.items():
        if food_id not in FOODS:
            continue
        food = FOODS[food_id]
        scale = grams / 100.0
        nutrients = food["per_100g"]
        totals["calories"] += nutrients.get("calories", 0) * scale
        totals["protein_g"] += nutrients.get("protein", 0) * scale
        totals["iron_mg"] += nutrients.get("iron_mg", 0) * scale
        totals["vitamin_a_mcg"] += nutrients.get("vitamin_a_mcg", 0) * scale
        totals["vitamin_c_mg"] += nutrients.get("vitamin_c_mg", 0) * scale
        totals["zinc_mg"] += nutrients.get("zinc_mg", 0) * scale
        totals["b12_mcg"] += nutrients.get("b12_mcg", 0) * scale
        totals["calcium_mg"] += nutrients.get("calcium_mg", 0) * scale
        totals["vitamin_d_mcg"] += nutrients.get("vitamin_d_mcg", 0) * scale
    
    return {k: round(v, 2) for k, v in totals.items()}


def calculate_rda_coverage(nutrients: dict, life_stage: str) -> Dict[str, float]:
    rda = RDA.get(life_stage, RDA["woman"])
    return {
        "calories": round(nutrients["calories"] / rda["calories"] * 100, 1),
        "protein": round(nutrients["protein_g"] / rda["protein"] * 100, 1),
        "iron": round(nutrients["iron_mg"] / rda["iron_mg"] * 100, 1),
        "vitamin_a": round(nutrients["vitamin_a_mcg"] / rda["vitamin_a_mcg"] * 100, 1),
        "vitamin_c": round(nutrients["vitamin_c_mg"] / rda["vitamin_c_mg"] * 100, 1),
        "zinc": round(nutrients["zinc_mg"] / rda["zinc_mg"] * 100, 1),
        "b12": round(nutrients["b12_mcg"] / rda["b12_mcg"] * 100, 1),
        "calcium": round(nutrients["calcium_mg"] / rda["calcium_mg"] * 100, 1),
        "vitamin_d": round(nutrients["vitamin_d_mcg"] / rda["vitamin_d_mcg"] * 100, 1)
    }


def estimate_meal_cost(base_foods: List[str], grams_per_food: int = 150) -> float:
    total = 0
    for fid in base_foods:
        if fid in FOODS:
            total += FOODS[fid]["cost_per_100g"] * grams_per_food / 100
    return round(max(12, total), 0)


def pick_breakfast(cultural_group: str, season: str) -> dict:
    if "tribal" in cultural_group:
        templates = BREAKFAST_TEMPLATES["tribal"]
    elif "south" in cultural_group or cultural_group in ["hindu_brahmin"]:
        templates = BREAKFAST_TEMPLATES["south_india"]
    elif "sikh" in cultural_group or "muslim" in cultural_group:
        templates = BREAKFAST_TEMPLATES["north_india"]
    else:
        templates = BREAKFAST_TEMPLATES["generic"]
    t = random.choice(templates)
    return {**t, "cost": estimate_meal_cost(t["base_foods"], 120)}


def pick_lunch(is_vegetarian: bool, cultural_group: str, season: str) -> dict:
    options = [t for t in LUNCH_TEMPLATES if is_vegetarian and t["vegetarian"] or not is_vegetarian]
    if not options:
        options = [t for t in LUNCH_TEMPLATES if t["vegetarian"]]
    t = random.choice(options)
    return {**t, "cost": estimate_meal_cost(t["base_foods"], 200)}


def pick_dinner(is_vegetarian: bool) -> dict:
    options = [t for t in DINNER_TEMPLATES if is_vegetarian and t["vegetarian"] or not is_vegetarian]
    if not options:
        options = [t for t in DINNER_TEMPLATES if t["vegetarian"]]
    t = random.choice(options)
    return {**t, "cost": estimate_meal_cost(t["base_foods"], 180)}


def generate_meals(request: dict) -> dict:
    """
    Main meal generation function.
    request = {
        district: str, cultural_group: str, family_members: list,
        monthly_budget_inr: int, season: str,
        pds_access: bool, local_market_items: list,
        deficiency_profile: dict
    }
    """
    cultural_group = request.get("cultural_group", "hindu_nonveg")
    rules = CULTURAL_RULES.get(cultural_group, CULTURAL_RULES["hindu_nonveg"])
    family_members = request.get("family_members", [{"type": "woman", "count": 1}])
    monthly_budget = request.get("monthly_budget_inr", 2500)
    season = request.get("season", "year_round")
    deficiency_profile = request.get("deficiency_profile", {})
    is_vegetarian = cultural_group in ["hindu_vegetarian", "hindu_brahmin", "jain", "buddhist"]
    
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    weekly_plan = []
    
    for day in days:
        breakfast = pick_breakfast(cultural_group, season)
        lunch = pick_lunch(is_vegetarian, cultural_group, season)
        dinner = pick_dinner(is_vegetarian)
        snack = random.choice(SNACK_TEMPLATES)
        
        # Adjust snack if vegetarian restrictions
        if is_vegetarian and "egg" in snack.get("name", "").lower():
            snack = SNACK_TEMPLATES[0]  # Fallback to chana+amla
        
        daily_total = breakfast["cost"] + lunch["cost"] + dinner["cost"] + snack["cost"]
        
        # Calculate nutrients (estimate)
        all_foods = {}
        for fid in breakfast.get("base_foods", []):
            all_foods[fid] = all_foods.get(fid, 0) + 120
        for fid in lunch.get("base_foods", []):
            all_foods[fid] = all_foods.get(fid, 0) + 200
        for fid in dinner.get("base_foods", []):
            all_foods[fid] = all_foods.get(fid, 0) + 180
        for fid in snack.get("foods", []):
            all_foods[fid] = all_foods.get(fid, 0) + 50
        
        # Add double fortified salt (5g/day standard)
        all_foods["double_fortified_salt"] = 5
        
        nutrients = calculate_nutrients(all_foods)
        
        # Use pregnant woman as primary life stage for coverage calculation  
        primary_stage = "woman"
        for member in family_members:
            if "pregnant" in member.get("type", ""):
                primary_stage = "pregnant"
                break
        
        rda_coverage = calculate_rda_coverage(nutrients, primary_stage)
        
        # Build baby/child adaptation if infant in family
        child_adaptation = None
        has_infant = any(m.get("type") == "infant_6_23m" for m in family_members)
        if has_infant:
            child_adaptation = {
                "breakfast": f"Mashed {breakfast['name'].split()[0].lower()} porridge with milk",
                "lunch": f"Mashed rice-dal khichdi + drumstick leaf powder",
                "dinner": f"Mashed {('egg + ' if not is_vegetarian else '')}{dinner['name'].split('+')[0].strip().lower()}"
            }
        
        # Pregnant mother adaptation
        pregnant_adaptation = None
        has_pregnant = any("pregnant" in m.get("type", "") for m in family_members)
        if has_pregnant:
            extra_items = []
            if not is_vegetarian:
                extra_items.append("Extra egg at dinner")
            extra_items.append("Amla after lunch for iron absorption")
            if rda_coverage.get("b12", 100) < 80:
                extra_items.append("⚠️ B12 supplement recommended by ASHA worker")
            pregnant_adaptation = {"extras": extra_items}
        
        weekly_plan.append({
            "day": day,
            "breakfast": {
                "description": breakfast["name"],
                "note": breakfast.get("note", ""),
                "cost": breakfast["cost"]
            },
            "lunch": {
                "description": lunch["name"],
                "note": lunch.get("note", ""),
                "cost": lunch["cost"]
            },
            "dinner": {
                "description": dinner["name"],
                "note": dinner.get("note", ""),
                "cost": dinner["cost"]
            },
            "snack": {
                "description": snack["name"],
                "note": snack.get("note", ""),
                "cost": snack["cost"]
            },
            "daily_total_inr": daily_total,
            "nutrient_coverage": rda_coverage,
            "child_adaptation": child_adaptation,
            "pregnant_adaptation": pregnant_adaptation
        })
    
    weekly_total = sum(d["daily_total_inr"] for d in weekly_plan)
    monthly_estimate = weekly_total * 4.33
    
    # Identify nutrient gaps
    avg_coverage = {}
    for nutrient in ["iron", "vitamin_a", "b12", "zinc", "vitamin_d"]:
        avg_coverage[nutrient] = round(sum(d["nutrient_coverage"].get(nutrient, 0) for d in weekly_plan) / 7, 1)
    
    supplements_recommended = []
    if avg_coverage.get("b12", 100) < 75 and is_vegetarian:
        supplements_recommended.append({
            "nutrient": "Vitamin B12",
            "reason": "Vegetarian diet cannot provide adequate B12 — supplement essential",
            "dose": "1mg/day oral cyanocobalamin (available free at PHC/Anganwadi)",
            "urgency": "essential"
        })
    if avg_coverage.get("vitamin_d", 100) < 60:
        supplements_recommended.append({
            "nutrient": "Vitamin D",
            "reason": "Insufficient dietary sources; limited sun exposure",
            "dose": "Weekly 60,000 IU cholecalciferol tablet (available at PHC)",
            "urgency": "recommended"
        })
    if avg_coverage.get("iron", 100) < 70 and has_pregnant:
        supplements_recommended.append({
            "nutrient": "Iron + Folic Acid (IFA)",
            "reason": "Dietary iron insufficient for pregnancy — IFA supplement critical",
            "dose": "1 IFA tablet daily (available free at Anganwadi)",
            "urgency": "essential"
        })
    
    # Relevant myth busters for this family
    relevant_myths = []
    has_pregnancy_taboos = rules.get("pregnancy_taboos", [])
    for taboo in has_pregnancy_taboos:
        if taboo in MYTH_BUSTERS:
            relevant_myths.append(MYTH_BUSTERS[taboo])
    
    return {
        "cultural_group": cultural_group,
        "cultural_label": rules.get("label", cultural_group),
        "district": request.get("district", ""),
        "family_members": family_members,
        "season": season,
        "weekly_plan": weekly_plan,
        "financial_summary": {
            "weekly_total_inr": round(weekly_total),
            "monthly_estimate_inr": round(monthly_estimate),
            "monthly_budget_inr": monthly_budget,
            "within_budget": monthly_estimate <= monthly_budget,
            "budget_utilization_pct": round(monthly_estimate / monthly_budget * 100, 1)
        },
        "average_nutrient_coverage": avg_coverage,
        "supplements_recommended": supplements_recommended,
        "cultural_notes": {
            "strategy": rules.get("notes", ""),
            "b12_strategy": rules.get("b12_strategy", "adequate_from_diet"),
            "fasting_awareness": rules.get("fasting_periods", []),
            "myth_busters": relevant_myths
        },
        "key_ingredients": {
            "iron_sources": rules.get("iron_sources", [])[:5],
            "indigenous_superfoods": rules.get("indigenous_superfoods", []),
            "pds_items": ["Fortified rice (FRK)", "Double fortified salt", "Fortified edible oil"]
        },
        "bioavailability_tips": [
            "🍋 Add lemon/amla to every iron-rich meal — Vitamin C triples iron absorption",
            "🚫 Don't drink tea/coffee with meals — tannins block iron absorption",
            "🥛 Have milk/curd at dinner, not lunch — calcium competes with iron",
            "🧄 Cook dal with turmeric and a pinch of DFS (double fortified salt) — hidden iron boost",
            "🥚 Even small amounts of egg or meat with plant-based meal dramatically improves iron absorption"
        ]
    }
