import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Analyze() {
  const navigate = useNavigate()
  const [targetRole, setTargetRole] = useState('')
  const [company, setCompany] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('')

  const steps = ['Parsing resume...', 'Computing ATS score...', 'Detecting skill gaps...', 'Generating suggestions...', 'Finalizing results...']

  const inp = { width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }

  const handleAnalyze = async () => {
    if (!targetRole) return setError('Please enter a target role')
    if (!resumeText) return setError('Please paste your resume text')
    if (!jobDescription) return setError('Please paste the job description')
    setError(''); setLoading(true)
    let si = 0; setStep(steps[0])
    const iv = setInterval(() => { si++; if (si < steps.length) setStep(steps[si]) }, 3000)
    try {
      const res = await api.post('/analyze', { targetRole, company, resumeText, jobDescription })
      clearInterval(iv)
      navigate('/results', { state: { results: res.data.results, targetRole, company } })
    } catch (err) {
      clearInterval(iv)
      setError(err.response?.data?.error || 'Analysis failed. Make sure Python AI service is running.')
    } finally { setLoading(false); setStep('') }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a' }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '16px', height: '64px' }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <span style={{ fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⚡ HireIQ — Analyze Resume</span>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>Analyze Your Resume with AI</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '28px' }}>Get ATS score, skill gaps, and improvement suggestions</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {[['Target Role *', targetRole, setTargetRole, 'e.g. Software Engineer'], ['Company (optional)', company, setCompany, 'e.g. Google']].map(([label, val, setter, ph]) => (
              <div key={label}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
                <input style={inp} value={val} onChange={e => setter(e.target.value)} placeholder={ph} />
              </div>
            ))}
          </div>

          {[['Resume Text *', resumeText, setResumeText, 'Paste your complete resume here — name, experience, skills, education, projects...'], ['Job Description *', jobDescription, setJobDescription, 'Paste the full job description here...']].map(([label, val, setter, ph]) => (
            <div key={label} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
              <textarea style={{ ...inp, minHeight: '140px', resize: 'vertical', fontFamily: 'inherit' }} value={val} onChange={e => setter(e.target.value)} placeholder={ph} />
            </div>
          ))}

          {error && <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#ff6b6b', fontSize: '13px' }}>{error}</div>}

          {loading && (
            <div style={{ textAlign: 'center', padding: '20px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #6c63ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>{step}</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          <button onClick={handleAnalyze} disabled={loading}
            style={{ width: '100%', padding: '16px', background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #6c63ff, #a78bfa)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Analyzing...' : '✨ Run AI Analysis'}
          </button>
        </div>
      </div>
    </div>
  )
}