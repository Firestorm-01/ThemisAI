import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Send, Image as ImageIcon, X, Scale, Trash2, BookOpen } from 'lucide-react'
import SourcesPanel from '../components/SourcesPanel'
import AudioRecorder from '../components/AudioRecorder'
import { queryText, queryAudio, queryImage } from '../utils/api'
import { useToast } from '../hooks/useToast'

const WELCOME = {
  id: 'welcome',
  role: 'ai',
  content: `**Namaste! I am ThemisAI.**

Ask me anything about:
- **IPC 1860** — offences, punishments, definitions
- **Constitution of India** — fundamental rights, articles
- **CrPC 1973** — procedure, bail, arrest, FIR
- **Landmark judgments** — Supreme Court precedents

Upload documents via the Evidence tab, or use the 🎙 mic for voice queries.

*All responses cite sources. No hallucinations.*`,
  sources: [],
  graphContext: [],
  modality: 'text',
}

// Detect mobile
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn, { passive: true })
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

export default function Chat() {
  const [messages, setMessages]         = useState([WELCOME])
  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [imageFile, setImageFile]       = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [activeSources, setActiveSources] = useState({ sources: [], graphContext: [] })
  // Mobile: show sources drawer
  const [showSources, setShowSources]   = useState(false)
  const [topK]                          = useState(5)
  const isMobile                        = useIsMobile()

  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)
  const imageInputRef  = useRef(null)
  const { addToast }   = useToast()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }])
  }, [])

  const handleTextSubmit = useCallback(async () => {
    const query = input.trim()
    if (!query && !imageFile) return
    if (loading) return

    setLoading(true)
    setInput('')

    if (imageFile) {
      addMessage({ role: 'user', content: query || 'What legal information does this document contain?', modality: 'image', imagePreview })
      const capturedFile = imageFile
      setImageFile(null)
      setImagePreview(null)
      try {
        const res = await queryImage(capturedFile, query || undefined, topK)
        addMessage({ role: 'ai', content: res.answer, sources: res.sources, graphContext: res.graph_context || [], modality: 'image', queryUsed: res.query_used })
        setActiveSources({ sources: res.sources, graphContext: res.graph_context || [] })
      } catch (err) {
        addMessage({ role: 'error', content: err.message })
        addToast(err.message, 'error')
      }
    } else {
      addMessage({ role: 'user', content: query, modality: 'text' })
      try {
        const res = await queryText(query, topK, true)
        addMessage({ role: 'ai', content: res.answer, sources: res.sources, graphContext: res.graph_context || [], modality: 'text', queryUsed: res.query_used })
        setActiveSources({ sources: res.sources, graphContext: res.graph_context || [] })
      } catch (err) {
        addMessage({ role: 'error', content: err.message })
        addToast(err.message, 'error')
      }
    }
    setLoading(false)
  }, [input, imageFile, imagePreview, loading, topK, addMessage, addToast])

  const handleAudioSubmit = useCallback(async (audioBlob) => {
    if (loading) return
    setLoading(true)
    addMessage({ role: 'user', content: '🎙 Voice query submitted…', modality: 'audio' })
    try {
      const ext = audioBlob.type.includes('webm') ? 'webm' : 'wav'
      const res = await queryAudio(audioBlob, `recording.${ext}`, topK)
      setMessages(prev => {
        const updated = [...prev]
        const last = updated.findLastIndex(m => m.role === 'user' && m.modality === 'audio')
        if (last !== -1) updated[last] = { ...updated[last], content: `🎙 "${res.query_used}"` }
        return updated
      })
      addMessage({ role: 'ai', content: res.answer, sources: res.sources, graphContext: res.graph_context || [], modality: 'audio', queryUsed: res.query_used })
      setActiveSources({ sources: res.sources, graphContext: res.graph_context || [] })
    } catch (err) {
      addMessage({ role: 'error', content: err.message })
      addToast(err.message, 'error')
    }
    setLoading(false)
  }, [loading, topK, addMessage, addToast])

  const handleImageSelect = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { addToast('Please select an image file.', 'error'); return }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [addToast])

  const clearChat = useCallback(() => {
    setMessages([WELCOME])
    setActiveSources({ sources: [], graphContext: [] })
    setInput('')
    setImageFile(null)
    setImagePreview(null)
    setShowSources(false)
  }, [])

  // Desktop: Enter sends. Mobile: Enter = newline (use send button)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
      e.preventDefault()
      handleTextSubmit()
    }
  }

  const canSend = !loading && (input.trim().length > 0 || !!imageFile)

  return (
    <>
      <style>{`
        .chat-root {
          height: calc(100dvh - 68px);
          display: flex;
          flex-direction: column;
          background: var(--parch);
          overflow: hidden;
          position: relative;
        }
        .chat-inner {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 300px;
          overflow: hidden;
          min-height: 0;
        }
        @media (max-width: 767px) {
          .chat-inner { grid-template-columns: 1fr; }
          .sources-sidebar { display: none !important; }
        }
        .messages-area {
          flex: 1; overflow-y: auto;
          padding: 1rem 1rem 0.5rem;
          display: flex; flex-direction: column; gap: 1rem;
          -webkit-overflow-scrolling: touch;
        }
        @media (min-width: 768px) {
          .messages-area { padding: 1.5rem 1.5rem 0.5rem; gap: 1.2rem; }
        }
        .bubble-max { max-width: 78%; }
        @media (max-width: 767px) { .bubble-max { max-width: 88%; } }
        .input-bar {
          background: var(--parch2);
          border-top: 3px solid var(--outline);
          padding: 0.7rem 0.8rem;
          display: flex; gap: 0.5rem; align-items: flex-end;
          flex-shrink: 0;
        }
        @media (min-width: 768px) { .input-bar { padding: 0.9rem 1.2rem; gap: 0.6rem; } }
        .chat-textarea {
          flex: 1;
          background: var(--white);
          border: 3px solid var(--outline);
          border-radius: 14px;
          padding: 0.6rem 0.9rem;
          font-family: 'Nunito Sans', sans-serif;
          font-weight: 700;
          /* 16px minimum to prevent iOS zoom */
          font-size: 16px;
          color: var(--ink);
          outline: none;
          box-shadow: 2px 2px 0 var(--outline);
          resize: none;
          min-height: 44px;
          max-height: 110px;
          line-height: 1.45;
          -webkit-appearance: none;
          transition: box-shadow 0.15s;
        }
        .chat-textarea:focus { box-shadow: 3px 3px 0 var(--outline); }
        .icon-btn {
          width: 44px; height: 44px;
          border-radius: 50%;
          border: 3px solid var(--outline);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 2px 2px 0 var(--outline);
          flex-shrink: 0;
          cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s;
          -webkit-tap-highlight-color: transparent;
        }
        .icon-btn:active { transform: translate(1px,1px); box-shadow: 1px 1px 0 var(--outline); }
        /* Sources drawer (mobile) */
        .sources-drawer-overlay {
          display: none;
          position: fixed; inset: 0; z-index: 300;
          background: rgba(6,44,67,0.5);
          backdrop-filter: blur(2px);
        }
        .sources-drawer {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 301;
          background: var(--parch2);
          border-top: 3px solid var(--outline);
          border-radius: 20px 20px 0 0;
          max-height: 70dvh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 767px) {
          .sources-drawer-overlay { display: block; }
        }
      `}</style>

      <div className="chat-root">

        {/* ── TOPBAR ── */}
        <div style={{
          background: 'var(--ink)',
          borderBottom: '3px solid var(--gold)',
          padding: '0.7rem 1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
          gap: '0.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Scale size={18} color="var(--gold)" />
            <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1rem', color: 'var(--gold)' }}>
              Case Room
            </span>
            <span className="tag tag-navy" style={{ fontSize: '0.55rem' }}>Active</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Mobile: sources toggle */}
            {isMobile && (
              <button
                onClick={() => setShowSources(true)}
                style={{
                  background: activeSources.sources.length ? 'rgba(229,168,48,0.15)' : 'none',
                  border: activeSources.sources.length ? '2px solid var(--gold)' : '2px solid transparent',
                  borderRadius: 50,
                  padding: '0.3rem 0.7rem',
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  color: activeSources.sources.length ? 'var(--gold)' : 'var(--steel)',
                  fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '0.72rem',
                  cursor: 'pointer',
                }}
              >
                <BookOpen size={13} />
                Sources {activeSources.sources.length > 0 && `(${activeSources.sources.length})`}
              </button>
            )}
            <button
              onClick={clearChat}
              style={{
                background: 'none', border: 'none', color: 'var(--steel)',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '0.72rem',
                cursor: 'pointer', padding: '0.3rem 0.5rem', borderRadius: 8,
              }}
            >
              <Trash2 size={13} />
              {!isMobile && 'Clear'}
            </button>
          </div>
        </div>

        {/* ── MAIN AREA ── */}
        <div className="chat-inner">

          {/* Chat column */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

            {/* Messages */}
            <div className="messages-area">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    msg={msg}
                    onClickSources={() => {
                      if (msg.sources?.length || msg.graphContext?.length) {
                        setActiveSources({ sources: msg.sources || [], graphContext: msg.graphContext || [] })
                        if (isMobile) setShowSources(true)
                      }
                    }}
                  />
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
                  <AiAvatar />
                  <div style={{
                    background: 'var(--white)', border: '3px solid var(--outline)',
                    borderLeft: '4px solid var(--steel)', borderRadius: '4px 18px 18px 18px',
                    padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
                    boxShadow: '3px 3px 0 var(--outline)',
                  }}>
                    <div className="spinner" style={{ width: 16, height: 16 }} />
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '0.78rem', color: 'var(--steel)' }}>
                      Retrieving from corpus…
                    </span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Image preview strip */}
            <AnimatePresence>
              {imagePreview && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{
                    background: 'var(--parch2)', borderTop: '2px solid var(--outline)',
                    padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.7rem', flexShrink: 0,
                  }}
                >
                  <img src={imagePreview} alt="Selected"
                    style={{ height: 44, width: 44, objectFit: 'cover', border: '2px solid var(--outline)', borderRadius: 8 }} />
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '0.72rem', color: 'var(--steel)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {imageFile?.name}
                  </span>
                  <button onClick={() => { setImageFile(null); setImagePreview(null) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4, minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── INPUT BAR ── */}
            <div className="input-bar">
              <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />

              {/* Image attach */}
              <button
                className="icon-btn"
                onClick={() => imageInputRef.current?.click()}
                disabled={loading}
                style={{
                  background: imageFile ? 'var(--gold)' : 'var(--white)',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                <ImageIcon size={16} color={imageFile ? 'var(--ink)' : 'var(--steel)'} />
              </button>

              {/* Audio */}
              <AudioRecorder onSubmit={handleAudioSubmit} disabled={loading} />

              {/* Textarea */}
              <textarea
                ref={inputRef}
                className="chat-textarea"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder={imageFile ? 'Ask about this image…' : 'Query IPC, Constitution, judgments…'}
                rows={1}
              />

              {/* Send */}
              <motion.button
                className="icon-btn"
                whileTap={{ scale: canSend ? 0.93 : 1 }}
                onClick={handleTextSubmit}
                disabled={!canSend}
                style={{
                  background: canSend ? 'var(--gold)' : 'var(--mist)',
                  cursor: canSend ? 'pointer' : 'not-allowed',
                }}
              >
                {loading
                  ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  : <Send size={16} color={canSend ? 'var(--ink)' : 'var(--steel)'} />
                }
              </motion.button>
            </div>
          </div>

          {/* Desktop sources sidebar */}
          <div className="sources-sidebar" style={{
            borderLeft: '3px solid var(--outline)',
            background: 'var(--parch2)',
            display: 'flex', flexDirection: 'column',
            height: '100%', overflow: 'hidden',
          }}>
            <SourcesPanel sources={activeSources.sources} graphContext={activeSources.graphContext} />
          </div>
        </div>

        {/* ── MOBILE SOURCES DRAWER ── */}
        <AnimatePresence>
          {isMobile && showSources && (
            <>
              <motion.div
                className="sources-drawer-overlay"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowSources(false)}
              />
              <motion.div
                className="sources-drawer"
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {/* Drawer handle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.2rem 0.5rem', borderBottom: '2px solid var(--outline)' }}>
                  <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1rem', color: 'var(--ink)' }}>
                    📚 Sources
                  </span>
                  <button onClick={() => setShowSources(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--steel)', padding: 6, minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={18} />
                  </button>
                </div>
                <div style={{ padding: '0 0 env(safe-area-inset-bottom, 1rem)' }}>
                  <SourcesPanel sources={activeSources.sources} graphContext={activeSources.graphContext} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </>
  )
}

/* ── ChatMessage ── */
function ChatMessage({ msg, onClickSources }) {
  const isUser  = msg.role === 'user'
  const isError = msg.role === 'error'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      style={{ display: 'flex', gap: '0.6rem', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}
    >
      {isUser ? <UserAvatar /> : <AiAvatar />}

      <div className="bubble-max" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <div style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase',
          color: isUser ? 'var(--gold-dark)' : 'var(--steel)',
          textAlign: isUser ? 'right' : 'left',
        }}>
          {isUser ? 'You' : 'ThemisAI'} · {msg.modality || 'text'}
        </div>

        <div style={{
          background: isError ? '#fdf0ef' : isUser ? 'var(--navy)' : 'var(--white)',
          border: '3px solid var(--outline)',
          borderLeft: !isUser ? `4px solid ${isError ? 'var(--danger)' : 'var(--steel)'}` : '3px solid var(--outline)',
          borderRight: isUser ? '4px solid var(--gold)' : '3px solid var(--outline)',
          borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
          padding: '0.75rem 0.95rem',
          boxShadow: '3px 3px 0 var(--outline)',
          wordBreak: 'break-word',
        }}>
          {msg.imagePreview && (
            <img src={msg.imagePreview} alt="Query image"
              style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 8, marginBottom: '0.5rem', display: 'block', border: '2px solid var(--outline)' }} />
          )}
          <div className={isUser ? '' : 'markdown-body'} style={{
            color: isUser ? 'var(--mist)' : isError ? 'var(--danger)' : 'var(--ink)',
            fontSize: '0.86rem',
          }}>
            {isUser || isError
              ? <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, lineHeight: 1.6 }}>{msg.content}</span>
              : <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            }
          </div>
        </div>

        {/* Source tags — tap to open sources */}
        {!isUser && !isError && msg.sources?.length > 0 && (
          <button
            onClick={onClickSources}
            style={{
              background: 'none', border: 'none', padding: 0,
              display: 'flex', gap: '0.3rem', flexWrap: 'wrap', cursor: 'pointer',
              alignSelf: 'flex-start', WebkitTapHighlightColor: 'transparent',
            }}
          >
            {msg.sources.slice(0, 2).map((s, i) => (
              <span key={i} className="tag" style={{ fontSize: '0.56rem' }}>
                § {s.title.length > 24 ? s.title.slice(0, 24) + '…' : s.title}
              </span>
            ))}
            {msg.sources.length > 2 && (
              <span className="tag tag-navy" style={{ fontSize: '0.56rem' }}>
                +{msg.sources.length - 2} more
              </span>
            )}
          </button>
        )}
      </div>
    </motion.div>
  )
}

function AiAvatar() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: 'var(--navy)', border: '3px solid var(--outline)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '2px 2px 0 var(--outline)',
    }}>
      <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.62rem', color: 'var(--gold)' }}>AI</span>
    </div>
  )
}

function UserAvatar() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: 'var(--gold)', border: '3px solid var(--outline)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '2px 2px 0 var(--outline)',
    }}>
      <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.62rem', color: 'var(--ink)' }}>YOU</span>
    </div>
  )
}
