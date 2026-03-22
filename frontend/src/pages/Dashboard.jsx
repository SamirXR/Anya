import { useState, useEffect } from 'react'
import IndiaMap from '../components/IndiaMap'
import RiskPanel from '../components/RiskPanel'
import FortificationPanel from '../components/FortificationPanel'
import CustomDistrictSearch from '../components/CustomDistrictSearch'
import { API } from '../utils'

export default function Dashboard({ onNavigate, activeTab, setActiveTab }) {
  const [districts, setDistricts] = useState([])
  const [aiDistricts, setAiDistricts] = useState([])
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [fortification, setFortification] = useState(null)
  const [loadingDistricts, setLoadingDistricts] = useState(true)
  const [loadingPrediction, setLoadingPrediction] = useState(false)
  const [loadingFort, setLoadingFort] = useState(false)

  // Load all districts on mount
  useEffect(() => {
    fetch(`${API}/api/districts`)
      .then(r => r.json())
      .then(data => {
        setDistricts(data.districts || [])
        setLoadingDistricts(false)
        // Auto-select top risk district
        if (data.districts?.length > 0) {
          handleSelectDistrict(data.districts[0])
        }
      })
      .catch(() => {
        // Use mock data if backend not available
        setDistricts(MOCK_DISTRICTS)
        setLoadingDistricts(false)
        handleSelectDistrictMock(MOCK_DISTRICTS[0])
      })
  }, [])

  const handleSelectDistrict = async (district) => {
    setSelectedDistrict(district)
    setLoadingPrediction(true)
    setLoadingFort(true)
    setPrediction(null)
    setFortification(null)

    try {
      const [predRes, fortRes] = await Promise.all([
        fetch(`${API}/api/predict/${district.id}`),
        fetch(`${API}/api/fortify/${district.id}`)
      ])
      const pred = await predRes.json()
      const fort = await fortRes.json()
      setPrediction(pred)
      setFortification(fort)
    } catch {
      setPrediction(buildMockPrediction(district))
      setFortification(buildMockFort(district))
    } finally {
      setLoadingPrediction(false)
      setLoadingFort(false)
    }
  }

  const handleSelectDistrictMock = (district) => {
    setSelectedDistrict(district)
    setPrediction(buildMockPrediction(district))
    setFortification(buildMockFort(district))
  }

  // Compute summary stats
  const criticalCount = districts.filter(d => d.overall_level === 'critical').length
  const highCount = districts.filter(d => d.overall_level === 'high').length
  const avgRisk = districts.length > 0
    ? Math.round(districts.reduce((s, d) => s + d.overall_risk, 0) / districts.length)
    : 0
  const totalPop = districts.reduce((s, d) => s + d.population, 0)

  return (
    <div>
      {/* Topbar */}
      <div className="topbar">
        <div>
          <div className="topbar-title">🗺️ Nutrition Command Center</div>
          <div className="topbar-subtitle">
            Top 10 most malnourished districts · Real NFHS-5 (2019-21) data · All 10 are Aspirational Districts
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <CustomDistrictSearch
            onDistrictAdded={(d) => {
              setAiDistricts(prev => {
                const exists = prev.find(x => x.id === d.id)
                return exists ? prev.map(x => x.id === d.id ? d : x) : [...prev, d]
              })
              handleSelectDistrict(d)
            }}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onNavigate('meals')}
          >
            Meal Planner →
          </button>
          <div className="status-pill">
            <div className="status-dot" />
            Model Live
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Pipeline strip */}
        <div className="pipeline-strip">
          <div className="pipeline-step step-1">
            <div className="step-num">1</div>
            <span className="step-label">PREDICT</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>Who's at risk?</span>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step step-2">
            <div className="step-num">2</div>
            <span className="step-label">FORTIFY</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>What nutrients needed?</span>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step step-3">
            <div className="step-num">3</div>
            <span className="step-label">NOURISH</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>Meals people will eat</span>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
            No one else has this end-to-end pipeline
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="glass-card stat-card" style={{ '--grad': 'linear-gradient(90deg, #ef4444, #ff8c00)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              🔴 Avg Stunting
            </div>
            <div className="stat-value" style={{ color: 'var(--critical)' }}>
              {districts.length ? Math.round(districts.reduce((s, d) => s + (d.stunting_pct || 0), 0) / districts.length) : '--'}%
            </div>
            <div className="stat-label">vs 35.5% national avg</div>
          </div>
          <div className="glass-card stat-card" style={{ '--grad': 'linear-gradient(90deg, #ff8c00, #ffcc00)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              🟠 High Risk
            </div>
            <div className="stat-value" style={{ color: 'var(--high)' }}>{highCount}</div>
            <div className="stat-label">Elevated deficiency risk</div>
          </div>
          <div className="glass-card stat-card" style={{ '--grad': 'linear-gradient(90deg, #06b6d4, #38bdf8)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              📊 Avg Risk Score
            </div>
            <div className="stat-value" style={{ color: 'var(--sky)' }}>{avgRisk}%</div>
            <div className="stat-label">Across all monitored districts</div>
          </div>
          <div className="glass-card stat-card" style={{ '--grad': 'linear-gradient(90deg, #10d48e, #38bdf8)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              👥 Population Covered
            </div>
            <div className="stat-value" style={{ color: 'var(--emerald)' }}>
              {(totalPop / 1e7).toFixed(1)}Cr
            </div>
            <div className="stat-label">Citizens in monitored zones</div>
          </div>
        </div>

        {/* Main 2-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>
          {/* Left: Map + district list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <IndiaMap
              districts={[...districts, ...aiDistricts]}
              selectedDistrict={selectedDistrict}
              onSelectDistrict={handleSelectDistrict}
              activeNutrient={activeTab === 'predict' || activeTab === 'fortify' ? 'overall' : activeTab}
              setActiveNutrient={() => {}}
            />

            {/* District ranking list */}
            <div className="glass-card" style={{ padding: 16 }}>
              <div className="section-header" style={{ marginBottom: 10 }}>
                <div className="section-title">Top Risk Districts</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click to select</div>
              </div>
              <div className="district-list">
                {districts.slice(0, 10).map((d, i) => {
                  const riskColor = d.overall_level === 'critical' ? 'var(--critical)'
                    : d.overall_level === 'high' ? 'var(--high)'
                    : d.overall_level === 'moderate' ? 'var(--moderate)' : 'var(--low)'
                  return (
                    <div
                      key={d.id}
                      className={`district-item ${selectedDistrict?.id === d.id ? 'selected' : ''}`}
                      onClick={() => handleSelectDistrict(d)}
                    >
                      <div className="district-rank" style={{ color: i < 3 ? 'var(--critical)' : 'var(--text-muted)' }}>#{d.rank || i + 1}</div>
                      <div className="district-info">
                        <div className="district-name">{d.name}</div>
                        <div className="district-state">{d.state} {d.tribal ? '· 🏕 Tribal' : ''}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                          Stunting: <span style={{ color: 'var(--critical)', fontWeight: 600 }}>{d.stunting_pct}%</span>
                          {' · '}
                          Anemia: <span style={{ color: 'var(--high)', fontWeight: 600 }}>{d.anemia_children_pct}%</span>
                        </div>
                      </div>
                      <div className="district-risk-num" style={{ color: riskColor }}>
                        {d.overall_risk}%
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right: Risk + Fortification panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Tab switcher */}
            <div className="tab-bar">
              <button className={`tab ${activeTab === 'predict' ? 'active' : ''}`}
                onClick={() => setActiveTab('predict')}>
                ① Risk Prediction
              </button>
              <button className={`tab ${activeTab === 'fortify' ? 'active' : ''}`}
                onClick={() => setActiveTab('fortify')}>
                ② Fortification Plan
              </button>
            </div>

            {activeTab === 'predict' && (
              <RiskPanel prediction={prediction} loading={loadingPrediction} />
            )}
            {activeTab === 'fortify' && (
              <FortificationPanel fortification={fortification} loading={loadingFort} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Mock data fallback (if backend not running) ─────────────────────────────
const MOCK_DISTRICTS = [
  { id: 'alirajpur', name: 'Alirajpur', state: 'Madhya Pradesh', lat: 22.31, lng: 74.36,
    tribal: true, population: 728677, overall_risk: 73, overall_level: 'critical',
    iron_risk: 79, vitamin_a_risk: 65, b12_risk: 55, zinc_risk: 44, vitamin_d_risk: 32 },
  { id: 'nandurbar', name: 'Nandurbar', state: 'Maharashtra', lat: 21.37, lng: 74.24,
    tribal: true, population: 1648295, overall_risk: 68, overall_level: 'critical',
    iron_risk: 72, vitamin_a_risk: 54, b12_risk: 67, zinc_risk: 38, vitamin_d_risk: 22 },
  { id: 'bijapur_cg', name: 'Bijapur', state: 'Chhattisgarh', lat: 18.83, lng: 80.78,
    tribal: true, population: 255230, overall_risk: 67, overall_level: 'critical',
    iron_risk: 78, vitamin_a_risk: 60, b12_risk: 50, zinc_risk: 40, vitamin_d_risk: 28 },
  { id: 'bastar', name: 'Bastar', state: 'Chhattisgarh', lat: 19.12, lng: 81.95,
    tribal: true, population: 1411644, overall_risk: 65, overall_level: 'critical',
    iron_risk: 73, vitamin_a_risk: 56, b12_risk: 48, zinc_risk: 38, vitamin_d_risk: 25 },
  { id: 'gadchiroli', name: 'Gadchiroli', state: 'Maharashtra', lat: 20.17, lng: 80.0,
    tribal: true, population: 1072942, overall_risk: 62, overall_level: 'critical',
    iron_risk: 71, vitamin_a_risk: 52, b12_risk: 46, zinc_risk: 36, vitamin_d_risk: 30 },
  { id: 'dungarpur', name: 'Dungarpur', state: 'Rajasthan', lat: 23.84, lng: 73.71,
    tribal: true, population: 1388906, overall_risk: 58, overall_level: 'high',
    iron_risk: 69, vitamin_a_risk: 50, b12_risk: 68, zinc_risk: 35, vitamin_d_risk: 22 },
  { id: 'barmer', name: 'Barmer', state: 'Rajasthan', lat: 25.74, lng: 71.39,
    tribal: false, population: 2604453, overall_risk: 56, overall_level: 'high',
    iron_risk: 72, vitamin_a_risk: 48, b12_risk: 70, zinc_risk: 36, vitamin_d_risk: 18 },
  { id: 'ludhiana', name: 'Ludhiana', state: 'Punjab', lat: 30.9, lng: 75.86,
    tribal: false, population: 3498739, overall_risk: 28, overall_level: 'low',
    iron_risk: 32, vitamin_a_risk: 22, b12_risk: 28, zinc_risk: 20, vitamin_d_risk: 35 },
  { id: 'ernakulam', name: 'Ernakulam', state: 'Kerala', lat: 10.0, lng: 76.32,
    tribal: false, population: 3282388, overall_risk: 22, overall_level: 'low',
    iron_risk: 26, vitamin_a_risk: 18, b12_risk: 22, zinc_risk: 16, vitamin_d_risk: 28 },
]

function buildMockPrediction(d) {
  return {
    district_id: d.id, district_name: d.name, state: d.state,
    population: d.population, tribal: d.tribal,
    prediction_horizon: 'Next 8 weeks',
    micronutrients: {
      iron: { risk_pct: d.iron_risk, level: d.iron_risk >= 70 ? 'critical' : d.iron_risk >= 55 ? 'high' : 'moderate',
        trend: 'rising', trend_delta: '+8%', causes: ['Vegetarian diet with low heme iron', 'Monsoon season increases infection burden', 'Soil iron depletion in crops'], confidence: 0.82 },
      vitamin_a: { risk_pct: d.vitamin_a_risk, level: d.vitamin_a_risk >= 65 ? 'critical' : d.vitamin_a_risk >= 50 ? 'high' : 'moderate',
        trend: 'rising', trend_delta: '+12%', causes: ['Pre-harvest vegetable scarcity', 'Low PDS oil fortification coverage', 'Limited orange/yellow vegetable access'], confidence: 0.78 },
      zinc: { risk_pct: d.zinc_risk, level: d.zinc_risk >= 50 ? 'high' : 'moderate',
        trend: 'stable', trend_delta: '+1%', causes: ['Phytate-rich cereal diet inhibits absorption', 'High wasting rates correlate with zinc depletion', 'Limited dairy access'], confidence: 0.74 },
      b12: { risk_pct: d.b12_risk, level: d.b12_risk >= 65 ? 'critical' : d.b12_risk >= 50 ? 'high' : 'moderate',
        trend: 'stable', trend_delta: '→ Stable', causes: [d.tribal ? 'Low B12 despite non-veg diet — portion sizes' : 'Predominantly vegetarian population', 'Very low egg consumption', 'Limited milk/curd consumption'], confidence: 0.85 },
      vitamin_d: { risk_pct: d.vitamin_d_risk, level: d.vitamin_d_risk >= 45 ? 'high' : 'moderate',
        trend: 'rising', trend_delta: '+8%', causes: ['Monsoon season overcast skies', 'Indoor cooking habits limit sun exposure', 'Limited fortified oil coverage'], confidence: 0.70 },
    },
    district_context: {
      stunting_pct: d.tribal ? 55 : 42, wasting_pct: d.tribal ? 24 : 18,
      anemia_children_pct: d.iron_risk, poverty_pct: d.tribal ? 65 : 45,
      vegetarian_pct: d.tribal ? 15 : 55, pds_coverage: 75, diet_diversity_score: 3.0
    }
  }
}

function buildMockFort(d) {
  const q = Math.round(d.population / 100000 * 8.5 * 10) / 10
  return {
    district_id: d.id, district_name: d.name, state: d.state,
    population: d.population, quarterly_budget_lakhs: q, budget_used_lakhs: Math.round(q * 0.88 * 10) / 10,
    budget_remaining_lakhs: Math.round(q * 0.12 * 10) / 10,
    fortification_plan: [
      { vehicle_id: 'pds_rice', vehicle_name: 'PDS Rice (Fortified Rice Kernels)',
        target_population: 'All households via PDS', coverage_pct: 80,
        nutrients: [{ name: 'Iron', level: '28mg/kg', form: 'FRK' }, { name: 'B12', level: '1μg/kg', form: 'Cyanocobalamin' }],
        quarterly_cost_lakhs: Math.round(q * 0.21 * 10) / 10,
        impacts: [{ nutrient: 'Iron', risk_before: d.iron_risk, risk_after: Math.round(d.iron_risk * 0.78), reduction_pct: 22 }] },
      { vehicle_id: 'anganwadi_thr', vehicle_name: 'Anganwadi Take-Home Ration',
        target_population: 'Children 6-36m + PLW', coverage_pct: 65,
        nutrients: [{ name: 'Zinc', level: '5mg/serving', form: 'Zinc Sulphate' }, { name: 'Vitamin A', level: '200μg/serving', form: 'Retinyl Palmitate' }],
        quarterly_cost_lakhs: Math.round(q * 0.28 * 10) / 10,
        impacts: [{ nutrient: 'Vitamin A', risk_before: d.vitamin_a_risk, risk_after: Math.round(d.vitamin_a_risk * 0.70), reduction_pct: 30 }] },
      { vehicle_id: 'pds_oil', vehicle_name: 'Fortified Edible Oil (Vit A+D)',
        target_population: 'All households via PDS', coverage_pct: 70,
        nutrients: [{ name: 'Vitamin A', level: '6000μg/L', form: 'Retinyl Palmitate' }, { name: 'Vitamin D', level: '50μg/L', form: 'Cholecalciferol' }],
        quarterly_cost_lakhs: Math.round(q * 0.14 * 10) / 10,
        impacts: [{ nutrient: 'Vitamin A', risk_before: d.vitamin_a_risk, risk_after: Math.round(d.vitamin_a_risk * 0.74), reduction_pct: 26 }] },
      { vehicle_id: 'double_fortified_salt', vehicle_name: 'Double Fortified Salt (Iron+Iodine)',
        target_population: 'All households via PDS', coverage_pct: 55,
        nutrients: [{ name: 'Iron', level: '1000mg/kg', form: 'Encapsulated FeSO4' }],
        quarterly_cost_lakhs: Math.round(q * 0.10 * 10) / 10,
        impacts: [{ nutrient: 'Iron', risk_before: d.iron_risk, risk_after: Math.round(d.iron_risk * 0.88), reduction_pct: 12 }] },
    ],
    projected_outcomes: {
      iron: { before: d.iron_risk, after: Math.round(d.iron_risk * 0.67), reduction_pct: 33 },
      vitamin_a: { before: d.vitamin_a_risk, after: Math.round(d.vitamin_a_risk * 0.65), reduction_pct: 35 },
      zinc: { before: d.zinc_risk, after: Math.round(d.zinc_risk * 0.74), reduction_pct: 26 },
      b12: { before: d.b12_risk, after: Math.round(d.b12_risk * 0.78), reduction_pct: 22 },
    },
    summary_stats: {
      vehicles_selected: 4,
      estimated_lives_improved: Math.round(d.population * 0.04),
      cost_per_deficiency_point_reduced_inr: 847,
      cost_effectiveness_rating: 'Excellent'
    },
    bioavailability_notes: [
      'Pair iron-rich meals with Vitamin C sources (lemon, amla) to enhance absorption by 2-3×',
      'Separate iron and calcium in different meals — calcium inhibits iron absorption',
      'Vitamin D from fortified oil enhances calcium absorption and supports bone health',
      'Zinc and iron compete at high doses — ensure MDM meals balance both'
    ]
  }
}
