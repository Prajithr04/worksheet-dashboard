const CONFIGURED_API_URL = import.meta.env.VITE_WORKSHEET_API_URL

function getApiCandidates() {
  if (CONFIGURED_API_URL) {
    return [CONFIGURED_API_URL]
  }

  return ['/server/worksheet_function/execute', '/server/worksheet_function']
}

function buildErrorMessage(lastError) {
  if (!lastError) {
    return 'API request failed'
  }

  return lastError.message || 'API request failed'
}

async function callApiOnce(apiUrl, action, { id, payload } = {}) {
  const body = { action }

  if (id !== undefined && id !== null) {
    body.id = String(id)
  }

  if (payload !== undefined) {
    body.payload = payload
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const responseText = await response.text()
  let json

  try {
    json = JSON.parse(responseText)
  } catch (_error) {
    throw new Error(`Invalid API response from ${apiUrl}: ${responseText || 'empty response'}`)
  }

  let normalized = json
  if (json && typeof json === 'object' && typeof json.output === 'string') {
    try {
      normalized = JSON.parse(json.output)
    } catch (_error) {
      throw new Error(`Invalid API output payload from ${apiUrl}`)
    }
  }

  if (!response.ok || !normalized?.ok) {
    throw new Error(normalized?.error || `API request failed (${response.status})`)
  }

  return normalized.data
}

async function callApi(action, options) {
  const apiCandidates = getApiCandidates()
  let lastError

  for (const apiUrl of apiCandidates) {
    try {
      return await callApiOnce(apiUrl, action, options)
    } catch (error) {
      lastError = error
    }
  }

  throw new Error(buildErrorMessage(lastError))
}

export async function listEntries() {
  return callApi('list')
}

export async function createEntry(entry) {
  return callApi('create', { payload: entry })
}

export async function updateEntry(rowId, entry) {
  return callApi('update', { id: rowId, payload: entry })
}

export async function deleteEntry(rowId) {
  await callApi('delete', { id: rowId })
}
