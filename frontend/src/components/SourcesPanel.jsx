import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Image, Mic, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

const TYPE_ICON = {
  pdf:   <FileText size={14} />,
  text:  <FileText size={14} />,
  image: <Image size={14} />,
  audio: <Mic size={14} />,
}

const TYPE_COLOR = {
  pdf:   'var(--navy)',
  text:  'var(--steel)',
  image: 'var(--gold-dark)',
  audio: 'var(--success)',
}

export default function SourcesPanel({ sources = [], graphContext = [] }) {
  const [expanded, setExpanded] = useState(null)
  const [showGraph, setShowGraph] = useState(false)

  if (!sources.length && !graphContext.length) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: 'var(--steel)', gap: '0.6rem', padding: '1.5rem',
        textAlign: 'center',
      }}>
        <FileText size={32} opacity={0.3} />
        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '0.8rem' }}>
          Sources will appear here after your first query.
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>

      {/* Header */}
      <div style={{
        fontFamily: "'Fredoka One', cursive",
        fontSize: '0.95rem', color: 'var(--ink)',
        borderBottom: '3px solid var(--outline)',
        paddingBottom: '0.5rem',
        display: 'flex', alignItems: 'center', gap: '0.4rem',
      }}>
        <FileText size={16} /> Sources Retrieved
        <span style={{
          marginLeft: 'auto',
          background: 'var(--navy)', color: 'var(--white)',
          borderRadius: 50, padding: '0.1rem 0.55rem',
          fontSize: '0.68rem', fontFamily: "'Nunito', sans-serif", fontWeight: 800,
          border: '2px solid var(--outline)',
        }}>{sources.length}</span>
      </div>

      {/* Source cards */}
      {sources.map((src, i) => {
        const isOpen = expanded === i
        return (
          <motion.div
            key={src.id || i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              background: 'var(--white)',
              border: `3px solid var(--outline)`,
              borderLeft: `4px solid ${TYPE_COLOR[src.source_type] || 'var(--steel)'}`,
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: '2px 2px 0 var(--outline)',
            }}
          >
            {/* Card header */}
            <button
              onClick={() => setExpanded(isOpen ? null : i)}
              style={{
                width: '100%', background: 'none', border: 'none',
                padding: '0.65rem 0.8rem',
                display: 'flex', flexDirection: 'column', gap: '0.35rem',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                <span style={{ color: TYPE_COLOR[src.source_type], marginTop: 2, flexShrink: 0 }}>
                  {TYPE_ICON[src.source_type] || <FileText size={14} />}
                </span>
                <span style={{
                  fontFamily: "'Nunito', sans-serif", fontWeight: 800,
                  fontSize: '0.73rem', color: 'var(--ink)', lineHeight: 1.35, flex: 1,
                }}>
                  {src.title}
                </span>
                {isOpen ? <ChevronUp size={12} style={{ flexShrink: 0, color: 'var(--steel)' }} />
                         : <ChevronDown size={12} style={{ flexShrink: 0, color: 'var(--steel)' }} />}
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--steel)',
                }}>
                  {src.source_type.toUpperCase()}
                  {src.page ? ` · pg ${src.page}` : ''}
                  {src.file_name ? ` · ${src.file_name}` : ''}
                </span>
                <span style={{ marginLeft: 'auto' }}>
                  <ScoreBar score={src.score} />
                </span>
              </div>
            </button>

            {/* Expanded content */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    borderTop: '2px solid var(--parch2)',
                    padding: '0.65rem 0.8rem',
                    fontSize: '0.73rem', lineHeight: 1.65,
                    color: 'var(--ink)',
                    background: 'var(--parch)',
                    fontFamily: "'Nunito Sans', sans-serif",
                  }}>
                    {src.content || 'No content preview available.'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}

      {/* Graph context */}
      {graphContext.length > 0 && (
        <>
          <button
            onClick={() => setShowGraph(g => !g)}
            style={{
              background: 'var(--navy)', color: 'var(--ice)',
              border: '3px solid var(--outline)', borderRadius: 'var(--radius-pill)',
              padding: '0.45rem 0.9rem',
              fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer',
              boxShadow: '2px 2px 0 var(--outline)',
              transition: 'transform 0.12s, box-shadow 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0 var(--outline)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '2px 2px 0 var(--outline)' }}
          >
            🕸 Graph Context ({graphContext.length})
            {showGraph ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
          </button>

          <AnimatePresence>
            {showGraph && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{   opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  background: 'var(--parch)',
                  border: '3px solid var(--outline)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  display: 'flex', flexDirection: 'column', gap: '0.4rem',
                }}>
                  {graphContext.map((ctx, i) => (
                    <div key={i} style={{
                      fontSize: '0.7rem', color: 'var(--navy)',
                      fontFamily: "'Nunito', sans-serif", fontWeight: 700,
                      padding: '0.3rem 0.5rem',
                      background: 'var(--white)',
                      border: '2px solid var(--outline)',
                      borderRadius: 8,
                      lineHeight: 1.45,
                    }}>
                      § {ctx}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}

function ScoreBar({ score }) {
  const pct = Math.round(score * 100)
  const color = score >= 0.8 ? 'var(--success)' : score >= 0.6 ? 'var(--gold)' : 'var(--steel)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
      <div style={{
        width: 44, height: 5,
        background: 'var(--mist)',
        border: '1.5px solid var(--outline)',
        borderRadius: 50, overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 50 }}
        />
      </div>
      <span style={{
        fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem', color,
      }}>{score.toFixed(2)}</span>
    </div>
  )
}
