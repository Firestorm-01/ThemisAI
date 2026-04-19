import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Send, Image as ImageIcon, X, Loader, Scale, Trash2 } from 'lucide-react'
import SourcesPanel from '../components/SourcesPanel'
import AudioRecorder from '../components/AudioRecorder'
import { queryText, queryAudio, queryImage } from '../utils/api'
import { useToast } from '../hooks/useToast'

const WELCOME = {
  id: 'welcome',
  role: 'ai',
  content: `**Namaste! I am ThemisAI.**

I am your Indian legal research assistant. Ask me anything about:
- **IPC 1860** — offences, punishments, definitions
- **Constitution of India** — fundamental rights, articles
- **CrPC 1973** — procedure, bail, arrest, FIR
- **Landmark judgments** — Supreme Court precedents

You may also upload documents (PDF, images) via the Evidence page, or send a voice query using the microphone.

*All responses are grounded in retrieved sources. No hallucinations.*`,
  sources: [],
  graphContext: [],
  modality: 'text',
}

export default function Chat() {
  const [messages, setMessages]     = useState([WELCOME])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [imageFile, setImageFile]   = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [activeSources, setActiveSources] = useState({ sources: [], graphContext: [] })
  const [topK]                      = useState(5)

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

  const handleTextSubmit = useCallback(async (e) => {
    e?.preventDefault()
    const query = input.trim()
    if (!query && !imageFile) return
    if (loading) return

    setLoading(true)
    setInput('')

    if (imageFile) {
      // Image query mode
      addMessage({ role: 'user', content: query || 'What legal information does this document contain?', modality: 'image', imagePreview })
      setImageFile(null)
      setImagePreview(null)
      try {
        const res = await queryImage(imageFile, query || undefined, topK)
        addMessage({ role: 'ai', content: res.answer, sources: res.sources, graphContext: res.graph_context || [], modality: 'image', queryUsed: res.query_used })
        setActiveSources({ sources: res.sources, graphContext: res.graph_context || [] })
      } catch (err) {
        addMessage({ role: 'error', content: err.message })
        addToast(err.message, 'error')
      }
    } else {
      // Text query
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
    inputRef.current?.focus()
  }, [input, imageFile, imagePreview, loading, topK, addMessage, addToast])

  const handleAudioSubmit = useCallback(async (audioBlob) => {
    if (loading) return
    setLoading(true)
    addMessage({ role: 'user', content: '🎙 Voice query submitted…', modality: 'audio' })
    try {
      const ext = audioBlob.type.includes('webm') ? 'webm' : 'wav'
      const res = await queryAudio(audioBlob, `recording.${ext}`, topK)
      // Replace placeholder with actual transcript
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
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSubmit() }
  }

  return (
    <div style={{
      height: 'calc(100vh - 68px)',
      display: 'grid',
      gridTemplateColumns: '1fr 300px',
      background: 'var(--parch)',
      overflow: 'hidden',
    }}>

      {/* ── LEFT: CHAT PANEL ── */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

        {/* Chat topbar */}
        <div style={{
          background: 'var(--ink)',
          borderBottom: '3px solid var(--gold)',
          padding: '0.75rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <Scale size={18} color="var(--gold)" />
            <span style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: '1rem', color: 'var(--gold)', letterSpacing: '0.04em',
            }}>Case Room</span>
            <span className="tag tag-navy" style={{ fontSize: '0.58rem' }}>§ Active</span>
          </div>
          <button
            onClick={clearChat}
            title="Clear conversation"
            style={{
              background: 'none', border: 'none', color: 'var(--steel)',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '0.72rem',
              cursor: 'pointer', padding: '0.3rem 0.6rem',
              borderRadius: 8, transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--steel)'}
          >
            <Trash2 size={13} /> Clear
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem',
        }}>
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                msg={msg}
                onClickSources={() => {
                  if (msg.sources?.length || msg.graphContext?.length) {
                    setActiveSources({ sources: msg.sources || [], graphContext: msg.graphContext || [] })
                  }
                }}
              />
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}
            >
              <AiAvatar />
              <div style={{
                background: 'var(--white)',
                border: '3px solid var(--outline)',
                borderLeft: '4px solid var(--steel)',
                borderRadius: '4px 18px 18px 18px',
                padding: '0.9rem 1.1rem',
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                boxShadow: '3px 3px 0 var(--outline)',
              }}>
                <div className="spinner" style={{ width: 18, height: 18 }} />
                <span style={{
                  fontFamily: "'Nunito', sans-serif", fontWeight: 700,
                  fontSize: '0.78rem', color: 'var(--steel)',
                }}>Retrieving from corpus…</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Image preview strip */}
        <AnimatePresence>
          {imagePreview && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                background: 'var(--parch2)',
                borderTop: '2px solid var(--outline)',
                padding: '0.6rem 1.5rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                flexShrink: 0,
              }}
            >
              <img
                src={imagePreview} alt="Selected"
                style={{ height: 50, width: 50, objectFit: 'cover', border: '2px solid var(--outline)', borderRadius: 8 }}
              />
              <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '0.75rem', color: 'var(--steel)' }}>
                {imageFile?.name}
              </span>
              <button
                onClick={() => { setImageFile(null); setImagePreview(null) }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input bar */}
        <div style={{
          background: 'var(--parch2)',
          borderTop: '3px solid var(--outline)',
          padding: '0.9rem 1.2rem',
          display: 'flex', gap: '0.6rem', alignItems: 'flex-end',
          flexShrink: 0,
        }}>
          {/* Image attach */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={loading}
            title="Attach image"
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: imageFile ? 'var(--gold)' : 'var(--white)',
              border: '3px solid var(--outline)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '2px 2px 0 var(--outline)',
              cursor: loading ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              opacity: loading ? 0.5 : 1,
            }}
          >
            <ImageIcon size={15} color={imageFile ? 'var(--ink)' : 'var(--steel)'} />
          </button>

          {/* Audio recorder */}
          <AudioRecorder onSubmit={handleAudioSubmit} disabled={loading} />

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder={imageFile ? 'Ask a question about this image…' : 'Query the IPC, Constitution, judgments…'}
            rows={1}
            style={{
              flex: 1,
              background: 'var(--white)',
              border: '3px solid var(--outline)',
              borderRadius: 14,
              padding: '0.6rem 1rem',
              fontFamily: "'Nunito Sans', sans-serif",
              fontWeight: 700, fontSize: '0.84rem',
              color: 'var(--ink)',
              outline: 'none',
              boxShadow: '2px 2px 0 var(--outline)',
              resize: 'none',
              minHeight: 42, maxHeight: 120,
              lineHeight: 1.5,
              transition: 'box-shadow 0.15s',
            }}
            onFocus={e => e.target.style.boxShadow = '3px 3px 0 var(--outline)'}
            onBlur={e  => e.target.style.boxShadow = '2px 2px 0 var(--outline)'}
          />

          {/* Send */}
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
            onClick={handleTextSubmit}
            disabled={loading || (!input.trim() && !imageFile)}
            style={{
              width: 42, height: 42, borderRadius: '50%',
              background: loading || (!input.trim() && !imageFile) ? 'var(--mist)' : 'var(--gold)',
              border: '3px solid var(--outline)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '2px 2px 0 var(--outline)',
              cursor: loading || (!input.trim() && !imageFile) ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            {loading
              ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              : <Send size={16} color={!input.trim() && !imageFile ? 'var(--steel)' : 'var(--ink)'} />
            }
          </motion.button>
        </div>
      </div>

      {/* ── RIGHT: SOURCES PANEL ── */}
      <div style={{
        borderLeft: '3px solid var(--outline)',
        background: 'var(--parch2)',
        display: 'flex', flexDirection: 'column',
        height: '100%', overflow: 'hidden',
      }}>
        <SourcesPanel sources={activeSources.sources} graphContext={activeSources.graphContext} />
      </div>

    </div>
  )
}

/* ── ChatMessage ── */
function ChatMessage({ msg, onClickSources }) {
  const isUser  = msg.role === 'user'
  const isError = msg.role === 'error'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{ display: 'flex', gap: '0.7rem', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}
    >
      {isUser ? <UserAvatar /> : <AiAvatar />}

      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase',
          color: isUser ? 'var(--gold-dark)' : 'var(--steel)',
          textAlign: isUser ? 'right' : 'left',
        }}>
          {isUser ? 'You' : 'ThemisAI'} · {msg.modality || 'text'}
        </div>

        <div style={{
          background: isError ? '#fdf0ef' : isUser ? 'var(--navy)' : 'var(--white)',
          border: `3px solid var(--outline)`,
          borderLeft: !isUser ? `4px solid ${isError ? 'var(--danger)' : 'var(--steel)'}` : '3px solid var(--outline)',
          borderRight: isUser ? '4px solid var(--gold)' : '3px solid var(--outline)',
          borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
          padding: '0.85rem 1.1rem',
          boxShadow: '3px 3px 0 var(--outline)',
        }}>
          {/* Image preview in message */}
          {msg.imagePreview && (
            <img
              src={msg.imagePreview} alt="Query image"
              style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, marginBottom: '0.5rem', display: 'block', border: '2px solid var(--outline)' }}
            />
          )}

          <div className={isUser ? '' : 'markdown-body'} style={{
            color: isUser ? 'var(--mist)' : isError ? 'var(--danger)' : 'var(--ink)',
            fontSize: '0.84rem',
          }}>
            {isUser || isError
              ? <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, lineHeight: 1.6 }}>{msg.content}</span>
              : <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            }
          </div>
        </div>

        {/* Source tags row */}
        {!isUser && !isError && msg.sources?.length > 0 && (
          <button
            onClick={onClickSources}
            style={{
              background: 'none', border: 'none', padding: 0,
              display: 'flex', gap: '0.35rem', flexWrap: 'wrap', cursor: 'pointer',
              alignSelf: 'flex-start',
            }}
          >
            {msg.sources.slice(0, 3).map((s, i) => (
              <span key={i} className="tag" style={{ fontSize: '0.58rem' }}>
                § {s.title.length > 28 ? s.title.slice(0, 28) + '…' : s.title}
              </span>
            ))}
            {msg.sources.length > 3 && (
              <span className="tag tag-navy" style={{ fontSize: '0.58rem' }}>
                +{msg.sources.length - 3} more
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
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: 'var(--navy)', border: '3px solid var(--outline)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '2px 2px 0 var(--outline)',
    }}>
      <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.68rem', color: 'var(--gold)' }}>AI</span>
    </div>
  )
}

function UserAvatar() {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: 'var(--gold)', border: '3px solid var(--outline)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '2px 2px 0 var(--outline)',
    }}>
      <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.68rem', color: 'var(--ink)' }}>YOU</span>
    </div>
  )
}
