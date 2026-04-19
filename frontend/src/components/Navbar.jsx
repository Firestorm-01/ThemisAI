import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, FileText, Network, Upload, Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { path: '/chat',   label: 'Case Room',  icon: Scale },
  { path: '/ingest', label: 'Evidence',   icon: Upload },
  { path: '/graph',  label: 'Graph',      icon: Network },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: scrolled ? 'rgba(6,44,67,0.97)' : 'var(--ink)',
        borderBottom: '4px solid var(--gold)',
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 0 var(--gold-dark)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'background 0.3s, box-shadow 0.3s',
      }}
    >
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 2rem',
        height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none' }}
        >
          <LogoSeal />
          <div>
            <div style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: '1.65rem',
              color: 'var(--gold)',
              lineHeight: 1,
              textShadow: '2px 2px 0 var(--gold-dark)',
              letterSpacing: '0.03em',
            }}>ThemisAI</div>
            <div style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 800,
              fontSize: '0.55rem',
              color: 'var(--ice)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginTop: 1,
            }}>⚖ Indian Legal Intelligence</div>
          </div>
        </button>

        {/* Desktop links */}
        <ul style={{ display: 'flex', gap: '0.3rem', listStyle: 'none', alignItems: 'center' }}
            className="desktop-nav">
          {NAV_LINKS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <li key={path}>
                <button
                  onClick={() => navigate(path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    background: active ? 'rgba(229,168,48,0.15)' : 'transparent',
                    border: active ? '2px solid var(--gold)' : '2px solid transparent',
                    borderRadius: 50,
                    padding: '0.45rem 1.1rem',
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    letterSpacing: '0.06em',
                    color: active ? 'var(--gold)' : 'var(--mist)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--ice)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--mist)' }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              </li>
            )
          })}
        </ul>

        {/* CTA */}
        <button
          className="btn btn-gold desktop-nav"
          onClick={() => navigate('/chat')}
          style={{ fontSize: '0.9rem', padding: '0.5rem 1.4rem' }}
        >
          Open Case ⚖
        </button>

        {/* Mobile toggle */}
        <button
          className="mobile-nav"
          onClick={() => setMobileOpen(o => !o)}
          style={{ background: 'none', border: 'none', color: 'var(--gold)', padding: '0.3rem' }}
        >
          {mobileOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
              overflow: 'hidden',
              background: 'var(--ink)',
              borderTop: '2px solid rgba(229,168,48,0.3)',
              padding: '1rem 2rem',
              display: 'flex', flexDirection: 'column', gap: '0.5rem',
            }}
          >
            {NAV_LINKS.map(({ path, label, icon: Icon }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  background: location.pathname === path ? 'rgba(229,168,48,0.12)' : 'transparent',
                  border: 'none', borderRadius: 8,
                  padding: '0.7rem 1rem',
                  fontFamily: "'Nunito', sans-serif", fontWeight: 800,
                  fontSize: '0.95rem', color: location.pathname === path ? 'var(--gold)' : 'var(--mist)',
                  textAlign: 'left',
                }}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
            <button className="btn btn-gold" onClick={() => navigate('/chat')} style={{ marginTop: '0.5rem' }}>
              Open Case ⚖
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-nav  { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-nav  { display: none !important; }
          .desktop-nav { display: flex !important; }
        }
      `}</style>
    </motion.nav>
  )
}

function LogoSeal() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
      <circle cx="21" cy="21" r="19" fill="var(--navy)" stroke="var(--gold)" strokeWidth="3"/>
      <circle cx="21" cy="21" r="14" fill="none" stroke="rgba(229,168,48,0.3)" strokeWidth="1" strokeDasharray="3 2"/>
      {/* Scales */}
      <line x1="21" y1="11" x2="21" y2="26" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="13" y1="17" x2="29" y2="17" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M11 17 Q13 22 15 17" fill="none" stroke="var(--ice)" strokeWidth="1.5"/>
      <path d="M27 17 Q29 22 31 17" fill="none" stroke="var(--ice)" strokeWidth="1.5"/>
      <line x1="17" y1="26" x2="25" y2="26" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
