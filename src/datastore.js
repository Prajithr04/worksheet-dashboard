const CONFIGURED_API_URL = import.meta.env.VITE_WORKSHEET_API_URL
const FALLBACK_API_URL = import.meta.env.VITE_WORKSHEET_API_FALLBACK_URL

function normalizeUrl(url) {
  if (!url) {
    return ''
  }

  return String(url).trim()
}

function getApiCandidates() {
  const primaryUrl = normalizeUrl(CONFIGURED_API_URL)
  const fallbackUrl = normalizeUrl(FALLBACK_API_URL)

  const candidates = []

  if (primaryUrl) {
    candidates.push(primaryUrl)
  }

  if (fallbackUrl && fallbackUrl !== primaryUrl) {
    candidates.push(fallbackUrl)
  }

  if (candidates.length > 0) {
    return candidates
  }

  return ['/server/worksheet_function/execute', '/server/worksheet_function']
}

function buildErrorMessage(lastError) {
  if (!lastError) {
    return 'API request failed'
  }

  return lastError.message || 'API request failed'
}

function parseApiPayload(responseText, apiUrl) {
  const trimmed = (responseText || '').trim()
  if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
    throw new Error(
      `Invalid API response from ${apiUrl}: received HTML page instead of JSON (check route/proxy/CORS)`
    )
  }

  let json

  try {
    json = JSON.parse(responseText)
  } catch (_error) {
    throw new Error(`Invalid API response from ${apiUrl}: ${responseText || 'empty response'}`)
  }

  if (json && typeof json === 'object' && typeof json.output === 'string') {
    try {
      return JSON.parse(json.output)
    } catch (_error) {
      throw new Error(`Invalid API output payload from ${apiUrl}`)
    }
  }

  return json
}

function buildQueryUrl(apiUrl, action, { id, payload } = {}) {
  const url = new URL(apiUrl, window.location.origin)
  url.searchParams.set('action', action)

  if (id !== undefined && id !== null) {
    url.searchParams.set('id', String(id))
  }

  if (payload !== undefined) {
    url.searchParams.set('payload', JSON.stringify(payload))
  }

  return url.toString()
}

async function callApiOnce(apiUrl, action, { id, payload } = {}) {
  const body = { action }

  if (id !== undefined && id !== null) {
    body.id = String(id)
  }

  if (payload !== undefined) {
    body.payload = payload
  }

  let response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (response.status === 405) {
    response = await fetch(buildQueryUrl(apiUrl, action, { id, payload }), {
      method: 'GET',
    })
  }

  const responseText = await response.text()
  const normalized = parseApiPayload(responseText, apiUrl)

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
