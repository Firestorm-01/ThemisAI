import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Image, Mic, CheckCircle, AlertCircle, X, Loader } from 'lucide-react'
import { uploadFile } from '../utils/api'
import { useToast } from '../hooks/useToast'

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'], 'image/tiff': ['.tiff'],
  'audio/mpeg': ['.mp3'], 'audio/wav': ['.wav'],
  'audio/mp4': ['.m4a'], 'audio/ogg': ['.ogg'],
  'text/plain': ['.txt'],
}

const TYPE_ICON = {
  pdf: <FileText size={20} color="var(--navy)" />,
  image: <Image size={20} color="var(--gold-dark)" />,
  audio: <Mic size={20} color="var(--success)" />,
  text: <FileText size={20} color="var(--steel)" />,
}

function getFileType(file) {
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('audio/')) return 'audio'
  return 'text'
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function Ingest() {
  const [queue, setQueue]     = useState([])   // { id, file, status, progress, result, error }
  const [uploading, setUploading] = useState(false)
  const { addToast } = useToast()

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      addToast(`${rejected.length} file(s) rejected — unsupported type or too large.`, 'error')
    }
    const newItems = accepted.map(file => ({
      id: `${file.name}-${Date.now()}`,
      file,
      status: 'pending',
      progress: 0,
      result: null,
      error: null,
    }))
    setQueue(prev => [...prev, ...newItems])
  }, [addToast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: 50 * 1024 * 1024,
    multiple: true,
  })

  const removeItem = (id) => {
    setQueue(prev => prev.filter(i => i.id !== id))
  }

  const uploadAll = async () => {
    const pending = queue.filter(i => i.status === 'pending')
    if (!pending.length) return
    setUploading(true)

    for (const item of pending) {
      setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading', progress: 0 } : i))
      try {
        const result = await uploadFile(item.file, (pct) => {
          setQueue(prev => prev.map(i => i.id === item.id ? { ...i, progress: pct } : i))
        })
        setQueue(prev => prev.map(i =>
          i.id === item.id ? { ...i, status: 'done', progress: 100, result } : i
        ))
        addToast(`✓ ${item.file.name} — ${result.chunks_created} chunks indexed`, 'success')
      } catch (err) {
        setQueue(prev => prev.map(i =>
          i.id === item.id ? { ...i, status: 'error', error: err.message } : i
        ))
        addToast(`✗ ${item.file.name}: ${err.message}`, 'error')
      }
    }
    setUploading(false)
  }

  const clearDone = () => setQueue(prev => prev.filter(i => i.status === 'pending' || i.status === 'uploading'))

  const pendingCount = queue.filter(i => i.status === 'pending').length
  const doneCount    = queue.filter(i => i.status === 'done').length

  return (
    <div style={{ minHeight: 'calc(100dvh - 68px)', background: 'var(--parch)', padding: 'clamp(1.5rem, 4vw, 3rem) 5%', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{ marginBottom: '2.5rem' }}
        >
          <div style={{
            fontFamily: "'Fredoka One', cursive", fontSize: '0.78rem',
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--steel)', marginBottom: '0.3rem',
          }}>§ Evidence Locker</div>
          <h1 style={{
            fontFamily: "'Fredoka One', cursive", fontSize: '2.4rem',
            color: 'var(--ink)', marginBottom: '0.5rem',
          }}>Upload Legal Documents</h1>
          <p style={{
            fontFamily: "'Nunito', sans-serif", fontWeight: 700,
            fontSize: '0.9rem', color: 'var(--steel)', maxWidth: 520,
          }}>
            Upload PDFs, scanned document images, or audio recordings.
            They will be chunked, embedded, and indexed into the retrieval system.
          </p>
        </motion.div>

        {/* Accepted types strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="ingest-type-strip" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.8rem' }}
        >
          {[
            { label: 'PDF Statutes',   icon: '📜', sub: '.pdf' },
            { label: 'Scanned Docs',   icon: '🖼', sub: '.png .jpg .webp' },
            { label: 'Voice Notes',    icon: '🎙', sub: '.mp3 .wav .m4a' },
            { label: 'Text Files',     icon: '📄', sub: '.txt' },
          ].map(({ label, icon, sub }) => (
            <div key={label} style={{
              background: 'var(--white)',
              border: '3px solid var(--outline)',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 1rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span style={{ fontSize: '1.2rem' }}>{icon}</span>
              <div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '0.78rem', color: 'var(--ink)' }}>{label}</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '0.6rem', color: 'var(--steel)', letterSpacing: '0.06em' }}>{sub}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Drop zone */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          {...getRootProps()}
          style={{
            border: `4px dashed ${isDragActive ? 'var(--navy)' : 'var(--steel)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragActive ? 'rgba(5,69,105,0.06)' : 'var(--white)',
            boxShadow: isDragActive ? 'var(--shadow-md)' : 'var(--shadow-sm)',
            transition: 'all 0.2s',
            transform: isDragActive ? 'translate(-2px,-2px)' : 'none',
            marginBottom: '1.5rem',
          }}
        >
          <input {...getInputProps()} />
          <motion.div
            animate={isDragActive ? { scale: 1.15 } : { scale: 1 }}
            style={{ fontSize: '3.2rem', marginBottom: '0.8rem', display: 'block' }}
          >
            📁
          </motion.div>
          <div style={{
            fontFamily: "'Fredoka One', cursive", fontSize: '1.4rem',
            color: 'var(--ink)', marginBottom: '0.4rem',
          }}>
            {isDragActive ? 'Release to add files' : 'Drop files here or click to browse'}
          </div>
          <div style={{
            fontFamily: "'Nunito', sans-serif", fontWeight: 700,
            fontSize: '0.8rem', color: 'var(--steel)',
          }}>
            Maximum 50 MB per file
          </div>
        </motion.div>

        {/* Queue */}
        <AnimatePresence>
          {queue.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {/* Queue header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '1rem',
              }}>
                <div style={{
                  fontFamily: "'Fredoka One', cursive", fontSize: '1rem', color: 'var(--ink)',
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                }}>
                  File Queue
                  {pendingCount > 0 && <span className="tag tag-navy">{pendingCount} pending</span>}
                  {doneCount > 0    && <span className="tag" style={{ background: 'var(--success)', color: 'var(--white)' }}>{doneCount} indexed</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {doneCount > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={clearDone}>
                      Clear done
                    </button>
                  )}
                  {pendingCount > 0 && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={uploadAll}
                      disabled={uploading}
                      style={{ opacity: uploading ? 0.7 : 1 }}
                    >
                      {uploading
                        ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Uploading…</>
                        : <><Upload size={14} /> Upload All ({pendingCount})</>
                      }
                    </button>
                  )}
                </div>
              </div>

              {/* File list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <AnimatePresence>
                  {queue.map((item) => (
                    <FileQueueItem key={item.id} item={item} onRemove={() => removeItem(item.id)} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: '2.5rem',
            background: 'var(--white)',
            border: '3px solid var(--outline)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1rem', color: 'var(--navy)', marginBottom: '0.7rem' }}>
            💡 Tips for best results
          </h3>
          <ul style={{
            fontFamily: "'Nunito', sans-serif", fontWeight: 700,
            fontSize: '0.8rem', color: 'var(--steel)', lineHeight: 1.8,
            paddingLeft: '1.2rem',
          }}>
            <li>Upload the full IPC or Constitution PDF for comprehensive coverage</li>
            <li>For scanned documents, ensure text is legible — OCR works on clear images</li>
            <li>Voice notes work best in a quiet environment with clear pronunciation</li>
            <li>Text files should be in UTF-8 encoding for correct extraction</li>
            <li>Once indexed, documents are queryable immediately from the Case Room</li>
          </ul>
        </motion.div>

      </div>
    </div>
  )
}

function FileQueueItem({ item, onRemove }) {
  const type = getFileType(item.file)

  const statusColor = {
    pending: 'var(--steel)',
    uploading: 'var(--navy)',
    done: 'var(--success)',
    error: 'var(--danger)',
  }[item.status]

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      style={{
        background: 'var(--white)',
        border: `3px solid var(--outline)`,
        borderLeft: `4px solid ${statusColor}`,
        borderRadius: 'var(--radius-md)',
        padding: '0.9rem 1rem',
        boxShadow: '2px 2px 0 var(--outline)',
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
        {TYPE_ICON[type]}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Nunito', sans-serif", fontWeight: 800,
            fontSize: '0.82rem', color: 'var(--ink)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{item.file.name}</div>
          <div style={{
            fontFamily: "'Nunito', sans-serif", fontWeight: 700,
            fontSize: '0.62rem', color: 'var(--steel)', letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            {type.toUpperCase()} · {formatBytes(item.file.size)}
          </div>
        </div>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {item.status === 'uploading' && <Loader size={16} color="var(--navy)" style={{ animation: 'spin 0.8s linear infinite' }} />}
          {item.status === 'done'      && <CheckCircle size={16} color="var(--success)" />}
          {item.status === 'error'     && <AlertCircle size={16} color="var(--danger)" />}
          {item.status === 'pending'   && (
            <button
              onClick={onRemove}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--steel)', padding: '2px' }}
            ><X size={15} /></button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {item.status === 'uploading' && (
        <div style={{
          height: 6, background: 'var(--mist)',
          border: '2px solid var(--outline)', borderRadius: 50, overflow: 'hidden',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${item.progress}%` }}
            style={{ height: '100%', background: 'var(--navy)', borderRadius: 50 }}
          />
        </div>
      )}

      {/* Result */}
      {item.status === 'done' && item.result && (
        <div style={{
          fontFamily: "'Nunito', sans-serif", fontWeight: 700,
          fontSize: '0.7rem', color: 'var(--success)',
        }}>
          ✓ {item.result.chunks_created} chunks indexed · {item.result.modality}
        </div>
      )}

      {/* Error */}
      {item.status === 'error' && item.error && (
        <div style={{
          fontFamily: "'Nunito', sans-serif", fontWeight: 700,
          fontSize: '0.7rem', color: 'var(--danger)',
        }}>
          ✗ {item.error}
        </div>
      )}
    </motion.div>
  )
}
