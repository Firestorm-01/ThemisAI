import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import * as d3 from 'd3'
import { fetchGraphData } from '../utils/api'
import { RefreshCw, Info } from 'lucide-react'

const NODE_COLORS = {
  ipc_section:   '#054569',
  constitution:  '#e5a830',
  crpc_section:  '#5591a9',
  case:          '#2d8a4e',
  unknown:       '#9ccddc',
}

const NODE_RADIUS = {
  ipc_section:  10,
  constitution: 12,
  crpc_section: 10,
  case:         11,
  unknown:       8,
}

export default function GraphPage() {
  const svgRef      = useRef(null)
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [selected, setSelected] = useState(null)
  const [counts, setCounts]   = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await fetchGraphData()
      setData(d)
      const c = {}
      d.nodes.forEach(n => { c[n.node_type] = (c[n.node_type] || 0) + 1 })
      setCounts(c)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!data || !svgRef.current) return
    renderGraph(data, svgRef.current, setSelected)
  }, [data])

  return (
    <div style={{ height: 'calc(100vh - 68px)', display: 'flex', flexDirection: 'column', background: 'var(--ink)', position: 'relative', zIndex: 1 }}>

      {/* Topbar */}
      <div style={{
        background: 'var(--ink)',
        borderBottom: '3px solid var(--gold)',
        padding: '0.75rem 2rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1rem', color: 'var(--gold)' }}>
            🕸 Knowledge Graph
          </div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '0.62rem', color: 'var(--steel)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Indian Law — Sections · Cases · Articles
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginLeft: '1rem' }}>
          {Object.entries(NODE_COLORS).filter(([k]) => k !== 'unknown').map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, border: '2px solid rgba(255,255,255,0.3)' }} />
              <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '0.62rem', color: 'var(--mist)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {type.replace('_', ' ')} {counts[type] ? `(${counts[type]})` : ''}
              </span>
            </div>
          ))}
        </div>

        <button
          className="btn btn-ghost btn-sm"
          onClick={load}
          style={{ marginLeft: 'auto', color: 'var(--ice)', borderColor: 'var(--steel)' }}
          disabled={loading}
        >
          <RefreshCw size={13} style={loading ? { animation: 'spin 0.8s linear infinite' } : {}} />
          Refresh
        </button>
      </div>

      {/* Graph area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '1rem',
          }}>
            <div className="spinner" style={{ width: 36, height: 36, borderColor: 'rgba(149,205,220,0.3)', borderTopColor: 'var(--ice)' }} />
            <span style={{ fontFamily: "'Fredoka One', cursive", color: 'var(--ice)', fontSize: '1rem' }}>
              Loading graph…
            </span>
          </div>
        )}

        {error && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '1rem',
          }}>
            <span style={{ fontSize: '2rem' }}>⚠️</span>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: 'var(--danger)', fontSize: '0.9rem' }}>
              {error}
            </span>
            <button className="btn btn-gold btn-sm" onClick={load}>Retry</button>
          </div>
        )}

        <svg
          ref={svgRef}
          style={{ width: '100%', height: '100%', display: loading || error ? 'none' : 'block' }}
        />

        {/* Selected node info panel */}
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'var(--parch)',
              border: '3px solid var(--outline)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.2rem',
              maxWidth: 260,
              boxShadow: 'var(--shadow-md)',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%', flexShrink: 0, marginTop: 3,
                background: NODE_COLORS[selected.node_type] || NODE_COLORS.unknown,
                border: '2px solid var(--outline)',
              }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'Fredoka One', cursive", fontSize: '0.9rem',
                  color: 'var(--ink)', lineHeight: 1.3, marginBottom: '0.3rem',
                }}>{selected.label}</div>
                <div style={{
                  fontFamily: "'Nunito', sans-serif", fontWeight: 800,
                  fontSize: '0.6rem', color: 'var(--steel)', letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>{selected.node_type?.replace('_', ' ')}</div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--steel)', padding: 0, flexShrink: 0 }}
              >✕</button>
            </div>
          </motion.div>
        )}

        {/* Hint */}
        {!loading && !error && !selected && (
          <div style={{
            position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(6,44,67,0.7)',
            border: '2px solid rgba(149,205,220,0.2)',
            borderRadius: 50,
            padding: '0.4rem 1.1rem',
            fontFamily: "'Nunito', sans-serif", fontWeight: 700,
            fontSize: '0.7rem', color: 'var(--mist)',
            pointerEvents: 'none',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <Info size={12} /> Click a node to inspect · Scroll to zoom · Drag to pan
          </div>
        )}
      </div>
    </div>
  )
}

/* ── D3 rendering function ── */
function renderGraph(data, svgEl, onSelect) {
  const { nodes, edges } = data
  const width  = svgEl.clientWidth  || 900
  const height = svgEl.clientHeight || 600

  // Clear previous render
  d3.select(svgEl).selectAll('*').remove()

  const svg = d3.select(svgEl)
    .attr('viewBox', `0 0 ${width} ${height}`)

  // Zoom layer
  const g = svg.append('g')

  svg.call(
    d3.zoom()
      .scaleExtent([0.25, 3])
      .on('zoom', (event) => g.attr('transform', event.transform))
  )

  // Arrow marker
  svg.append('defs').append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -4 8 8')
    .attr('refX', 18)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-4L8,0L0,4')
    .attr('fill', 'rgba(149,205,220,0.4)')

  // Simulation
  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(edges)
      .id(d => d.id)
      .distance(90)
      .strength(0.4)
    )
    .force('charge', d3.forceManyBody().strength(-220))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide(20))

  // Edges
  const link = g.append('g').selectAll('line')
    .data(edges)
    .join('line')
    .attr('stroke', 'rgba(149,205,220,0.25)')
    .attr('stroke-width', 1.5)
    .attr('marker-end', 'url(#arrow)')

  // Edge labels
  const linkLabel = g.append('g').selectAll('text')
    .data(edges)
    .join('text')
    .attr('text-anchor', 'middle')
    .attr('font-family', 'Nunito, sans-serif')
    .attr('font-weight', '700')
    .attr('font-size', '8')
    .attr('fill', 'rgba(149,205,220,0.35)')
    .text(d => d.relation || '')

  // Node groups
  const node = g.append('g').selectAll('g')
    .data(nodes)
    .join('g')
    .style('cursor', 'pointer')
    .call(
      d3.drag()
        .on('start', (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
        .on('drag',  (event, d) => { d.fx = event.x; d.fy = event.y })
        .on('end',   (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null })
    )
    .on('click', (event, d) => { event.stopPropagation(); onSelect(d) })

  // Node circle
  node.append('circle')
    .attr('r', d => NODE_RADIUS[d.node_type] || 8)
    .attr('fill', d => NODE_COLORS[d.node_type] || NODE_COLORS.unknown)
    .attr('stroke', '#062c43')
    .attr('stroke-width', 2.5)

  // Node label
  node.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', d => (NODE_RADIUS[d.node_type] || 8) + 13)
    .attr('font-family', 'Fredoka One, cursive')
    .attr('font-size', '9')
    .attr('fill', 'rgba(206,215,224,0.75)')
    .text(d => {
      const l = d.label || d.id
      // Shorten label for display
      const short = l.replace(/^(IPC §|Art\. |CrPC §)/, '').split(' — ')[0]
      return short.length > 22 ? short.slice(0, 22) + '…' : short
    })

  // Hover highlight
  node
    .on('mouseenter', function (_, d) {
      d3.select(this).select('circle')
        .transition().duration(120)
        .attr('r', (NODE_RADIUS[d.node_type] || 8) + 3)
        .attr('stroke', 'var(--gold)')
        .attr('stroke-width', 3)
    })
    .on('mouseleave', function (_, d) {
      d3.select(this).select('circle')
        .transition().duration(120)
        .attr('r', NODE_RADIUS[d.node_type] || 8)
        .attr('stroke', '#062c43')
        .attr('stroke-width', 2.5)
    })

  // Click on background deselects
  svg.on('click', () => onSelect(null))

  // Tick
  sim.on('tick', () => {
    link
      .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x).attr('y2', d => d.target.y)

    linkLabel
      .attr('x', d => (d.source.x + d.target.x) / 2)
      .attr('y', d => (d.source.y + d.target.y) / 2)

    node.attr('transform', d => `translate(${d.x},${d.y})`)
  })

  // Stop after cooling
  setTimeout(() => sim.alphaTarget(0), 3000)
}
