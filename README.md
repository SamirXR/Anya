## Inspiration

India produces enough food to feed its entire population. Yet **35.5% of children under 5 are stunted** and **57% of women are anemic.** We don't have a food crisis. We have a **nutrition intelligence failure.**

When we analyzed NFHS-5 data across India's 640+ districts, we found something striking: in **Alirajpur, Madhya Pradesh**, 79% of children are anemic, just 800km from Mumbai. These crises are **predictable and preventable**, but India's nutrition response is always too late, too generic, and culturally disconnected.

India spends ₹28,000 crore annually on nutrition programs. But:
- Nobody **predicts** where deficiencies will spike next. We discover malnutrition **after** children are already severely affected
- Fortification is **one-size-fits-all**. Every district gets the same iron-fortified rice, whether their crisis is iron, Vitamin A, B12, or zinc
- Meal recommendations are **culturally tone-deaf**. Telling a tribal family in Jharkhand to "eat a balanced diet" means nothing when they don't know what to buy, how to cook it, or how to afford it within ₹2,500/month

The data to solve this already exists: NFHS-5 health surveys, Agmarknet food prices, IMD weather data, FSSAI fortification standards, ICMR food composition tables. But it all lives in **silos**, never connected, never predictive, never actionable.

So we asked: **What if one platform could predict which deficiencies will spike where, generate precision fortification strategies, and create culturally appropriate meal plans families will actually eat, all within their budget?**

That became **Anya**, meaning "grace" in Sanskrit. Because every child deserves adequate nutrition, regardless of which district they were born in.

---

## What it does

Anya is an end-to-end AI-powered nutrition intelligence platform built specifically for India. It operates as a three-stage pipeline: **Predict. Fortify. Nourish.**

### 1. PREDICT: Who's at risk?

Our ML engine fuses data from **NFHS-5, Agmarknet food prices, IMD weather, PDS records, and socioeconomic indicators** to generate **per-district, per-micronutrient risk scores** for Iron, Vitamin A, Zinc, B12, and Vitamin D.

What makes this India-specific:

| Factor | Why It Matters | How We Model It |
|--------|---------------|-----------------|
| Monsoon seasonality | Hunger peaks pre-harvest (Jun-Sep) | Seasonal decomposition in LSTM |
| Festival cycles | Fasting periods (Navratri, Ramadan) affect nutrition | Calendar feature encoding |
| Marriage season | Food prices spike, families eat less | Price elasticity modeling |
| Migration patterns | Male migration leaves women/children vulnerable | NREGA enrollment as proxy |
| Caste-based diet | Vegetarian communities have different deficiency profiles | Demographic stratification |
| Tribal vs non-tribal | Tribal blocks have 2-3x worse outcomes | Separate sub-models |
| PDS disruptions | When ration shops close, malnutrition spikes | PDS offtake anomaly detection |

The system covers India's **top 10 most malnourished aspirational districts** with real data for **1.6 crore citizens**, generating risk scores like:

- 🔴 **Iron: 79% CRITICAL** (rice-dominant diet + low egg intake)
- 🔴 **Vitamin A: 65% CRITICAL** (seasonal vegetable scarcity)
- 🟡 **Zinc: 44% MODERATE** (stable)
- 🟠 **B12: 55% HIGH** (predominantly vegetarian population)

### 2. FORTIFY: What nutrients are needed and how do we deliver them?

India's current approach is broken: fortify ALL rice with iron and distribute EVERYWHERE. A district with a Vitamin A crisis gets iron-fortified rice it doesn't urgently need. Tribal communities eating millets, not rice, get nothing. No cost optimization. Limited budget spread thin everywhere.

Anya generates **precision fortification strategies** per district using linear programming:

| Vehicle | Micronutrient | Target | Cost | Projected Impact |
|---------|--------------|--------|------|-----------------|
| PDS Rice (FRK) | Iron + Folic Acid + B12 | General population | ₹0.73/kg | ↓18% anemia |
| Anganwadi THR | Zinc + Vitamin A | Children 6-36 months | ₹1.2/packet | ↓31% VAD |
| Double Fortified Salt | Iron + Iodine | All households via PDS | ₹2/kg | ↓12% anemia |
| Edible Oil | Vitamin A + D | All households | ₹0.50/liter | ↓24% night blindness |
| Mid-Day Meal Flour | Iron + Zinc + B-complex | School children 6-14 | ₹0.90/kg | ↓15% anemia |

The optimizer accounts for **bioavailability science**: iron pairs with Vitamin C for 2-3x absorption, but iron and calcium compete, so they get separated into different meals and delivery channels.

Projected outcomes for Alirajpur: **Anemia 79% to 53% (↓33%), Vitamin A deficiency 65% to 42% (↓35%)** at a cost of **₹12.4 lakhs/quarter**.

### 3. NOURISH: Meals people will actually eat

India's food culture is the most complex in the world. 9 major religious/cultural dietary patterns. Regional staple variations. Pregnancy taboos that harm nutrition. Seasonal fasting calendars. Budget constraints as low as ₹2,500/month.

Anya generates **7-day culturally aware meal plans** optimized across 8 simultaneous constraints:

1. **Nutritional**: Meet WHO/ICMR RDA for each family member
2. **Cultural**: Only include foods this family would actually eat (9 groups: Tribal Hindu, Muslim, Jain, Sikh, Hindu Brahmin, and more)
3. **Economic**: Minimize cost while meeting nutrition targets
4. **Availability**: Only use ingredients available at local market + PDS + seasonal wild foods
5. **Practical**: Recipes cookable on a single-burner chulha, no fridge needed
6. **Fortification-aware**: Account for nutrients already in fortified rice/salt/oil
7. **Bioavailability**: Pair iron-rich foods with Vitamin C sources, separate calcium inhibitors
8. **Lifecycle**: Different portions for pregnant mothers vs infants vs elderly

The system highlights **indigenous superfoods** that outperform expensive supplements: red ant chutney (iron-rich), ragi (calcium + iron), moringa (Vitamin A), wild amaranth, drumstick leaves, mahua flowers, bamboo shoots, and wild mushrooms (B12).

Our model calculates it costs just **₹847 per person** to shift them out of nutritional risk through this pipeline.

---

## How we built it

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React.js, D3.js, Mapbox | Dashboard with India district heatmaps and interactive visualizations |
| Backend | Python, FastAPI | RESTful API serving prediction, fortification, and meal engines |
| Risk Prediction | XGBoost + LSTM (PyTorch) | Multi-source data fusion for per-micronutrient risk scoring |
| Fortification Optimizer | PuLP, SciPy | Linear programming maximizing deficiency reduction per rupee spent |
| Meal Generator | Constraint satisfaction + LLM | Multi-constraint optimization with cultural rules database |
| Data Layer | PostgreSQL, Redis | Structured storage + fast caching |
| Data Sources | NFHS-5, Agmarknet, IMD, FSSAI, ICMR | Real government open data, no synthetic datasets |

The ML architecture uses an **ensemble approach**: XGBoost handles static demographic and geographic features, while LSTM captures temporal patterns (seasonal hunger, food price trends, weather). A weighted fusion layer combines both into per-micronutrient risk scores with confidence intervals and causal attribution.

The fortification optimizer solves a linear programming problem: maximize nutrition impact per rupee, subject to FSSAI safe upper limits, bioavailability interaction constraints, existing fortification programs, supply chain feasibility, and population dietary patterns.

The meal generator runs a constraint satisfaction engine against the **Indian Food Composition Tables (ICMR)**, a cultural rules database covering 9 religious/cultural groups, local market pricing from Agmarknet, PDS entitlement data, and WHO/ICMR RDA values. It produces weekly plans with per-meal costs, nutrient coverage percentages, bioavailability tips, and food group breakdowns.

---

## Challenges we ran into

- **Indian food is incredibly complex to model.** A single dish like "dal" varies in ingredients, nutrition, and cost across every state. Building the cultural rules database for 9 religious/cultural groups with accurate dietary restrictions, pregnancy taboos, fasting calendars, and indigenous food knowledge was the hardest non-technical challenge.

- **Bioavailability modeling.** Iron absorption varies 3-10x depending on what else is in the meal. Building the micronutrient interaction matrix (iron + Vitamin C = enhances, iron + calcium = inhibits, zinc + iron = competes) and enforcing it across both fortification recommendations and meal generation was scientifically demanding.

- **Data inconsistency across government sources.** NFHS-5 has district-level data but Agmarknet food prices are at mandi (market) level. Reconciling geographic granularity across health, agriculture, weather, and economic datasets required careful mapping and normalization.

- **Multi-constraint optimization in real-time.** Generating a meal plan that simultaneously meets nutrition targets, respects cultural rules, uses only locally available foods, accounts for fortified food inputs, optimizes bioavailability pairings, differentiates by family member lifecycle stage, AND fits a ₹2,500/month budget is a hard optimization problem. Getting it to run in under 2 seconds required careful algorithmic design.

- **Addressing cultural sensitivity without being patronizing.** Pregnancy myths ("don't eat papaya", "eat less so baby is small") actively harm nutrition. We had to design a myth-busting approach that respects elders and frames corrections as "new knowledge" rather than "you're wrong", because in Indian families, the mother-in-law is often the key dietary decision-maker.

---

## What we learned

- **Malnutrition in India is not a food problem. It is a data, delivery, and cultural sensitivity problem.** The food exists. The government programs exist. What's missing is the intelligence layer connecting prediction to action.

- **Cultural context is non-negotiable.** A nutrition solution that ignores caste, religion, regional food habits, and pregnancy taboos will fail in India, no matter how technically impressive it is. We built support for 9 distinct cultural groups because one-size-fits-all kills adoption.

- **Indigenous foods are nutritional powerhouses.** Red ant chutney (iron), ragi (calcium + iron), moringa (Vitamin A), wild mushrooms (B12) outperform expensive supplements but have been systematically overlooked by modern nutrition programs. The tribal diet is often already nutritious. The problem is consistency, not content.

- **Bioavailability matters as much as quantity.** You can eat enough iron on paper but absorb almost none if paired with the wrong foods. This invisible factor is a major driver of India's anemia crisis and almost no existing tool accounts for it.

- **Government open data is a goldmine.** NFHS-5, Agmarknet, Soil Health Cards, IMD, ICMR Food Composition Tables. The infrastructure for intelligent nutrition planning exists. It just needs to be connected.

- **Fortification without personalization is waste.** Sending the same fortified rice everywhere means districts with Vitamin A crises get iron they don't urgently need, while their actual deficiency goes unaddressed. Precision matters.

---

## What's next for Anya

- **Expand to all 640+ districts** with full NFHS-5 coverage and real-time Agmarknet price feeds
- **Integrate with POSHAN Tracker**, the government's existing Anganwadi monitoring platform, so Anya's predictions and meal plans reach 1.4 million Anganwadi workers directly
- **Anganwadi worker mobile app** with offline-first architecture, voice-based UI in 12+ Indian languages, and camera-based MUAC measurement for instant child malnutrition screening
- **Pilot in Nandurbar, Maharashtra** with district ICDS office across 50 Anganwadi centers serving ~2,000 children
- **WhatsApp-based meal plan delivery** sending personalized weekly plans to mothers via voice messages in their local language
- **Real-time food price integration** dynamically adjusting meal plans when local ingredient prices spike
- **Open-source the platform** so other countries with similar challenges can adapt Anya to their context

---

## Built With

`react` `python` `fastapi` `xgboost` `pytorch` `mapbox` `d3js` `pulp` `scipy` `postgresql` `redis` `nfhs-5` `agmarknet`
