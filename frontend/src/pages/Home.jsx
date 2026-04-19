import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Scale, FileText, Network, ArrowRight, Upload } from 'lucide-react'
import { fetchHealth } from '../utils/api'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
})

export default function Home() {
  const navigate = useNavigate()
  const [health, setHealth] = useState(null)

  useEffect(() => {
    fetchHealth().then(setHealth).catch(() => {})
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--parch)', position: 'relative', zIndex: 1 }}>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center',
        padding: '0 5%',
        gap: '3rem',
        maxWidth: 1200, margin: '0 auto',
        flexWrap: 'wrap',
      }}>

        {/* Left */}
        <div style={{ flex: '1 1 400px', paddingTop: '5rem' }}>
          <motion.div {...fadeUp(0.05)}>
            <span className="tag tag-navy" style={{ marginBottom: '1.2rem', display: 'inline-flex' }}>
              ⚖ Indian Legal Intelligence
            </span>
          </motion.div>

          <motion.h1 {...fadeUp(0.15)} style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 'clamp(3rem, 6vw, 5.2rem)',
            lineHeight: 1.05,
            color: 'var(--ink)',
            marginBottom: '0.5rem',
          }}>
            The Law,<br />
            <span style={{
              color: 'var(--navy)',
              WebkitTextStroke: '2px var(--ink)',
              textShadow: '4px 4px 0 var(--ice)',
            }}>
              Understood.
            </span>
          </motion.h1>

          <motion.p {...fadeUp(0.28)} style={{
            fontFamily: "'Nunito', sans-serif", fontWeight: 700,
            fontSize: '1.05rem', color: 'var(--steel)',
            lineHeight: 1.7, maxWidth: 460,
            margin: '1rem 0 2rem',
          }}>
            Multi-modal RAG for the IPC, Constitution, CrPC &amp; landmark judgments.
            Text, documents, images, voice — zero hallucinations, full citations.
          </motion.p>

          <motion.div {...fadeUp(0.4)} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/chat')}>
              Open a Case <ArrowRight size={16} />
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/ingest')}>
              Upload Evidence <Upload size={16} />
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div {...fadeUp(0.52)} style={{
            display: 'flex', gap: '1rem', marginTop: '2.5rem', flexWrap: 'wrap',
          }}>
            {[
              { num: 'IPC', label: 'Full Corpus' },
              { num: '3+',  label: 'Modalities' },
              { num: '0',   label: 'Hallucinations' },
            ].map(({ num, label }) => (
              <div key={label} style={{
                background: 'var(--white)',
                border: '3px solid var(--outline)',
                borderRadius: 'var(--radius-md)',
                padding: '0.6rem 1.1rem',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'center', minWidth: 88,
              }}>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.5rem', color: 'var(--navy)' }}>{num}</div>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--steel)' }}>{label}</div>
              </div>
            ))}
            {health && (
              <div style={{
                background: 'var(--white)',
                border: '3px solid var(--outline)',
                borderRadius: 'var(--radius-md)',
                padding: '0.6rem 1.1rem',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'center', minWidth: 88,
              }}>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.5rem', color: 'var(--success)' }}>
                  {health.status === 'ok' ? '✓' : '!'}
                </div>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--steel)' }}>
                  {health.status === 'ok' ? `${(health.collections?.text_vectors ?? 0)} docs` : 'offline'}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right — clean SVG illustration */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}
        >
          <HeroIllustration />
        </motion.div>
      </section>

      {/* ── WAVE ── */}
      <WaveDivider flip={false} fill="var(--navy)" />

      {/* ── FEATURES ── */}
      <section style={{ background: 'var(--navy)', padding: '5rem 5%' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div style={{
              fontFamily: "'Fredoka One', cursive", fontSize: '0.78rem',
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'var(--ice)', marginBottom: '0.4rem',
            }}>§ 01 — Capabilities</div>
            <h2 style={{
              fontFamily: "'Fredoka One', cursive", fontSize: '2.4rem',
              color: 'var(--gold)', marginBottom: '2.5rem',
              textShadow: '2px 2px 0 var(--gold-dark)',
            }}>What ThemisAI Can Do</h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="card"
                style={{ padding: '1.8rem 1.5rem', background: 'var(--parch)' }}
              >
                <div style={{ fontSize: '2.4rem', marginBottom: '0.7rem' }}>{f.icon}</div>
                <h3 style={{
                  fontFamily: "'Fredoka One', cursive", fontSize: '1.2rem',
                  color: 'var(--ink)', marginBottom: '0.5rem',
                }}>{f.title}</h3>
                <p style={{
                  fontFamily: "'Nunito', sans-serif", fontWeight: 600,
                  fontSize: '0.8rem', color: 'var(--steel)', lineHeight: 1.65,
                }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WAVE 2 ── */}
      <WaveDivider flip={true} fill="var(--navy)" />

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: 'var(--parch)', padding: '5rem 5%' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 style={{
              fontFamily: "'Fredoka One', cursive", fontSize: '2.2rem',
              color: 'var(--ink)', marginBottom: '0.5rem',
            }}>How It Works</h2>
            <p style={{
              color: 'var(--steel)', fontWeight: 700, fontSize: '0.9rem',
              maxWidth: 500, margin: '0 auto 3rem',
            }}>
              A production-grade RAG pipeline under the hood — transparent retrieval, no black boxes.
            </p>
          </motion.div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0', justifyContent: 'center', alignItems: 'center' }}>
            {PIPELINE.map((step, i) => (
              <React.Fragment key={step.label}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    background: 'var(--white)',
                    border: '3px solid var(--outline)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.2rem 1rem',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    minWidth: 110, maxWidth: 130,
                  }}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>{step.icon}</div>
                  <div style={{
                    fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem',
                    color: 'var(--navy)', lineHeight: 1.3,
                  }}>{step.label}</div>
                </motion.div>
                {i < PIPELINE.length - 1 && (
                  <div style={{
                    fontFamily: "'Fredoka One', cursive", fontSize: '1.4rem',
                    color: 'var(--steel)', padding: '0 0.3rem',
                  }}>→</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        background: 'var(--ink)', padding: '4rem 5%',
        textAlign: 'center', borderTop: '4px solid var(--gold)',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 style={{
            fontFamily: "'Fredoka One', cursive", fontSize: '2.4rem',
            color: 'var(--gold)', marginBottom: '0.8rem',
            textShadow: '3px 3px 0 var(--gold-dark)',
          }}>Ready to open your case?</h2>
          <p style={{
            color: 'var(--steel)', fontWeight: 700, fontSize: '0.9rem',
            marginBottom: '2rem',
          }}>
            Query IPC, Constitution, CrPC — or upload your own legal documents.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-gold" onClick={() => navigate('/chat')}>
              Start Querying <ArrowRight size={16} />
            </button>
            <button className="btn btn-ghost" style={{ color: 'var(--ice)', borderColor: 'var(--steel)' }}
              onClick={() => navigate('/ingest')}>
              Upload Documents
            </button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'var(--ink)', borderTop: '4px solid var(--gold)',
        padding: '1.5rem 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
      }}>
        <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.3rem', color: 'var(--gold)', textShadow: '2px 2px 0 var(--gold-dark)' }}>
          ⚖ ThemisAI
        </span>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '0.7rem', color: 'var(--steel)', letterSpacing: '0.08em' }}>
           Justice, Retrieved. Multi-Modal Graph RAG for Indian Law.
        </span>
      </footer>
    </div>
  )
}

/* ── Sub-components ── */

function HeroIllustration() {
  return (
    <motion.svg
      width="400" height="380"
      viewBox="0 0 400 380"
      fill="none"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ maxWidth: '100%' }}
    >
      {/* Background blob */}
      <ellipse cx="200" cy="200" rx="170" ry="155" fill="var(--ice)" opacity="0.18"/>

      {/* ── BOOK STACK ── */}
      {/* Bottom book */}
      <rect x="80" y="285" width="185" height="38" rx="7"
        fill="var(--navy)" stroke="var(--outline)" strokeWidth="3"/>
      <rect x="80" y="285" width="20" height="38" rx="5"
        fill="var(--steel)" stroke="var(--outline)" strokeWidth="3"/>
      <text x="178" y="309" textAnchor="middle"
        fontFamily="Fredoka One, cursive" fontSize="11" fill="var(--ice)" letterSpacing="1">
        CONSTITUTION
      </text>

      {/* Middle book */}
      <rect x="90" y="251" width="165" height="38" rx="7"
        fill="#7a1a1a" stroke="var(--outline)" strokeWidth="3"/>
      <rect x="90" y="251" width="18" height="38" rx="5"
        fill="#c0392b" stroke="var(--outline)" strokeWidth="3"/>
      <text x="178" y="275" textAnchor="middle"
        fontFamily="Fredoka One, cursive" fontSize="11" fill="var(--parch)" letterSpacing="1">
        IPC 1860
      </text>

      {/* Top book */}
      <rect x="100" y="219" width="145" height="36" rx="7"
        fill="var(--gold)" stroke="var(--outline)" strokeWidth="3"/>
      <rect x="100" y="219" width="16" height="36" rx="5"
        fill="var(--gold-dark)" stroke="var(--outline)" strokeWidth="3"/>
      <text x="178" y="242" textAnchor="middle"
        fontFamily="Fredoka One, cursive" fontSize="11" fill="var(--ink)" letterSpacing="1">
        CrPC
      </text>

      {/* ── SCALES OF JUSTICE ── */}
      <g>
        {/* Pole */}
        <rect x="196" y="90" width="8" height="125" rx="4"
          fill="var(--gold)" stroke="var(--outline)" strokeWidth="2.5"/>
        {/* Base */}
        <rect x="178" y="210" width="44" height="12" rx="6"
          fill="var(--gold-dark)" stroke="var(--outline)" strokeWidth="2.5"/>
        {/* Top knob */}
        <circle cx="200" cy="90" r="8"
          fill="var(--gold)" stroke="var(--outline)" strokeWidth="2.5"/>
        {/* Cross beam */}
        <rect x="145" y="124" width="110" height="8" rx="4"
          fill="var(--gold)" stroke="var(--outline)" strokeWidth="2.5"/>

        {/* Left pan chain */}
        <line x1="157" y1="132" x2="150" y2="163"
          stroke="var(--outline)" strokeWidth="2.5" strokeDasharray="4 3"/>
        {/* Left pan */}
        <motion.g
          animate={{ rotate: [0, 5, -3, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '157px 132px' }}
        >
          <path d="M133 163 Q150 157 167 163 Q150 178 133 163Z"
            fill="var(--gold)" stroke="var(--outline)" strokeWidth="2.5"/>
        </motion.g>

        {/* Right pan chain */}
        <line x1="243" y1="132" x2="250" y2="155"
          stroke="var(--outline)" strokeWidth="2" strokeDasharray="4 3"/>
        {/* Right pan */}
        <motion.g
          animate={{ rotate: [0, -5, 3, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          style={{ transformOrigin: '243px 132px' }}
        >
          <path d="M233 172 Q250 166 267 172 Q250 187 233 172Z"
            fill="var(--gold)" stroke="var(--outline)" strokeWidth="2.5"/>
        </motion.g>
      </g>

      {/* ── GAVEL + HIT ── */}
<g transform="translate(160, 140) scale(0.45)">
  <g transform="rotate(35, 395, 340)">
    {/* Head */}
    <rect x="285" y="327" width="110" height="26" rx="4" fill="#82522a"/>
    {/* Top highlight */}
    <rect x="285" y="327" width="110" height="8" rx="3" fill="#9c6535" opacity="0.5"/>
    {/* Gold band */}
    <rect x="328" y="327" width="20" height="26" fill="#d4af37"/>
    <rect x="330" y="327" width="6" height="26" fill="#e8c84a" opacity="0.45"/>
    {/* End caps */}
    <rect x="285" y="327" width="5" height="26" rx="2" fill="#3e2509" opacity="0.4"/>
    <rect x="390" y="327" width="5" height="26" rx="2" fill="#3e2509" opacity="0.35"/>
    {/* Handle */}
    <rect x="335" y="160" width="10" height="167" rx="5" fill="#5d3a1a"/>
    <rect x="337" y="162" width="3" height="163" rx="2" fill="#7a4e28" opacity="0.4"/>
  </g>

  {/* ── BLOCK ── */}
  <rect x="260" y="340" width="180" height="22" rx="11" fill="#5d3a1a"/>
  <rect x="268" y="338" width="164" height="8" rx="4" fill="#7a4e28" opacity="0.45"/>
</g>
      
      
    </motion.svg>
  )
}

function WaveDivider({ flip, fill }) {
  return (
    <div style={{ lineHeight: 0, transform: flip ? 'scaleY(-1)' : 'none' }}>
      <svg viewBox="0 0 1440 56" preserveAspectRatio="none" height="56" width="100%">
        <path d="M0,0 C360,56 1080,56 1440,0 L1440,56 L0,56 Z" fill={fill}/>
      </svg>
    </div>
  )
}

const FEATURES = [
  {
    icon: '📜',
    title: 'Statute Intelligence',
    desc: 'Retrieves precise IPC, CrPC, and Constitutional sections. Every answer is grounded in a cited, verifiable source — no hallucinations.',
  },
  {
    icon: '🎙',
    title: 'Multi-Modal Input',
    desc: 'Query via text, upload scanned court documents as images, or submit voice recordings. Whisper + CLIP handle all modalities.',
  },
  {
    icon: '🕸',
    title: 'Knowledge Graph',
    desc: 'IPC sections link to landmark cases. Cases link to constitutional articles. Graph traversal reveals non-obvious legal connections.',
  },
  {
    icon: '🔍',
    title: 'Zero Hallucinations',
    desc: 'Retrieval-augmented generation ensures every claim traces back to an ingested document. Sources are always shown.',
  },
]

const PIPELINE = [
  { icon: '📥', label: 'Upload / Query' },
  { icon: '✂️', label: 'Chunk & Embed' },
  { icon: '🗄',  label: 'Qdrant Search' },
  { icon: '🕸',  label: 'Graph Enrich' },
  { icon: '🤖',  label: 'LLaMA 3.3 70B' },
  { icon: '🔍',  label: 'Processing' },
  { icon: '📋',  label: 'Cited Answer' },
]
