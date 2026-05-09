import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/history/stats')
      .then(res => setStats(res.data))
      .catch(() => {})
  }, [])

  const sc = v => v >= 70 ? '#43e97b' : v >= 50 ? '#ffd93d' : '#ff6b6b'

  const navBtn = (label, path, active) => (
    <button
      onClick={() => navigate(path)}
      style={{
        padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
        background: active ? 'rgba(108,99,255,0.25)' : 'transparent',
        color: active ? '#a78bfa' : 'rgba(255,255,255,0.5)',
        fontWeight: active ? '700' : '500', fontSize: '14px',
        transition: 'all 0.2s'
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff' }}>

      {/* TOPBAR */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 32px', height: '64px',
        display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        <span style={{
          fontSize: '20px', fontWeight: '800', marginRight: '16px',
          background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          ⚡ HireIQ
        </span>
        {navBtn('Dashboard', '/dashboard', true)}
        {navBtn('Analyze', '/analyze', false)}
        {navBtn('Interview', '/interview', false)}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: '700', color: 'white'
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={() => { logout(); navigate('/') }}
            style={{
              padding: '8px 16px', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
              cursor: 'pointer', fontSize: '13px', color: 'rgba(255,255,255,0.6)',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>

        {/* GREETING */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '36px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
              {(() => {
                const hour = new Date().getHours()
                const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
               return `${greeting}, ${user?.name?.split(' ')[0]} 👋`
              })()}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
              Welcome back! Ready to level up your career today?
            </p>
          </div>
          <button
            onClick={() => navigate('/analyze')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
              color: 'white', border: 'none', borderRadius: '10px',
              cursor: 'pointer', fontWeight: '700', fontSize: '14px',
              whiteSpace: 'nowrap'
            }}
          >
            + New Analysis
          </button>
        </div>

        {/* STAT CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>

          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '24px'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>📄</div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#fff', lineHeight: 1 }}>
              {stats?.stats?.totalAnalyses ?? 0}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
              Resumes Analyzed
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '24px'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🎯</div>
            <div style={{
              fontSize: '32px', fontWeight: '800', lineHeight: 1,
              color: sc(stats?.stats?.bestScore ?? 0)
            }}>
              {stats?.stats?.bestScore ?? 0}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
              Best ATS Score
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '24px'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🏆</div>
            <div style={{
              fontSize: '16px', fontWeight: '700', color: '#fff',
              lineHeight: 1.3, marginTop: '4px'
            }}>
              {stats?.stats?.bestRole ?? 'No analyses yet'}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
              Best Role Match
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '24px'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🎤</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#a78bfa', marginTop: '4px' }}>
              Interview Prep
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
              Practice questions
            </div>
            <div
              onClick={() => navigate('/interview')}
              style={{
              fontSize: '12px', color: '#6c63ff', marginTop: '8px',
              cursor: 'pointer', fontWeight: '600'
                }}
            >
                Start now →
            </div>
          </div>

        </div>

        {/* RECENT ANALYSES */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '28px'
        }}>
          <h3 style={{
            fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
            marginBottom: '20px'
          }}>
            Recent Analyses
          </h3>

          {stats?.recentAnalyses?.length > 0 ? (
            stats.recentAnalyses.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '16px 0',
                borderBottom: i < stats.recentAnalyses.length - 1
                  ? '1px solid rgba(255,255,255,0.06)'
                  : 'none'
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(108,99,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', flexShrink: 0
                }}>
                  📄
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '15px', fontWeight: '600', color: '#ffffff',
                    marginBottom: '4px', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {a.targetRole}{a.company ? ` @ ${a.company}` : ''}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                    {new Date(a.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0
                }}>
                  <div style={{
                    height: '4px', width: '80px', background: 'rgba(255,255,255,0.08)',
                    borderRadius: '99px', overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%', width: `${a.overallScore}%`,
                      background: sc(a.overallScore), borderRadius: '99px'
                    }} />
                  </div>
                  <div style={{
                    fontSize: '18px', fontWeight: '800',
                    color: sc(a.overallScore), minWidth: '36px', textAlign: 'right'
                  }}>
                    {a.overallScore}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>📋</div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                No analyses yet. Click New Analysis to get started.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}