async function readJsonOrThrow(response) {
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : null
  if (!response.ok) {
    const message = data?.error || `Request failed with status ${response.status}`
    throw new Error(message)
  }
  return data
}

async function post(path, payload) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return readJsonOrThrow(response)
}

export function ingestKnowledgeBase(datasetPath, docPaths = []) {
  return post('/api/ingest/', {
    dataset_path: datasetPath,
    doc_paths: docPaths,
  })
}

export function runRagQuery(query, topK = 5) {
  return post('/api/rag/', { query, top_k: topK })
}

export function runSqlQuery(query) {
  return post('/api/sql/', { query })
}

export function runEvaluation(samples) {
  return post('/api/evaluate/', { samples })
}

export function runAgent(message) {
  return post('/api/chat/', { message })
}
