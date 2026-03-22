import { nutrientLabel } from '../utils'

const VEHICLE_ICONS = {
  pds_rice: '🌾',
  anganwadi_thr: '👶',
  double_fortified_salt: '🧂',
  pds_oil: '🫙',
  mdm_flour: '🏫'
}

function OutcomeBar({ nutrient, before, after, reduction_pct }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500 }}>
          {nutrientLabel(nutrient)}
        </span>
        <span style={{ fontSize: 11, color: 'var(--emerald)', fontWeight: 600 }}>
          {before}% → {after}% <span style={{ opacity: 0.7 }}>(↓{reduction_pct}%)</span>
        </span>
      </div>
      <div className="progress-bar-wrap" style={{ position: 'relative' }}>
        {/* Before (wider, dim) */}
        <div style={{
          position: 'absolute', top: 0, left: 0, height: '100%',
          width: `${before}%`, background: 'rgba(255,255,255,0.08)', borderRadius: 99
        }} />
        {/* After (narrower, coloured) */}
        <div
          className="progress-bar-fill low"
          style={{ width: `${after}%`, position: 'relative', zIndex: 1 }}
        />
      </div>
    </div>
  )
}

export default function FortificationPanel({ fortification, loading }) {
  if (loading) {
    return (
      <div>
        <div className="section-header">
          <div className="section-title">Fortification Strategy</div>
        </div>
        {[1,2,3].map(i => (
          <div key={i} className="shimmer" style={{ height: 80, borderRadius: 10, marginBottom: 10 }} />
        ))}
      </div>
    )
  }

  if (!fortification) {
    return (
      <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚗️</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Select a district to see the fortification plan
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          The LP optimizer will identify the best food vehicles and micronutrient mixes
        </div>
      </div>
    )
  }

  const { district_name, state, quarterly_budget_lakhs, budget_used_lakhs,
          fortification_plan, projected_outcomes, summary_stats,
          bioavailability_notes, implementation_notes } = fortification

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">Fortification Strategy — {district_name}</div>
          <div className="section-subtitle">
            Linear Programming optimal allocation · {fortification_plan.length} vehicles selected
          </div>
        </div>
        <div className="section-badge" style={{
          background: 'rgba(255,140,0,0.1)', color: 'var(--saffron)',
          border: '1px solid rgba(255,140,0,0.25)'
        }}>
          Step ② Fortify
        </div>
      </div>

      {/* Budget summary */}
      <div className="budget-summary" style={{ marginBottom: 16 }}>
        <div className="budget-row">
          <span className="budget-label">District: {district_name}, {state}</span>
          <span className="budget-value highlight">₹{quarterly_budget_lakhs}L / quarter</span>
        </div>
        <div className="budget-row">
          <span className="budget-label">Budget Used</span>
          <span className="budget-value">₹{budget_used_lakhs}L ({Math.round(budget_used_lakhs / quarterly_budget_lakhs * 100)}%)</span>
        </div>
        <div className="budget-row">
          <span className="budget-label">Lives Improved (est.)</span>
          <span className="budget-value" style={{ color: 'var(--emerald)' }}>
            {summary_stats.estimated_lives_improved.toLocaleString()}
          </span>
        </div>
        <div className="budget-row">
          <span className="budget-label">Cost per Deficiency Point Reduced</span>
          <span className="budget-value">₹{summary_stats.cost_per_deficiency_point_reduced_inr}</span>
        </div>
        <div className="budget-row">
          <span className="budget-label">Cost-Effectiveness</span>
          <span className="budget-value" style={{
            color: summary_stats.cost_effectiveness_rating === 'Excellent' ? 'var(--emerald)' : 'var(--saffron)'
          }}>
            {summary_stats.cost_effectiveness_rating}
          </span>
        </div>
      </div>

      {/* Fortification vehicles */}
      <div style={{ marginBottom: 16 }}>
        {fortification_plan.map(v => (
          <div key={v.vehicle_id} className="fort-vehicle-row fade-in-up">
            <div className="fort-vehicle-icon">{VEHICLE_ICONS[v.vehicle_id] || '🧪'}</div>
            <div className="fort-vehicle-info">
              <div className="fort-vehicle-name">{v.vehicle_name}</div>
              <div className="fort-vehicle-meta">
                🎯 {v.target_population} · 📊 {v.coverage_pct}% coverage
              </div>
              <div className="fort-nutrient-tags">
                {v.nutrients.map(n => (
                  <span key={n.name} className="fort-nutrient-tag">
                    {n.name} {n.level}
                  </span>
                ))}
              </div>
            </div>
            <div className="fort-impact-pct">
              {v.impacts.length > 0 && (
                <>
                  <div className="fort-impact-value">↓{v.impacts[0].reduction_pct}%</div>
                  <div className="fort-cost">₹{v.quarterly_cost_lakhs}L/qtr</div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Projected outcomes */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Projected Outcomes (3 months)
        </div>
        {Object.entries(projected_outcomes)
          .filter(([_, v]) => v.reduction_pct > 0)
          .sort(([, a], [, b]) => b.reduction_pct - a.reduction_pct)
          .map(([nutrient, data]) => (
            <OutcomeBar
              key={nutrient}
              nutrient={nutrient}
              before={data.before}
              after={data.after}
              reduction_pct={data.reduction_pct}
            />
          ))}
      </div>

      {/* Bioavailability notes */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
          🔬 Bioavailability Science
        </div>
        {bioavailability_notes.map((note, i) => (
          <div key={i} className="tip-item">{note}</div>
        ))}
      </div>

      {/* Download button */}
      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
        📥 Download Procurement Order
      </button>
    </div>
  )
}
