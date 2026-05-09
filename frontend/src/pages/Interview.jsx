import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || ''

async function callGemini(messages, systemPrompt) {
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'ai' ? 'model' : 'user',
    parts: [{ text: m.text }]
  }))
  const lastMsg = messages[messages.length - 1].text
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [...history, { role: 'user', parts: [{ text: lastMsg }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
      })
    }
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.'
}

const COACH_SYSTEM = `You are an expert interview coach with 15 years of experience helping candidates land jobs at top companies.
Your role:
- Help candidates practice interview answers
- Give structured feedback using the STAR method
- Be encouraging but honest
- Keep responses under 150 words
- Use bullet points for feedback
- Always end with one specific improvement tip
When someone shares an answer, evaluate: structure, specificity, examples, and confidence.`

const QUESTION_TYPES = ['Behavioral', 'Technical', 'Situational', 'HR / Culture Fit']

const TYPE_COLORS = {
  'Behavioral': '#6c63ff',
  'Technical': '#43e97b',
  'Situational': '#ffd93d',
  'HR / Culture Fit': '#ff6b6b',
}

const QUICK_REPLIES = [
  'Tell me about yourself',
  'STAR method',
  'Hard question',
  'Salary negotiation',
]

export default function Interview() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Left panel
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [selectedTypes, setSelectedTypes] = useState(['Behavioral', 'Technical', 'Situational'])
  const [questions, setQuestions] = useState([])
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  // Right panel chat
  const [messages, setMessages] = useState([{
    role: 'ai',
    text: '👋 Hello! I\'m your AI interview coach. I can help you:\n\n• Practice answering interview questions\n• Give detailed feedback on your responses\n• Teach the STAR method for behavioral questions\n• Coach you on salary negotiation\n\nWhat would you like to work on?'
  }])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const generateQuestions = async () => {
    if (!role.trim()) { setGenError('Please enter a job role'); return }
    if (selectedTypes.length === 0) { setGenError('Select at least one question type'); return }
    setGenError('')
    setGenerating(true)
    setQuestions([])
    const prompt = `Generate 8 interview questions for a "${role}" role${company ? ` at "${company}"` : ''}.
Question types to include: ${selectedTypes.join(', ')}.
Return ONLY a valid JSON array. No markdown, no backticks, no extra text. Just raw JSON like:
[{"type":"Behavioral","question":"Tell me about a time..."},{"type":"Technical","question":"Explain..."}]`

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.9, maxOutputTokens: 1024 }
          })
        }
      )
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setQuestions(parsed)
    } catch (e) {
      setGenError('Failed to generate: ' + e.message)
    } finally {
      setGenerating(false)
    }
  }

  const practiceQuestion = (q) => {
    const msg = `I want to practice this interview question:\n\n"${q}"\n\nPlease give me a quick tip on how to approach it, then I'll share my answer for feedback.`
    sendMessage(msg)
  }

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || chatLoading) return
    setInput('')
    const updated = [...messages, { role: 'user', text: msg }]
    setMessages(updated)
    setChatLoading(true)
    try {
      const reply = await callGemini(updated, COACH_SYSTEM)
      setMessages(prev => [...prev, { role: 'ai', text: reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${e.message}. Check your VITE_GEMINI_KEY in .env` }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Shared styles
  const fieldLabel = {
    display: 'block', fontSize: '10px', fontWeight: '800',
    letterSpacing: '1.5px', color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase', marginBottom: '7px'
  }
  const fieldInput = {
    width: '100%', padding: '10px 13px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', color: '#fff', fontSize: '13px',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#0f0f1a', color: '#fff', overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>

      {/* ── TOP NAV ── */}
      <div style={{
        height: '56px', flexShrink: 0,
        background: 'rgba(255,255,255,0.025)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: '2px'
      }}>
        <span style={{
          fontSize: '17px', fontWeight: '800', marginRight: '16px',
          background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.3px'
        }}>⚡ HireIQ</span>

        {[
          { label: 'Dashboard', path: '/dashboard', icon: '📊' },
          { label: 'Analyze', path: '/analyze', icon: '📄' },
          { label: 'Interview', path: '/interview', icon: '🎤' },
        ].map(({ label, path, icon }) => {
          const active = path === '/interview'
          return (
            <button key={path} onClick={() => navigate(path)} style={{
              padding: '6px 14px', borderRadius: '7px', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px',
              background: active ? 'rgba(108,99,255,0.22)' : 'transparent',
              color: active ? '#a78bfa' : 'rgba(255,255,255,0.4)',
              fontWeight: active ? '700' : '500',
            }}>{icon} {label}</button>
          )
        })}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '800'
          }}>
            {user?.name?.charAt(0).toUpperCase() || 'D'}
          </div>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            {user?.name?.split(' ')[0] || 'Demo'}
          </span>
          <button onClick={() => { logout(); navigate('/') }} style={{
            padding: '5px 12px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit',
            color: 'rgba(255,255,255,0.35)', fontSize: '12px'
          }}>Logout</button>
        </div>
      </div>

      {/* ── BODY: LEFT + RIGHT ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ════ LEFT PANEL ════ */}
        <div style={{
          width: '290px', flexShrink: 0,
          background: 'rgba(0,0,0,0.2)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          overflowY: 'auto', padding: '20px 16px',
          display: 'flex', flexDirection: 'column', gap: '14px'
        }}>
          {/* Header */}
          <div style={{
            fontSize: '10px', fontWeight: '800', letterSpacing: '2px',
            color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
            paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
            ✦ Question Generator
          </div>

          {/* Job Role */}
          <div>
            <label style={fieldLabel}>Job Role</label>
            <input
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. Data Scientist"
              style={fieldInput}
              onFocus={e => e.target.style.borderColor = 'rgba(108,99,255,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {/* Company */}
          <div>
            <label style={fieldLabel}>Company / Industry</label>
            <input
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="e.g. Fintech startup"
              style={fieldInput}
              onFocus={e => e.target.style.borderColor = 'rgba(108,99,255,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {/* Question Types */}
          <div>
            <label style={fieldLabel}>Question Types</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {QUESTION_TYPES.map(type => {
                const checked = selectedTypes.includes(type)
                return (
                  <label key={type} onClick={() => toggleType(type)} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    cursor: 'pointer', userSelect: 'none'
                  }}>
                    <div style={{
                      width: '17px', height: '17px', borderRadius: '4px', flexShrink: 0,
                      background: checked ? '#6c63ff' : 'rgba(255,255,255,0.06)',
                      border: `2px solid ${checked ? '#6c63ff' : 'rgba(255,255,255,0.15)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s'
                    }}>
                      {checked && <span style={{ color: '#fff', fontSize: '10px', lineHeight: 1, fontWeight: '800' }}>✓</span>}
                    </div>
                    <span style={{ fontSize: '13px', color: checked ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                      {type}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateQuestions}
            disabled={generating}
            style={{
              padding: '12px', borderRadius: '9px', border: 'none',
              background: generating ? 'rgba(108,99,255,0.35)' : 'linear-gradient(135deg, #6c63ff, #a78bfa)',
              color: '#fff', fontWeight: '700', fontSize: '13px',
              cursor: generating ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.2px'
            }}
          >
            {generating ? '⏳ Generating...' : '✦ Generate Questions'}
          </button>

          {/* Error */}
          {genError && (
            <div style={{
              fontSize: '12px', color: '#ff6b6b',
              background: 'rgba(255,107,107,0.08)',
              border: '1px solid rgba(255,107,107,0.15)',
              borderRadius: '7px', padding: '8px 10px'
            }}>
              {genError}
            </div>
          )}

          {/* Generated Questions */}
          {questions.length > 0 && (
            <div>
              <div style={{
                fontSize: '10px', fontWeight: '800', letterSpacing: '1.5px',
                color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
                marginBottom: '10px'
              }}>
                {questions.length} Questions Generated
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {questions.map((q, i) => (
                  <div
                    key={i}
                    onClick={() => practiceQuestion(q.question)}
                    style={{
                      padding: '11px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '9px', cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(108,99,255,0.1)'
                      e.currentTarget.style.borderColor = 'rgba(108,99,255,0.35)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                    }}
                  >
                    <div style={{
                      fontSize: '9px', fontWeight: '800', letterSpacing: '1px',
                      textTransform: 'uppercase', marginBottom: '5px',
                      color: TYPE_COLORS[q.type] || '#a78bfa'
                    }}>
                      {q.type}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                      {q.question}
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(108,99,255,0.5)', marginTop: '6px' }}>
                      Click to practice with AI →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {questions.length === 0 && !generating && (
            <div style={{
              textAlign: 'center', padding: '28px 12px',
              color: 'rgba(255,255,255,0.18)', fontSize: '12px', lineHeight: 1.7
            }}>
              Fill in the form and generate questions to see them here
            </div>
          )}
        </div>

        {/* ════ RIGHT PANEL — CHAT ════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Chat header */}
          <div style={{
            padding: '14px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.015)',
            display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: '800', flexShrink: 0
            }}>AI</div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                Interview Coach
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                Practice answers · Get feedback · Build confidence
              </div>
            </div>
            <div style={{
              marginLeft: 'auto', width: '8px', height: '8px',
              borderRadius: '50%', background: '#43e97b',
              boxShadow: '0 0 8px #43e97b'
            }} />
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', gap: '10px', alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}>
                {/* Avatar */}
                <div style={{
                  width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                  background: msg.role === 'ai'
                    ? 'linear-gradient(135deg, #6c63ff, #a78bfa)'
                    : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '800', color: '#fff'
                }}>
                  {msg.role === 'ai' ? 'AI' : (user?.name?.charAt(0).toUpperCase() || 'U')}
                </div>

                {/* Bubble */}
                <div style={{
                  maxWidth: '70%', padding: '13px 16px', borderRadius: '14px',
                  fontSize: '14px', lineHeight: '1.7', color: '#fff',
                  whiteSpace: 'pre-wrap',
                  background: msg.role === 'ai'
                    ? 'rgba(255,255,255,0.05)'
                    : 'linear-gradient(135deg, #6c63ff, #a78bfa)',
                  borderTopLeftRadius: msg.role === 'ai' ? '4px' : '14px',
                  borderTopRightRadius: msg.role === 'user' ? '4px' : '14px',
                  border: msg.role === 'ai' ? '1px solid rgba(255,255,255,0.07)' : 'none'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {chatLoading && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '9px',
                  background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '800'
                }}>AI</div>
                <div style={{
                  padding: '14px 18px', borderRadius: '14px', borderTopLeftRadius: '4px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', gap: '5px', alignItems: 'center'
                }}>
                  {[0, 1, 2].map(j => (
                    <div key={j} style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: '#a78bfa',
                      animation: `dot-bounce 1.2s ease-in-out ${j * 0.2}s infinite`
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />

            <style>{`
              @keyframes dot-bounce {
                0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
                40% { transform: translateY(-6px); opacity: 1; }
              }
            `}</style>
          </div>

          {/* Quick replies */}
          <div style={{
            padding: '0 24px 10px',
            display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0
          }}>
            {QUICK_REPLIES.map((qr, i) => (
              <button
                key={i}
                onClick={() => sendMessage(qr)}
                disabled={chatLoading}
                style={{
                  padding: '6px 14px', borderRadius: '20px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.55)', fontSize: '12px',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                  e.target.style.borderColor = 'rgba(108,99,255,0.5)'
                  e.target.style.color = '#a78bfa'
                }}
                onMouseLeave={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.target.style.color = 'rgba(255,255,255,0.55)'
                }}
              >
                {qr}
              </button>
            ))}
          </div>

          {/* Input bar */}
          <div style={{
            padding: '0 24px 20px', flexShrink: 0
          }}>
            <div style={{
              display: 'flex', gap: '10px', alignItems: 'flex-end',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '12px 14px'
            }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type your answer or ask anything..."
                rows={1}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#fff', fontSize: '14px', fontFamily: 'inherit',
                  resize: 'none', lineHeight: '1.5', maxHeight: '100px'
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={chatLoading || !input.trim()}
                style={{
                  width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
                  background: chatLoading || !input.trim()
                    ? 'rgba(255,255,255,0.06)'
                    : 'linear-gradient(135deg, #6c63ff, #a78bfa)',
                  border: 'none',
                  cursor: chatLoading || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', color: '#fff', transition: 'all 0.2s'
                }}
              >
                ↑
              </button>
            </div>
            <div style={{
              textAlign: 'center', fontSize: '11px',
              color: 'rgba(255,255,255,0.2)', marginTop: '8px'
            }}>
              Enter to send · Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}