import { useState } from 'react'
import { coverageClass, API } from '../utils'
import { PieChart } from '../components/MealCharts'

const CULTURAL_GROUPS = [
  { id: 'hindu_nonveg', label: 'Hindu (Non-Vegetarian)' },
  { id: 'hindu_vegetarian', label: 'Hindu (Vegetarian)' },
  { id: 'hindu_brahmin', label: 'Hindu Brahmin (Strict Veg)' },
  { id: 'tribal_hindu', label: 'Tribal Hindu' },
  { id: 'muslim', label: 'Muslim' },
  { id: 'sikh', label: 'Sikh' },
  { id: 'jain', label: 'Jain' },
  { id: 'christian', label: 'Christian' },
  { id: 'buddhist', label: 'Buddhist' },
]

const MEMBER_TYPES = [
  { id: 'pregnant', label: '🤰 Pregnant Mother' },
  { id: 'lactating', label: '🤱 Lactating Mother' },
  { id: 'woman', label: '👩 Woman (Adult)' },
  { id: 'man', label: '👨 Man (Adult)' },
  { id: 'infant_6_23m', label: '👶 Infant (6-23 months)' },
  { id: 'child_2_5y', label: '🧒 Child (2-5 years)' },
  { id: 'child_6_14y', label: '🧑 Child (6-14 years)' },
  { id: 'elderly', label: '👴 Elderly (60+)' },
]

const DISTRICTS = [
  'nandurbar', 'gadchiroli', 'korba', 'bastar', 'khunti', 'alirajpur',
  'dungarpur', 'barmer', 'sitapur', 'balrampur', 'bijapur_cg', 'nabarangpur',
  'ludhiana', 'amritsar', 'ernakulam', 'coimbatore', 'raipur', 'bhopal'
]

const SEASONS = [
  { id: 'monsoon', label: '🌧 Monsoon (Jun-Sep)' },
  { id: 'post_harvest', label: '🌾 Post-Harvest (Oct-Nov)' },
  { id: 'winter', label: '❄️ Winter (Dec-Feb)' },
  { id: 'summer', label: '☀️ Summer (Mar-May)' },
]

const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🥜' }

function NutrientBar({ label, pct }) {
  const cls = coverageClass(pct)
  const barColor = pct >= 85 ? 'var(--emerald)' : pct >= 60 ? '#ffcc00' : 'var(--critical)'
  return (
    <div className="coverage-item">
      <div className="coverage-header">
        <span className="coverage-label">{label}</span>
        <span className={`coverage-pct ${cls}`}>{pct}%</span>
      </div>
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill coverage"
          style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
      </div>
    </div>
  )
}

function DayCard({ day, isSelected, onClick }) {
  return (
    <div className={`day-card ${isSelected ? 'selected' : ''}`} onClick={onClick}>
      <div className="day-card-header">
        <div className="day-name">{day.day.slice(0, 3)}</div>
        <div className="day-cost">₹{day.daily_total_inr}</div>
      </div>
      <div className="day-card-body">
        {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => (
          <div key={meal} className="meal-slot">
            <span className="meal-icon">{MEAL_ICONS[meal]}</span>
            <span className="meal-desc" style={{ color: 'var(--text-muted)' }}>
              {day[meal].description.split(' ').slice(0, 3).join(' ')}…
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DayDetail({ day }) {
  if (!day) return null
  return (
    <div className="glass-card fade-in" style={{ padding: 20 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 18, color: 'var(--saffron)' }}>
        {day.day} — ₹{day.daily_total_inr}
      </div>

      {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => (
        <div key={meal} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>{MEAL_ICONS[meal]}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {meal}
            </span>
            <span style={{ fontSize: 11, color: 'var(--saffron)' }}>₹{day[meal].cost}</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4 }}>
            {day[meal].description}
          </div>
          {day[meal].note && (
            <div style={{ fontSize: 11, color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>✓</span> {day[meal].note}
            </div>
          )}
        </div>
      ))}

      {/* Adaptations */}
      {day.child_adaptation && (
        <div style={{
          padding: 12, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)',
          borderRadius: 8, marginBottom: 12
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--sky)', marginBottom: 8 }}>👶 Baby Adaptations</div>
          {Object.entries(day.child_adaptation).map(([meal, desc]) => (
            <div key={meal} style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 3 }}>
              <span style={{ color: 'var(--text-muted)' }}>{MEAL_ICONS[meal]} </span>{desc}
            </div>
          ))}
        </div>
      )}

      {day.pregnant_adaptation && (
        <div style={{
          padding: 12, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)',
          borderRadius: 8, marginBottom: 12
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--violet)', marginBottom: 8 }}>🤰 Pregnant Mother Extras</div>
          {day.pregnant_adaptation.extras.map((e, i) => (
            <div key={i} style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 3 }}>• {e}</div>
          ))}
        </div>
      )}

      {/* Nutrient Coverage */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
          Nutrient Coverage (vs RDA)
        </div>
        <div className="coverage-grid" style={{ padding: 0 }}>
          {[
            ['Iron', day.nutrient_coverage?.iron],
            ['Vitamin A', day.nutrient_coverage?.vitamin_a],
            ['B12', day.nutrient_coverage?.b12],
            ['Zinc', day.nutrient_coverage?.zinc],
            ['Vitamin D', day.nutrient_coverage?.vitamin_d],
            ['Protein', day.nutrient_coverage?.protein],
            ['Calcium', day.nutrient_coverage?.calcium],
            ['Calories', day.nutrient_coverage?.calories],
          ].map(([label, pct]) => pct !== undefined && (
            <NutrientBar key={label} label={label} pct={Math.min(150, pct)} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MealPlanner() {
  const [form, setForm] = useState({
    district: 'nandurbar',
    cultural_group: 'tribal_hindu',
    monthly_budget_inr: 2500,
    season: 'monsoon',
    members: [
      { type: 'pregnant', label: 'Pregnant Mother' },
      { type: 'man', label: 'Father' },
      { type: 'infant_6_23m', label: 'Baby (18 months)' },
      { type: 'elderly', label: 'Grandmother' },
    ]
  })
  const [mealPlan, setMealPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState(0)
  const [error, setError] = useState(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    setMealPlan(null)
    try {
      const res = await fetch(`${API}/api/meals/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district: form.district,
          cultural_group: form.cultural_group,
          monthly_budget_inr: form.monthly_budget_inr,
          season: form.season,
          family_members: form.members.map(m => ({ type: m.type, count: 1, label: m.label }))
        })
      })
      const data = await res.json()
      setMealPlan(data)
      setSelectedDay(0)
    } catch {
      setError('Backend not reachable — showing demo meal plan')
      setMealPlan(buildMockMealPlan(form))
      setSelectedDay(0)
    } finally {
      setLoading(false)
    }
  }

  const addMember = () => {
    setForm(f => ({ ...f, members: [...f.members, { type: 'woman', label: 'Adult' }] }))
  }

  const removeMember = (i) => {
    setForm(f => ({ ...f, members: f.members.filter((_, idx) => idx !== i) }))
  }

  const updateMember = (i, type) => {
    const label = MEMBER_TYPES.find(m => m.id === type)?.label.split(' ').slice(1).join(' ') || type
    setForm(f => ({ ...f, members: f.members.map((m, idx) => idx === i ? { ...m, type, label } : m) }))
  }

  return (
    <div>
      {/* Topbar */}
      <div className="topbar">
        <div>
          <div className="topbar-title">🍛 Culturally-Aware Meal Planner</div>
          <div className="topbar-subtitle">Step ③ NOURISH — Generate weekly meal plans people will actually eat</div>
        </div>
        <div className="status-pill">
          <div className="status-dot" />
          9 Cultural Groups Supported
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
          {/* Form Panel */}
          <div>
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
                Family Profile
              </div>

              {/* District */}
              <div className="form-group">
                <label className="form-label">📍 District</label>
                <select className="form-select"
                  value={form.district}
                  onChange={e => setForm(f => ({ ...f, district: e.target.value }))}>
                  {DISTRICTS.map(d => (
                    <option key={d} value={d}>{d.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>

              {/* Cultural Group */}
              <div className="form-group">
                <label className="form-label">🙏 Religious / Cultural Group</label>
                <select className="form-select"
                  value={form.cultural_group}
                  onChange={e => setForm(f => ({ ...f, cultural_group: e.target.value }))}>
                  {CULTURAL_GROUPS.map(g => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </div>

              {/* Season */}
              <div className="form-group">
                <label className="form-label">🌤 Season</label>
                <select className="form-select"
                  value={form.season}
                  onChange={e => setForm(f => ({ ...f, season: e.target.value }))}>
                  {SEASONS.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div className="form-group">
                <label className="form-label">💰 Monthly Food Budget (₹)</label>
                <input className="form-input" type="number" min="500" max="15000" step="100"
                  value={form.monthly_budget_inr}
                  onChange={e => setForm(f => ({ ...f, monthly_budget_inr: parseInt(e.target.value) }))} />
              </div>

              {/* Family Members */}
              <div className="form-group">
                <label className="form-label">👨‍👩‍👧‍👦 Family Members</label>
                {form.members.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <select className="form-select" style={{ flex: 1, fontSize: 12 }}
                      value={m.type}
                      onChange={e => updateMember(i, e.target.value)}>
                      {MEMBER_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                    <button className="btn btn-ghost btn-sm" onClick={() => removeMember(i)}
                      style={{ padding: '5px 10px', color: 'var(--critical)' }}>✕</button>
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={addMember} style={{ marginTop: 4 }}>
                  + Add Member
                </button>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                onClick={generate}
                disabled={loading}
              >
                {loading ? '⏳ Generating…' : '✨ Generate Meal Plan'}
              </button>

              {error && (
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--moderate)', textAlign: 'center' }}>
                  ⚠ {error}
                </div>
              )}
            </div>

            {/* Cultural intelligence note */}
            <div className="glass-card" style={{ padding: 16, marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--saffron)', marginBottom: 8 }}>
                🧠 Cultural Intelligence Engine
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                This engine knows India's food culture deeply:
                <br />• Jain: no root vegetables, no food after sunset
                <br />• Ramadan: suhoor must be sustaining, PLW exempt from fasting
                <br />• Tribal: indigenous superfoods like red ant chutney (48mg iron/100g!)
                <br />• Navratri: grain-free alternatives for 9 days
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div>
            {!mealPlan && !loading && (
              <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🍛</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                  Your personalised meal plan awaits
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.7 }}>
                  Fill in your family profile and click Generate. Anya will create a 7-day
                  meal plan that respects your religion, fits your budget, uses seasonal
                  local ingredients, and optimises for micronutrient absorption.
                </div>
              </div>
            )}

            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3].map(i => (
                  <div key={i} className="shimmer" style={{ height: i === 1 ? 120 : 200, borderRadius: 14 }} />
                ))}
              </div>
            )}

            {mealPlan && (
              <div className="fade-in">
                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                  <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Weekly Total</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--saffron)' }}>
                      ₹{mealPlan.financial_summary.weekly_total_inr}
                    </div>
                  </div>
                  <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Monthly Estimate</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: mealPlan.financial_summary.within_budget ? 'var(--emerald)' : 'var(--critical)' }}>
                      ₹{mealPlan.financial_summary.monthly_estimate_inr}
                    </div>
                    <div style={{ fontSize: 10, color: mealPlan.financial_summary.within_budget ? 'var(--emerald)' : 'var(--critical)' }}>
                      {mealPlan.financial_summary.within_budget ? '✓ Within budget' : '⚠ Over budget'}
                    </div>
                  </div>
                  <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Avg Iron Coverage</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--sky)' }}>
                      {mealPlan.average_nutrient_coverage.iron}%
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>of daily RDA</div>
                  </div>
                </div>

                {/* 7-day plan grid */}
                <div className="meal-plan-grid" style={{ marginBottom: 20 }}>
                  {mealPlan.weekly_plan.map((day, i) => (
                    <DayCard
                      key={day.day}
                      day={day}
                      isSelected={selectedDay === i}
                      onClick={() => setSelectedDay(i)}
                    />
                  ))}
                </div>

                {/* Day detail */}
                <DayDetail day={mealPlan.weekly_plan[selectedDay]} />

                {/* Supplements */}
                {mealPlan.supplements_recommended?.length > 0 && (
                  <div className="glass-card" style={{ padding: 20, marginTop: 16 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                      💊 Supplements Recommended
                    </div>
                    {mealPlan.supplements_recommended.map((s, i) => (
                      <div key={i} className="supplement-card">
                        <div className="supplement-name">
                          {s.urgency === 'essential' ? '🔴' : '🟡'} {s.nutrient}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 4 }}>{s.reason}</div>
                        <div className="supplement-dose">💊 {s.dose}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Myth Busters */}
                {mealPlan.cultural_notes?.myth_busters?.length > 0 && (
                  <div className="glass-card" style={{ padding: 20, marginTop: 16 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                      🧠 Respectful Myth-Busting
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 12, fontStyle: 'italic' }}>
                      Culturally sensitive messaging — addresses elders, frames as "new knowledge" not "you're wrong"
                    </div>
                    {mealPlan.cultural_notes.myth_busters.map((m, i) => (
                      <div key={i} className="myth-card">
                        <div className="myth-wrong">
                          <span>❌</span>
                          <span>MYTH: {m.myth}</span>
                        </div>
                        <div className="myth-right">
                          <span>✅</span>
                          <span>FACT: {m.reality}</span>
                        </div>
                        {m.hindi && (
                          <div className="myth-hindi">
                            💬 "{m.hindi}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Bioavailability tips */}
                <div className="glass-card" style={{ padding: 20, marginTop: 16 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                    🔬 Bioavailability Tips
                  </div>
                  {mealPlan.bioavailability_tips.map((tip, i) => (
                    <div key={i} className="tip-item">{tip}</div>
                  ))}
                </div>

                <div style={{ marginTop: 16 }}>
                  <PieChart plan={mealPlan} />
                </div>

                {/* Key ingredients */}
                <div className="glass-card" style={{ padding: 20, marginTop: 16 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                    🌾 Key Iron Sources for {mealPlan.cultural_label}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[...mealPlan.key_ingredients.iron_sources, ...mealPlan.key_ingredients.indigenous_superfoods].map((item, i) => (
                      <div key={i} style={{
                        padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                        background: 'rgba(255,140,0,0.08)', border: '1px solid rgba(255,140,0,0.2)',
                        color: 'var(--saffron)'
                      }}>
                        {item.replace(/_/g, ' ')}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                    PDS items: {mealPlan.key_ingredients.pds_items.join(' · ')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Mock meal plan for demo ───────────────────────────────────────────────────
function buildMockMealPlan(form) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const meals = [
    { breakfast: 'Ragi porridge with jaggery & groundnuts', bNote: 'Iron+Calcium combo', bCost: 18,
      lunch: 'Fortified rice + drumstick dal + wild amaranth saag + lemon', lNote: 'Vitamin C triples iron absorption', lCost: 28,
      dinner: 'Wheat roti + egg curry + pumpkin sabzi', dNote: 'B12+Vitamin A for children', dCost: 35,
      snack: 'Roasted chana + amla', sNote: 'Iron + Vitamin C best combo', sCost: 8 },
    { breakfast: 'Bajra porridge with jaggery', bNote: 'Bajra has 8mg iron/100g', bCost: 15,
      lunch: 'Rice + egg curry + amaranth saag + lemon', lNote: 'Complete iron trifecta', lCost: 32,
      dinner: 'Ragi mudde + chicken liver curry + spinach', dNote: 'Most nutrient-dense dinner possible', dCost: 42,
      snack: 'Banana + peanut chikki', sNote: 'Energy + folate', sCost: 10 },
    { breakfast: 'Wild greens saag with millet porridge', bNote: 'Indigenous forest food', bCost: 12,
      lunch: 'Rice khichdi + spinach dal + fortified oil tadka', lNote: 'Vitamin A from fortified oil', lCost: 24,
      dinner: 'Bajra roti + jaggery sesame ladoo + curd', dNote: 'Iron from jaggery+sesame; calcium at dinner', dCost: 28,
      snack: 'Dates + sesame seeds', sNote: 'Iron + calcium snack', sCost: 12 },
    { breakfast: 'Ragi porridge with groundnuts & mahua', bNote: 'Indigenous breakfast', bCost: 16,
      lunch: 'Rice + local fish curry + spinach stir fry', lNote: 'B12+Vitamin D from fish', lCost: 38,
      dinner: 'Wheat roti + egg curry + pumpkin sabzi', dNote: 'B12+Vitamin A', dCost: 35,
      snack: 'Roasted chana + amla', sNote: 'Iron absorption booster', sCost: 8 },
    { breakfast: 'Wheat porridge with milk & jaggery', bNote: 'Iron+B12 combo', bCost: 20,
      lunch: 'Bajra roti + horsegram curry + pumpkin sabzi', lNote: 'Horsegram has highest Fe of any pulse', lCost: 22,
      dinner: 'Rice + paneer curry + spinach saag', dNote: 'Serve paneer at dinner, not lunch — calcium+iron separation', dCost: 40,
      snack: 'Milk with jaggery', sNote: 'B12+calcium; separate meal from iron-rich lunch', sCost: 8 },
    { breakfast: 'Sprouted moong chaat with lemon', bNote: 'Vitamin C activates iron absorption', bCost: 14,
      lunch: 'Rice + egg curry + amaranth saag', lNote: 'Iron+B12 power combo', lCost: 30,
      dinner: 'Ragi mudde + chicken liver curry', dNote: 'Chicken liver: 13mg iron + 16mcg B12 per 100g!', dCost: 38,
      snack: 'Wild mushrooms stir fry', sNote: 'Trace B12 + Vitamin D naturally', sCost: 6 },
    { breakfast: 'Ragi porridge with jaggery & banana', bNote: 'Iron + energy', bCost: 18,
      lunch: 'Wheat roti + rajma curry + curd', lNote: 'Rajma: 5mg iron/100g; serve curd at dinner next time', lCost: 26,
      dinner: 'Rice + mutton curry + tomato salad', dNote: 'Heme iron+ zinc from mutton; Vitamin C from tomato', dCost: 55,
      snack: 'Papaya (ripe)', sNote: 'Vitamin A + C — safe in moderate amounts!', sCost: 6 },
  ]

  const hasPregnant = form.members.some(m => m.type === 'pregnant')
  const hasInfant = form.members.some(m => m.type === 'infant_6_23m')

  return {
    cultural_label: CULTURAL_GROUPS.find(g => g.id === form.cultural_group)?.label,
    financial_summary: {
      weekly_total_inr: meals.reduce((s, m) => s + m.bCost + m.lCost + m.dCost + m.sCost, 0),
      monthly_estimate_inr: Math.round(meals.reduce((s, m) => s + m.bCost + m.lCost + m.dCost + m.sCost, 0) * 4.33),
      monthly_budget_inr: form.monthly_budget_inr,
      within_budget: Math.round(meals.reduce((s, m) => s + m.bCost + m.lCost + m.dCost + m.sCost, 0) * 4.33) <= form.monthly_budget_inr,
    },
    average_nutrient_coverage: { iron: 91, vitamin_a: 103, b12: 78, zinc: 89, vitamin_d: 62 },
    weekly_plan: days.map((day, i) => {
      const m = meals[i]
      return {
        day, daily_total_inr: m.bCost + m.lCost + m.dCost + m.sCost,
        breakfast: { description: m.breakfast, note: m.bNote, cost: m.bCost },
        lunch: { description: m.lunch, note: m.lNote, cost: m.lCost },
        dinner: { description: m.dinner, note: m.dNote, cost: m.dCost },
        snack: { description: m.snack, note: m.sNote, cost: m.sCost },
        nutrient_coverage: {
          iron: 85 + Math.floor(Math.random() * 20), vitamin_a: 90 + Math.floor(Math.random() * 25),
          b12: 70 + Math.floor(Math.random() * 20), zinc: 82 + Math.floor(Math.random() * 15),
          vitamin_d: 55 + Math.floor(Math.random() * 20), protein: 88 + Math.floor(Math.random() * 15),
          calcium: 80 + Math.floor(Math.random() * 15), calories: 94 + Math.floor(Math.random() * 10)
        },
        child_adaptation: hasInfant ? {
          breakfast: `Mashed ${m.breakfast.split(' ')[0].toLowerCase()} porridge with milk`,
          lunch: 'Mashed rice-dal khichdi + drumstick leaf powder',
          dinner: `Mashed egg + ${m.dinner.split('+')[1]?.trim().split(' ')[0] || 'vegetable'}`
        } : null,
        pregnant_adaptation: hasPregnant ? {
          extras: ['Extra egg at dinner for B12', 'Amla after lunch to boost iron absorption', '⚠️ Take IFA tablet daily from Anganwadi (free)']
        } : null,
      }
    }),
    supplements_recommended: [
      hasPregnant ? { nutrient: 'Iron + Folic Acid (IFA)', reason: 'Pregnancy requires 35mg/day iron — diet alone insufficient', dose: '1 IFA tablet daily (available free at any Anganwadi)', urgency: 'essential' } : null,
      (form.cultural_group === 'hindu_vegetarian' || form.cultural_group === 'jain' || form.cultural_group === 'buddhist')
        ? { nutrient: 'Vitamin B12', reason: 'Vegetarian diet cannot provide adequate B12', dose: '1mg/day oral cyanocobalamin (available free at PHC/Anganwadi)', urgency: 'essential' } : null,
    ].filter(Boolean),
    cultural_notes: {
      myth_busters: [
        { myth: 'Don\'t eat papaya during pregnancy — it causes miscarriage', reality: 'Ripe papaya in moderate amounts is safe and rich in Vitamin A essential for baby\'s eyes', hindi: 'Pakka papaya safe hai — bacche ki aankhon ke liye bahut zaruri Vitamin A deta hai.', approach: 'Address mother-in-law first, frame as "new medical knowledge"' },
        { myth: 'Eat less during pregnancy so baby stays small for easier delivery', reality: 'Restricting food during pregnancy causes stunting, low birth weight, and complications. Mother needs 350 extra calories/day.', hindi: 'Garbhavati maa ko zyada khana chahiye, kam nahi — bacche ka wajan theek rehna chahiye.', approach: 'Use growth monitoring data to show mother and family' },
      ]
    },
    bioavailability_tips: [
      '🍋 Add lemon/amla to every iron-rich meal — Vitamin C triples iron absorption',
      '🚫 Don\'t drink tea/coffee with meals — tannins block up to 60% of iron absorption',
      '🥛 Have milk/curd at dinner, not lunch — calcium competes with iron at the same meal',
      '🧄 Cook dal with a pinch of DFS (double fortified salt) — hidden iron boost of 1-1.5mg/meal',
      '🥚 Even a small amount of egg or meat alongside plant foods dramatically improves iron absorption',
    ],
    key_ingredients: {
      iron_sources: ['red_ant_chutney', 'jaggery', 'drumstick_leaves', 'wild_amaranth', 'ragi', 'horsegram'],
      indigenous_superfoods: ['mahua_flowers', 'bamboo_shoots', 'wild_mushrooms', 'sal_seeds'],
      pds_items: ['Fortified rice (FRK)', 'Double Fortified Salt (Iron+Iodine)', 'Fortified Edible Oil (Vit A+D)']
    }
  }
}
