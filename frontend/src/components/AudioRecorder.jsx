import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, Send, Trash2 } from 'lucide-react'

export default function AudioRecorder({ onSubmit, disabled }) {
  const [state, setState]       = useState('idle')   // idle | recording | ready
  const [duration, setDuration] = useState(0)
  const [blob, setBlob]         = useState(null)
  const mediaRef  = useRef(null)
  const chunksRef = useRef([])
  const timerRef  = useRef(null)

  useEffect(() => () => { stopTimer(); stopStream() }, [])

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  function stopStream() {
    if (mediaRef.current) {
      try { mediaRef.current.stream?.getTracks().forEach(t => t.stop()) } catch {}
      mediaRef.current = null
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      setDuration(0)
      setBlob(null)

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const mr = new MediaRecorder(stream, { mimeType })
      mediaRef.current = mr

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const recorded = new Blob(chunksRef.current, { type: mimeType })
        setBlob(recorded)
        setState('ready')
        stopStream()
      }

      mr.start(250)
      setState('recording')

      timerRef.current = setInterval(() => {
        setDuration(d => {
          if (d >= 120) { stopRecording(); return d }
          return d + 1
        })
      }, 1000)
    } catch (err) {
      console.error('Microphone error:', err)
      alert('Microphone access denied. Please allow microphone in browser settings.')
    }
  }

  function stopRecording() {
    stopTimer()
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop()
    }
  }

  function discard() {
    setBlob(null)
    setState('idle')
    setDuration(0)
  }

  function submit() {
    if (blob && onSubmit) {
      onSubmit(blob)
      discard()
    }
  }

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {state === 'idle' && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startRecording}
          disabled={disabled}
          title="Record voice query"
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'var(--white)', border: '3px solid var(--outline)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '2px 2px 0 var(--outline)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <Mic size={16} color="var(--steel)" />
        </motion.button>
      )}

      {state === 'recording' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 0.9 }}
            style={{
              width: 10, height: 10, borderRadius: '50%',
              background: 'var(--danger)',
            }}
          />
          <span style={{
            fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', color: 'var(--danger)',
          }}>{fmt(duration)}</span>
          <button
            onClick={stopRecording}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--danger)', border: '3px solid var(--outline)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '2px 2px 0 var(--outline)', cursor: 'pointer',
            }}
          >
            <Square size={14} color="white" />
          </button>
        </div>
      )}

      {state === 'ready' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{
            fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '0.75rem',
            color: 'var(--success)',
          }}>
            🎙 {fmt(duration)} ready
          </span>
          <button
            onClick={submit}
            disabled={disabled}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--navy)', border: '3px solid var(--outline)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '2px 2px 0 var(--outline)', cursor: 'pointer',
            }}
          >
            <Send size={14} color="var(--gold)" />
          </button>
          <button
            onClick={discard}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--white)', border: '3px solid var(--outline)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '2px 2px 0 var(--outline)', cursor: 'pointer',
            }}
          >
            <Trash2 size={14} color="var(--danger)" />
          </button>
        </div>
      )}
    </div>
  )
}
