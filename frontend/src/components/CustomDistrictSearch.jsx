import { useState, useRef, useEffect } from 'react'
import { API } from '../utils'

/**
 * CustomDistrictSearch
 * - Search any Indian district via Nominatim (OpenStreetMap)
 * - Click on map to pick location
 * - Uses Azure GPT-4o to generate full nutrition profile
 * - Adds the district to the map alongside the top-10
 */
export default function CustomDistrictSearch({ onDistrictAdded }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [geocodeResults, setGeocodeResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const debounceRef = useRef(null)

  // Geocode search with debounce
  useEffect(() => {
    if (!query || query.length < 3) { setGeocodeResults([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API}/api/geocode?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setGeocodeResults(data.results || [])
      } catch { setGeocodeResults([]) }
      finally { setLoading(false) }
    }, 500)
  }, [query])

  const handleSelect = (result) => {
    setSelected(result)
    setQuery(result.display_name || `${result.name}, ${result.state}`)
    setGeocodeResults([])
    setError(null)
    setSuccess(null)
  }

  const handleAnalyze = async () => {
    if (!selected) return
    setAnalyzing(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`${API}/api/analyze-district`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district_name: selected.name,
          state_name: selected.state,
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Analysis failed')
      }
      const data = await res.json()
      onDistrictAdded(data.district)
      setSuccess(`✅ ${selected.name} analyzed and added to the map!`)
      setIsOpen(false)
      setQuery('')
      setSelected(null)
    } catch (e) {
      setError(e.message || 'AI analysis failed. Check Azure credentials in .env')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        className="btn btn-primary btn-sm"
        onClick={() => setIsOpen(true)}
        style={{ background: 'var(--saffron)', color: '#000', fontWeight: 700 }}
      >
        + Add Your District
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }} onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}>
          <div style={{
            width: '100%', maxWidth: 520,
            background: 'var(--glass-bg)',
            border: '1px solid var(--border)',
            borderRadius: 16, padding: 28,
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  🔍 Add Any Indian District
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Search by district name · AI generates full NFHS-5-style nutrition profile
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
              >×</button>
            </div>

            {/* Search input */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(null) }}
                placeholder="Type district name e.g. Koraput, Chandrapur..."
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--border)',
                  borderRadius: 10, color: 'var(--text-primary)',
                  fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
                autoFocus
              />
              {loading && (
                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-muted)' }}>
                  Searching…
                </div>
              )}
            </div>

            {/* Geocode results dropdown */}
            {geocodeResults.length > 0 && (
              <div style={{
                background: 'rgba(11,17,24,0.95)',
                border: '1px solid var(--border)',
                borderRadius: 10, marginBottom: 16, overflow: 'hidden',
              }}>
                {geocodeResults.map((r, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelect(r)}
                    style={{
                      padding: '10px 16px', cursor: 'pointer',
                      borderBottom: i < geocodeResults.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                      {r.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {r.state} · {r.lat.toFixed(3)}°N, {r.lng.toFixed(3)}°E
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected district preview */}
            {selected && (
              <div style={{
                padding: '12px 16px', marginBottom: 16,
                background: 'rgba(255,140,0,0.08)',
                border: '1px solid rgba(255,140,0,0.25)',
                borderRadius: 10,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--saffron)', marginBottom: 4 }}>
                  📍 {selected.name}, {selected.state}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Coordinates: {selected.lat.toFixed(4)}°N, {selected.lng.toFixed(4)}°E
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  ⚡ Grok-4-fast-reasoning will generate: stunting%, wasting%, anemia%, 5 micronutrient profiles, root causes, and indigenous food data
                </div>
              </div>
            )}

            {/* Error / success */}
            {error && (
              <div style={{
                padding: '10px 14px', marginBottom: 12,
                background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.25)',
                borderRadius: 8, fontSize: 12, color: '#ff6b6b'
              }}>⚠️ {error}</div>
            )}
            {success && (
              <div style={{
                padding: '10px 14px', marginBottom: 12,
                background: 'rgba(16,212,142,0.08)', border: '1px solid rgba(16,212,142,0.25)',
                borderRadius: 8, fontSize: 12, color: 'var(--emerald)'
              }}>{success}</div>
            )}

            {/* AI info banner */}
            <div style={{
              padding: '10px 14px', marginBottom: 16,
              background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)',
              borderRadius: 8, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5
            }}>
              🤖 <strong style={{ color: 'var(--sky)' }}>Powered by Grok-4-fast-reasoning</strong> with NFHS-5 training data.
              The AI interpolates from state-level survey data, comparable district patterns, tribal demography,
              and seasonal nutrition literature to generate a profile. Set your Azure credentials in <code style={{ color: 'var(--saffron)' }}>backend/.env</code>.
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn"
                onClick={() => setIsOpen(false)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAnalyze}
                disabled={!selected || analyzing}
                style={{ flex: 2, opacity: (!selected || analyzing) ? 0.5 : 1 }}
              >
                {analyzing ? '⏳ Analyzing with AI…' : 'Analyze with Grok-4'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
