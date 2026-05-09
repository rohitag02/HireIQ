import { useLocation, useNavigate } from 'react-router-dom'

function Bar({ label, value }) {
  const color = value >= 70 ? '#43e97b' : value >= 50 ? '#ffd93d' : '#ff6b6b'
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: '700', color }}>{value}%</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '99px', height: '6px' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: '99px' }} />
      </div>
    </div>
  )
}

export default function Results() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { results, targetRole, company } = state || {}
  if (!results) return <div style={{ textAlign: 'center', padding: '80px', color: '#fff' }}>No results. <button onClick={() => navigate('/analyze')} style={{ color: '#6c63ff', background: 'none', border: 'none', cursor: 'pointer' }}>Go back</button></div>

  const sc = v => v >= 70 ? '#43e97b' : v >= 50 ? '#ffd93d' : '#ff6b6b'
  const box = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a' }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '16px', height: '64px' }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <span style={{ fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⚡ HireIQ — Results</span>
        <button onClick={() => navigate('/analyze')} style={{ marginLeft: 'auto', padding: '10px 20px', background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>New Analysis</button>
      </div>

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={box}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>{targetRole}{company ? ` @ ${company}` : ''}</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '20px' }}>Analysis completed just now</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {[['Overall', results.overall_score], ['ATS Score', results.ats_score], ['Keywords', results.keyword_match], ['Experience', results.experience_match], ['Interview Ready', results.interview_readiness]].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '28px', fontWeight: '800', color: sc(v) }}>{v}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={box}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)' }}>Score Breakdown</h3>
          <Bar label="Overall Match" value={results.overall_score} />
          <Bar label="ATS Score" value={results.ats_score} />
          <Bar label="Keyword Match" value={results.keyword_match} />
          <Bar label="Experience Match" value={results.experience_match} />
          <Bar label="Interview Readiness" value={results.interview_readiness} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={box}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '16px', color: '#43e97b', textTransform: 'uppercase' }}>✅ Strengths</h3>
            {results.strengths?.map((s, i) => <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}><span style={{ color: '#43e97b' }}>✓</span>{s}</div>)}
          </div>
          <div style={box}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '16px', color: '#ff6b6b', textTransform: 'uppercase' }}>❌ Weaknesses</h3>
            {results.weaknesses?.map((s, i) => <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}><span style={{ color: '#ff6b6b' }}>✗</span>{s}</div>)}
          </div>
        </div>

        <div style={box}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)' }}>🏷️ Skills</h3>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', textTransform: 'uppercase' }}>Matched</p>
          <div style={{ marginBottom: '16px' }}>{results.matched_skills?.map((s, i) => <span key={i} style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(67,233,123,0.1)', color: '#43e97b', border: '1px solid rgba(67,233,123,0.2)', borderRadius: '20px', fontSize: '12px', margin: '3px' }}>{s}</span>)}</div>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', textTransform: 'uppercase' }}>Missing</p>
          <div>{results.missing_skills?.map((s, i) => <span key={i} style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '20px', fontSize: '12px', margin: '3px' }}>{s}</span>)}</div>
        </div>

        <div style={box}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)' }}>💡 Suggestions</h3>
          {results.suggestions?.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: i < results.suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', flexShrink: 0, height: 'fit-content', background: s.priority === 'high' ? 'rgba(255,107,107,0.15)' : 'rgba(255,217,61,0.15)', color: s.priority === 'high' ? '#ff6b6b' : '#ffd93d' }}>{s.priority?.toUpperCase()}</span>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '3px' }}>{s.category}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>{s.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={box}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)' }}>🎯 AI Summary</h3>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.8' }}>{results.summary}</p>
        </div>
      </div>
    </div>
  )
}