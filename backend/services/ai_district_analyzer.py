"""
Anya — AI District Analyzer
Uses Grok-4-fast-reasoning via Azure AI endpoint with OpenAI SDK.
"""
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

# Ensure we load the .env in the backend directory
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(env_path)

ENDPOINT = os.getenv(
    "AZURE_OPENAI_ENDPOINT",
    "https://ai-samirawm76076ai528478683931.services.ai.azure.com/openai/v1/"
)
API_KEY = os.getenv("AZURE_OPENAI_API_KEY", "")
MODEL = os.getenv("AZURE_OPENAI_DEPLOYMENT", "grok-4-fast-reasoning")

SYSTEM_PROMPT = """You are Anya, India's Nutrition Copilot AI. Generate a detailed nutrition risk profile for any Indian district.

Use your knowledge of:
- NFHS-5 (2019-21) district and state-level data
- ICMR nutritional guidelines
- FSSAI fortification standards
- Known tribal/cultural/seasonal patterns for the region
- Poverty, NREGA data, PDS coverage patterns

Return ONLY valid JSON, no markdown, no code blocks. Use this exact schema:

{
  "id": "snake_case_district_name",
  "name": "District Name",
  "state": "State Name",
  "lat": 00.00,
  "lng": 00.00,
  "population": 000000,
  "tribal": true,
  "dominant_tribe": "Tribe name or null",
  "aspirational_district": true,
  "rank": 11,
  "source": "AI-Generated · Grok-4 · NFHS-5 state interpolation",
  "nfhs5": {
    "stunting_pct": 00.0,
    "wasting_pct": 00.0,
    "underweight_pct": 00.0,
    "anemia_children_pct": 00.0,
    "anemia_women_pct": 00.0,
    "low_birth_weight_pct": 00.0,
    "child_mortality_per_1000": 00.0,
    "institutional_delivery_pct": 00.0,
    "pds_coverage_pct": 00.0,
    "open_defecation_pct": 00.0,
    "diet_diversity_score": 0.0,
    "vegetarian_pct": 00.0,
    "poverty_pct": 00.0,
    "female_literacy_pct": 00.0
  },
  "micronutrient_profile": {
    "iron": {
      "deficiency_pct": 00.0,
      "primary_causes": ["cause 1", "cause 2", "cause 3"],
      "seasonal_peak": "monsoon/summer/winter/pre_harvest",
      "trend": "rising/falling/stable",
      "trend_delta": "+X% vs NFHS-4"
    },
    "vitamin_a": { "deficiency_pct": 00.0, "primary_causes": [], "seasonal_peak": "", "trend": "", "trend_delta": "" },
    "zinc":      { "deficiency_pct": 00.0, "primary_causes": [], "seasonal_peak": "", "trend": "", "trend_delta": "" },
    "b12":       { "deficiency_pct": 00.0, "primary_causes": [], "seasonal_peak": "", "trend": "", "trend_delta": "" },
    "vitamin_d": { "deficiency_pct": 00.0, "primary_causes": [], "seasonal_peak": "", "trend": "", "trend_delta": "" }
  },
  "context": {
    "brief": "2-3 sentence district context narrative",
    "key_interventions": ["Programme 1", "Programme 2"],
    "indigenous_foods": ["Food 1", "Food 2"],
    "pds_items_available": ["Rice", "Wheat"],
    "hospitals_per_lakh": 0.0,
    "anganwadis_per_1000_children": 0.0
  }
}

Be precise. Interpolate from state data and comparable districts when exact district figures are unavailable."""


async def analyze_district_with_ai(district_name: str, state_name: str = "") -> dict:
    """Call Grok-4-fast-reasoning to generate a nutrition profile for a custom district."""

    if not API_KEY:
        raise ValueError(
            "Azure API key not set. Add AZURE_OPENAI_API_KEY to backend/.env"
        )

    # Use OpenAI SDK with Azure endpoint (as shown in user's snippet)
    import asyncio
    loop = asyncio.get_event_loop()

    def _call():
        client = OpenAI(base_url=ENDPOINT, api_key=API_KEY)
        return client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": (
                    f"Generate a comprehensive nutrition risk profile for:\n"
                    f"District: {district_name}\n"
                    f"{f'State: {state_name}' if state_name else ''}\n\n"
                    f"Return ONLY the JSON object."
                )}
            ],
            temperature=0.3,
            max_tokens=2500,
        )

    # Run the synchronous OpenAI call in executor to not block the async event loop
    response = await loop.run_in_executor(None, _call)
    content = response.choices[0].message.content or ""

    # Strip markdown fences if model wraps in ```json
    content = content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    content = content.strip()

    district_data = json.loads(content)

    # Compute derived fields for frontend
    mn = district_data.get("micronutrient_profile", {})
    if mn:
        scores = [v.get("deficiency_pct", 0) for v in mn.values()]
        avg = sum(scores) / len(scores) if scores else 0
        # Avoid round() type issue — use int arithmetic
        district_data["overall_risk"] = int(avg * 10) / 10

        def level(pct):
            if pct >= 65: return "critical"
            if pct >= 50: return "high"
            if pct >= 35: return "moderate"
            return "low"

        district_data["overall_level"] = level(district_data["overall_risk"])
        district_data["stunting_pct"] = district_data.get("nfhs5", {}).get("stunting_pct", 0)
        district_data["anemia_children_pct"] = district_data.get("nfhs5", {}).get("anemia_children_pct", 0)
        district_data["iron_risk"] = mn.get("iron", {}).get("deficiency_pct", 0)
        district_data["vitamin_a_risk"] = mn.get("vitamin_a", {}).get("deficiency_pct", 0)
        district_data["zinc_risk"] = mn.get("zinc", {}).get("deficiency_pct", 0)
        district_data["b12_risk"] = mn.get("b12", {}).get("deficiency_pct", 0)
        district_data["vitamin_d_risk"] = mn.get("vitamin_d", {}).get("deficiency_pct", 0)

    district_data["ai_generated"] = True
    return district_data
