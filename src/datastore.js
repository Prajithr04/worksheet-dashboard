const TABLE_ID = import.meta.env.VITE_CATALYST_TABLE_ID
const TABLE_NAME = import.meta.env.VITE_CATALYST_TABLE_NAME

function getCatalystApp() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.app || window.__CATALYST_APP__ || null
}

function getTableIdentifier() {
  return TABLE_ID || TABLE_NAME
}

function getTable() {
  const app = getCatalystApp()
  if (!app || typeof app.datastore !== 'function') {
    throw new Error('Catalyst app instance is not available on window.app')
  }

  const tableIdentifier = getTableIdentifier()
  if (!tableIdentifier) {
    throw new Error('Set VITE_CATALYST_TABLE_ID or VITE_CATALYST_TABLE_NAME in your environment')
  }

  const datastore = app.datastore()
  return datastore.table(tableIdentifier)
}

function formatDate(value) {
  if (!value) {
    return new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) {
    return String(value)
  }

  return dt.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function toIsoNow() {
  return new Date().toISOString()
}

function mapRowToEntry(row) {
  return {
    id: String(row.ROWID),
    client: row.client_tag || 'Internal',
    volatile: row.volatile || 'Low',
    title: row.title || '',
    desc: row.description || '',
    ticket: row.ticket_link || '',
    pr: row.pr_link || '',
    status: row.status || 'In Progress',
    user: row.assigned_to || '',
    date: formatDate(row.updated_at || row.created_at || row.MODIFIEDTIME || row.CREATEDTIME),
  }
}

function toInsertPayload(entry) {
  return {
    title: entry.title,
    description: entry.desc || '',
    client_tag: entry.client || 'Internal',
    volatile: entry.volatile || 'Low',
    status: entry.status || 'In Progress',
    ticket_link: entry.ticket || '',
    pr_link: entry.pr || '',
    assigned_to: entry.user || '',
    created_at: toIsoNow(),
    updated_at: toIsoNow(),
  }
}

function toUpdatePayload(rowId, entry) {
  return {
    ROWID: rowId,
    title: entry.title,
    description: entry.desc || '',
    client_tag: entry.client || 'Internal',
    volatile: entry.volatile || 'Low',
    status: entry.status || 'In Progress',
    ticket_link: entry.ticket || '',
    pr_link: entry.pr || '',
    assigned_to: entry.user || '',
    updated_at: toIsoNow(),
  }
}

async function getAllRows(table) {
  let hasNext = true
  let nextToken
  const rows = []

  while (hasNext) {
    const response = await table.getPagedRows({ nextToken, maxRows: 200 })
    if (Array.isArray(response?.data)) {
      rows.push(...response.data)
    }

    hasNext = Boolean(response?.more_records)
    nextToken = response?.next_token
  }

  return rows
}

export async function listEntries() {
  const table = getTable()
  const rows = await getAllRows(table)
  return rows.map(mapRowToEntry)
}

export async function createEntry(entry) {
  const table = getTable()
  const inserted = await table.insertRow(toInsertPayload(entry))
  return mapRowToEntry(inserted)
}

export async function updateEntry(rowId, entry) {
  const table = getTable()
  const updated = await table.updateRow(toUpdatePayload(rowId, entry))
  return mapRowToEntry(updated)
}

export async function deleteEntry(rowId) {
  const table = getTable()
  await table.deleteRow(rowId)
}
