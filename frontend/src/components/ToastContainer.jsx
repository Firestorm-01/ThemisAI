import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../hooks/useToast'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'

const ICONS = {
  success: <CheckCircle size={16} color="var(--success)" />,
  error:   <AlertCircle size={16} color="var(--danger)" />,
  info:    <Info size={16} color="var(--ice)" />,
}

export default function ToastContainer() {
  const { toasts } = useToast()
  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            className={`toast toast-${t.type}`}
            initial={{ opacity: 0, x: 60, scale: 0.92 }}
            animate={{ opacity: 1, x: 0,  scale: 1 }}
            exit={{   opacity: 0, x: 60,  scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {ICONS[t.type] || ICONS.info}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
