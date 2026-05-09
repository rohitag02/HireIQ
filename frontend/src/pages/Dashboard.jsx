import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/history/stats').then(res => setStats(res.data)).catch(() => {})
  }, [])

  const navBtn = (label, path, active) => (
    <button onClick={() => navigate(path)} style={{ padding: '8px 20px', background: active ? 'rgba(108,99,255,0.2)' : 'transparent', border: active ? '1px solid rgba(108,99,255,0.5)' : '1px solid transparent', borderRadius: '8px', color: active ? '#a78bfa' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>{label}</button>
  )

  const card = (icon, value, label, sub, color) => (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', flex: 1 }}>
      <div style={{ fontSize: '24px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '36px', fontWeight: '800', color: color || '#fff' }}>{value}</div>
      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{label}</div>
      {sub && <div style={{ fontSize: '12px', color: '#43e97b', marginTop: '6px' }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a' }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '8px', height: '64px' }}>
        <span style={{ fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginRight: '24px' }}>⚡ HireIQ</span>
        {navBtn('Dashboard', '/dashboard', true)}
        {navBtn('Analyze', '/analyze', false)}
        {navBtn('Interview', '/interview', false)}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <button onClick={() => { logout(); navigate('/') }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '13px' }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '40px 32px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Good morning, {user?.name?.split(' ')[0]} 👋</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Here's your career intelligence overview</p>
          </div>
          <button onClick={() => navigate('/analyze')} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>+ New Analysis</button>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
          {card('📄', stats?.stats?.totalAnalyses ?? 0, 'Resumes Analyzed', null, '#fff')}
          {card('🎯', stats?.stats?.bestScore ?? 0, 'Best ATS Score', null, '#a78bfa')}
          {card('🏆', stats?.stats?.bestRole ?? 'None yet', 'Best Role Match', null, '#43e97b')}
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', flex: 1, cursor: 'pointer' }} onClick={() => navigate('/interview')}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>🎤</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Interview Prep</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Practice questions</div>
            <div style={{ fontSize: '12px', color: '#6c63ff', marginTop: '6px' }}>Start now →</div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent Analyses</h3>
          {stats?.recentAnalyses?.length > 0 ? stats.recentAnalyses.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '16px 0', borderBottom: i < stats.recentAnalyses.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(108,99,255,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', fontSize: '18px' }}>📄</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>{a.targetRole} {a.company ? `@ ${a.company}` : ''}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{new Date(a.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: a.overallScore >= 70 ? '#43e97b' : a.overallScore >= 50 ? '#ffd93d' : '#ff6b6b' }}>{a.overallScore}</div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
              <p>No analyses yet. Click New Analysis to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}