import { useState } from 'react'
import { riskColor, levelBg, nutrientColor, nutrientIcon, nutrientLabel } from '../utils'

function NutrientCard({ name, data, isExpanded, onToggle }) {
  const color = nutrientColor(name)
  const trendIcon = data.trend === 'rising' ? '↑' : data.trend === 'falling' ? '↓' : '→'
  const trendClass = data.trend === 'rising' ? 'trend-up' : data.trend === 'falling' ? 'trend-down' : 'trend-stable'

  return (
    <div
      className="nutrient-card glass-card"
      style={{ background: levelBg(data.level), cursor: 'pointer' }}
      onClick={onToggle}
    >
      <div className="nutrient-card-header">
        <div className="nutrient-name" style={{ color }}>
          <span>{nutrientIcon(name)}</span>
          {nutrientLabel(name)}
        </div>
        <div className={`risk-badge ${data.level}`}>{data.level}</div>
      </div>

      <div className="nutrient-pct" style={{ color }}>
        {data.risk_pct}%
      </div>

      <div className="progress-bar-wrap" style={{ marginBottom: 8 }}>
        <div
          className={`progress-bar-fill ${data.level}`}
          style={{ width: `${data.risk_pct}%` }}
        />
      </div>

      <div className="nutrient-trend">
        <span className={trendClass}>{trendIcon} {data.trend_delta}</span>
        <span style={{ margin: '0 4px', color: 'var(--text-muted)' }}>·</span>
        <span>Next 8 wks</span>
      </div>

      {isExpanded && data.causes && (
        <div className="cause-list fade-in" style={{ marginTop: 10 }}>
          {data.causes.map((c, i) => (
            <div key={i} className="cause-item">{c}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RiskPanel({ prediction, loading }) {
  const [expanded, setExpanded] = useState(null)

  if (loading) {
    return (
      <div>
        <div className="section-header">
          <div>
            <div className="section-title">Deficiency Risk Prediction</div>
            <div className="section-subtitle">Loading district data…</div>
          </div>
        </div>
        <div className="nutrient-grid">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="shimmer" style={{ height: 130, borderRadius: 10 }} />
          ))}
        </div>
      </div>
    )
  }

  if (!prediction) {
    return (
      <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Select a district on the map
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Click any bubble to see the AI deficiency risk prediction
        </div>
      </div>
    )
  }

  const { micronutrients, district_name, state, prediction_horizon, district_context } = prediction

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">
            📍 {district_name}, {state}
          </div>
          <div className="section-subtitle">
            Prediction horizon: {prediction_horizon} · Model: XGBoost + LSTM
          </div>
        </div>
        <div className="section-badge" style={{
          background: 'rgba(56,189,248,0.1)', color: 'var(--sky)',
          border: '1px solid rgba(56,189,248,0.25)'
        }}>
          Step ① Predict
        </div>
      </div>

      {/* Context strip */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Stunting', value: `${district_context.stunting_pct}%` },
          { label: 'Wasting', value: `${district_context.wasting_pct}%` },
          { label: 'Child Anemia', value: `${district_context.anemia_children_pct}%` },
          { label: 'PDS Coverage', value: `${district_context.pds_coverage}%` },
          { label: 'Diet Diversity', value: `${district_context.diet_diversity_score}/6` },
          { label: 'Poverty', value: `${district_context.poverty_pct}%` },
        ].map(({ label, value }) => (
          <div key={label} style={{
            padding: '5px 12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            borderRadius: 99,
            fontSize: 11,
            color: 'var(--text-secondary)'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}: </span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Nutrient grid */}
      <div className="nutrient-grid">
        {Object.entries(micronutrients).map(([name, data]) => (
          <NutrientCard
            key={name}
            name={name}
            data={data}
            isExpanded={expanded === name}
            onToggle={() => setExpanded(expanded === name ? null : name)}
          />
        ))}
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
        Click any card to see root causes · Confidence: ~82%
      </div>
    </div>
  )
}
