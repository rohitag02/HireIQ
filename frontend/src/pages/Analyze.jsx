import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
// Wake up AI service
fetch('https://hireiq-ai.onrender.com/').catch(() => {});

export default function Analyze() {
  const navigate = useNavigate()
  const [targetRole, setTargetRole] = useState('')
  const [company, setCompany] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState('')

  const steps = [
    'Parsing resume structure...',
    'Computing ATS score...',
    'Detecting skill gaps...',
    'Generating suggestions...',
    'Matching job roles...',
    'Finalizing results...'
  ]

  const handleAnalyze = async () => {
    if (!targetRole) return setError('Please enter a target role')
    if (!resumeText) return setError('Please paste your resume text')
    if (!jobDescription) return setError('Please paste the job description')

    setError('')
    setLoading(true)

    let i = 0
    setCurrentStep(steps[0])
    const interval = setInterval(() => {
      i++
      if (i < steps.length) setCurrentStep(steps[i])
    }, 3000)

    try {
      const res = await api.post('/analyze', {
        targetRole, company, resumeText, jobDescription
      })
      clearInterval(interval)
      navigate('/results', {
        state: { results: res.data.results, targetRole, company }
      })
    } catch (err) {
      clearInterval(interval)
      setError(err.response?.data?.error || 'Analysis failed. Make sure all 3 services are running.')
    } finally {
      setLoading(false)
      setCurrentStep('')
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s'
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff' }}>

      {/* TOPBAR */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 32px', height: '64px',
        display: 'flex', alignItems: 'center', gap: '16px'
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.5)', fontSize: '20px',
            cursor: 'pointer', display: 'flex', alignItems: 'center'
          }}
        >
          ←
        </button>
        <span style={{
          fontSize: '20px', fontWeight: '800',
          background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          ⚡ HireIQ — Analyze Resume
        </span>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 24px' }}>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(108,99,255,0.15)',
            border: '1px solid rgba(108,99,255,0.3)',
            borderRadius: '99px', padding: '6px 16px',
            fontSize: '12px', fontWeight: '600',
            color: '#a78bfa', marginBottom: '16px'
          }}>
            ✨ AI Powered Analysis
          </div>
          <h1 style={{
            fontSize: '32px', fontWeight: '800', color: '#ffffff',
            marginBottom: '10px', lineHeight: 1.2
          }}>
            Analyze Your Resume
          </h1>
          <p style={{
            fontSize: '15px', color: 'rgba(255,255,255,0.4)',
            lineHeight: 1.6, maxWidth: '440px', margin: '0 auto'
          }}>
            Get your ATS score, detect skill gaps, and receive personalized AI suggestions
          </p>
        </div>

        {/* FORM CARD */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px', padding: '36px'
        }}>

          {/* Role and Company */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={labelStyle}>Target Role *</label>
              <input
                type="text"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. Software Engineer"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(108,99,255,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div>
              <label style={labelStyle}>Company (optional)</label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g. Google"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(108,99,255,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          </div>

          {/* Resume Text */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Resume Text *</label>
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder="Paste your complete resume here — name, experience, skills, education, projects..."
              style={{ ...inputStyle, minHeight: '160px', resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = 'rgba(108,99,255,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {/* Job Description */}
          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle}>Job Description *</label>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              style={{ ...inputStyle, minHeight: '160px', resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = 'rgba(108,99,255,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(255,107,107,0.1)',
              border: '1px solid rgba(255,107,107,0.2)',
              borderRadius: '10px', padding: '12px 16px',
              marginBottom: '20px', color: '#ff6b6b', fontSize: '13px'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{
              textAlign: 'center', padding: '24px',
              marginBottom: '20px',
              background: 'rgba(108,99,255,0.08)',
              border: '1px solid rgba(108,99,255,0.2)',
              borderRadius: '12px'
            }}>
              <div style={{
                width: '36px', height: '36px',
                border: '3px solid rgba(108,99,255,0.2)',
                borderTop: '3px solid #6c63ff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 12px'
              }} />
              <p style={{ color: '#a78bfa', fontSize: '14px', fontWeight: '500' }}>
                {currentStep}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '4px' }}>
                This usually takes 10–20 seconds
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {/* Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              width: '100%', padding: '16px',
              background: loading
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg, #6c63ff, #a78bfa)',
              color: loading ? 'rgba(255,255,255,0.3)' : 'white',
              border: 'none', borderRadius: '12px',
              fontSize: '16px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.3px', transition: 'all 0.2s'
            }}
          >
            {loading ? 'Analyzing your resume...' : '✨ Run AI Analysis'}
          </button>

        </div>

        {/* TIPS */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px', marginTop: '24px'
        }}>
          {[
            { icon: '🎯', title: 'ATS Score', desc: 'See how well your resume passes ATS filters' },
            { icon: '🔍', title: 'Skill Gaps', desc: 'Find missing skills the job requires' },
            { icon: '💡', title: 'Suggestions', desc: 'Get specific tips to improve your resume' },
          ].map((t, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', padding: '16px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{t.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>
                {t.title}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                {t.desc}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
