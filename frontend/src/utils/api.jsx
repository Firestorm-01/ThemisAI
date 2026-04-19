import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
})

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.detail || err.message || 'Network error'
    return Promise.reject(new Error(msg))
  }
)

export async function queryText(query, topK = 5, useGraph = true) {
  const { data } = await api.post('/query/text', { query, top_k: topK, use_graph: useGraph })
  return data
}

export async function queryAudio(audioBlob, filename = 'recording.webm', topK = 5) {
  const form = new FormData()
  form.append('file', audioBlob, filename)
  form.append('top_k', topK)
  form.append('use_graph', true)
  const { data } = await api.post('/query/audio', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function queryImage(imageFile, question, topK = 5) {
  const form = new FormData()
  form.append('file', imageFile)
  form.append('question', question || 'What legal information does this document contain?')
  form.append('top_k', topK)
  form.append('use_graph', true)
  const { data } = await api.post('/query/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function uploadFile(file, onProgress) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/ingest/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })
  return data
}

export async function fetchHealth() {
  const { data } = await api.get('/health')
  return data
}

export async function fetchGraphData() {
  const { data } = await api.get('/graph/data')
  return data
}

export default api
