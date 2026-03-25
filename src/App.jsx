import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  createEntry as createEntryInStore,
  deleteEntry as deleteEntryInStore,
  listEntries,
  updateEntry as updateEntryInStore,
} from './datastore'

const ME = 'john.doe@co.com'

const initialData = [
  {
    id: 1,
    client: 'Acme Corp',
    volatile: 'High',
    title: 'Fix login timeout bug',
    desc: 'Users are being logged out after 5 min of inactivity. Root cause: session token expiry misconfigured in auth middleware.',
    ticket: 'https://jira.company.com/PROJ-1021',
    pr: 'https://github.com/org/repo/pull/342',
    status: 'In Progress',
    date: '20 Mar 2025',
    user: 'john.doe@co.com',
  },
  {
    id: 2,
    client: 'Internal',
    volatile: 'Low',
    title: 'Update README docs',
    desc: 'Added setup instructions and environment variable table to the main README for onboarding new developers.',
    ticket: 'https://jira.company.com/PROJ-1009',
    pr: 'https://github.com/org/repo/pull/339',
    status: 'Done',
    date: '18 Mar 2025',
    user: 'john.doe@co.com',
  },
  {
    id: 3,
    client: 'GlobalBank',
    volatile: 'Critical',
    title: 'Patch SQL injection vulnerability',
    desc: 'CVE-2025-1234 identified in the payments module. Applied parameterised queries and input sanitisation across all endpoints.',
    ticket: 'https://jira.company.com/SEC-88',
    pr: 'https://github.com/org/repo/pull/355',
    status: 'Review',
    date: '21 Mar 2025',
    user: 'jane.smith@co.com',
  },
  {
    id: 4,
    client: 'TechStart',
    volatile: 'Medium',
    title: 'Migrate to Node 20 LTS',
    desc: 'Upgrade runtime from Node 18 to 20 LTS across all microservices. Updated Dockerfile and CI pipeline configs.',
    ticket: 'https://jira.company.com/PROJ-1030',
    pr: 'https://github.com/org/repo/pull/360',
    status: 'In Progress',
    date: '22 Mar 2025',
    user: 'raj.kumar@co.com',
  },
  {
    id: 5,
    client: 'Internal',
    volatile: 'High',
    title: 'Redis cache eviction fix',
    desc: 'Cache was not evicting stale entries causing memory bloat. Switched eviction policy to allkeys-lru and added TTL to all keys.',
    ticket: 'https://jira.company.com/INFRA-77',
    pr: 'https://github.com/org/repo/pull/351',
    status: 'Blocked',
    date: '17 Mar 2025',
    user: 'raj.kumar@co.com',
  },
  {
    id: 6,
    client: 'Acme Corp',
    volatile: 'Medium',
    title: 'Add pagination to reports API',
    desc: 'Reports endpoint was returning all rows. Implemented cursor-based pagination with configurable page size (default 50).',
    ticket: 'https://jira.company.com/PROJ-1015',
    pr: 'https://github.com/org/repo/pull/348',
    status: 'Done',
    date: '19 Mar 2025',
    user: 'john.doe@co.com',
  },
]

function App() {
  const [data, setData] = useState([])
  const [currentView, setCurrentView] = useState('mine')
  const [currentFilter, setCurrentFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    client: '',
    volatile: 'Low',
    status: 'In Progress',
    title: '',
    desc: '',
    ticket: '',
    pr: '',
    user: '',
  })

  useEffect(() => {
    const loadEntries = async () => {
      setLoading(true)
      try {
        const entries = await listEntries()
        setData(entries)
        setIsUsingFallbackData(false)
      } catch (error) {
        console.error('Datastore unavailable, using local sample data:', error)
        setData(initialData)
        setIsUsingFallbackData(true)
      } finally {
        setLoading(false)
      }
    }

    loadEntries()
  }, [])

  const filteredData = useMemo(() => {
    let items = currentView === 'mine' ? data.filter((d) => d.user === ME) : data

    if (currentFilter !== 'all') {
      items = items.filter((d) => d.volatile === currentFilter || d.status === currentFilter)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      items = items.filter(
        (d) =>
          (d.title || '').toLowerCase().includes(q) ||
          (d.desc || '').toLowerCase().includes(q) ||
          (d.client || '').toLowerCase().includes(q)
      )
    }

    return items
  }, [data, currentView, currentFilter, searchQuery])

  const handleOpenModal = () => {
    setEditingId(null)
    setFormData({
      client: '',
      volatile: 'Low',
      status: 'In Progress',
      title: '',
      desc: '',
      ticket: '',
      pr: '',
      user: '',
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (id) => {
    const entry = data.find((x) => String(x.id) === String(id))
    if (!entry) return
    setEditingId(id)
    setFormData({
      client: entry.client,
      volatile: entry.volatile,
      status: entry.status,
      title: entry.title,
      desc: entry.desc,
      ticket: entry.ticket,
      pr: entry.pr,
      user: entry.user,
    })
    setModalOpen(true)
  }

  const handleSubmitEntry = async () => {
    if (!formData.title.trim()) return

    const payload = {
      client: formData.client.trim() || 'Internal',
      volatile: formData.volatile,
      title: formData.title.trim(),
      desc: formData.desc.trim() || '',
      ticket: formData.ticket.trim() || '',
      pr: formData.pr.trim() || '',
      status: formData.status,
      user: currentView === 'admin' ? formData.user.trim() || ME : ME,
    }

    try {
      if (editingId !== null && !isUsingFallbackData) {
        const updated = await updateEntryInStore(editingId, payload)
        setData((prevData) =>
          prevData.map((item) => (String(item.id) === String(editingId) ? updated : item))
        )
      } else if (editingId !== null) {
        setData((prevData) =>
          prevData.map((item) =>
            String(item.id) === String(editingId)
              ? {
                  ...item,
                  ...payload,
                  date: new Date().toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }),
                }
              : item
          )
        )
      } else if (!isUsingFallbackData) {
        const created = await createEntryInStore(payload)
        setData((prevData) => [created, ...prevData])
      } else {
        setData((prevData) => [
          {
            id: Date.now(),
            ...payload,
            date: new Date().toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
          },
          ...prevData,
        ])
      }

      setModalOpen(false)
      setEditingId(null)
    } catch (error) {
      console.error('Failed to save entry:', error)
      window.alert('Unable to save entry. Please check backend function and Data Store configuration.')
    }
  }

  const handleOpenDelete = (id) => {
    setDeletingId(id)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    try {
      if (!isUsingFallbackData) {
        await deleteEntryInStore(deletingId)
      }
      setData((prevData) => prevData.filter((x) => String(x.id) !== String(deletingId)))
      setDeleteConfirmOpen(false)
      setDeletingId(null)
    } catch (error) {
      console.error('Failed to delete entry:', error)
      window.alert('Unable to delete entry. Please check backend function and Data Store configuration.')
    }
  }

  const handleResetFilter = () => {
    setCurrentFilter('all')
    setSearchQuery('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setModalOpen(false)
      setDeleteConfirmOpen(false)
    }
  }

  const deletingEntry = data.find((x) => String(x.id) === String(deletingId))

  return (
    <div className="shell" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* SIDEBAR */}
      <Sidebar
        currentView={currentView}
        onSetView={setCurrentView}
        onSetFilter={setCurrentFilter}
      />

      {/* MAIN */}
      <div className="main">
        {/* TOPBAR */}
        <Topbar
          currentView={currentView}
          entryCount={filteredData.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onResetFilter={handleResetFilter}
          onOpenModal={handleOpenModal}
        />

        {/* FILTER BAR */}
        <FilterBar currentFilter={currentFilter} onSetFilter={setCurrentFilter} />

        {/* FEED */}
        <Feed
          data={filteredData}
          currentView={currentView}
          loading={loading}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
        />
      </div>

      {/* MODAL */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onClickOverlay={() => setModalOpen(false)}
          editingId={editingId}
          formData={formData}
          onFormChange={setFormData}
          onSubmit={handleSubmitEntry}
          showUserField={currentView === 'admin'}
        />
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirmOpen && deletingEntry && (
        <DeleteConfirm
          title={deletingEntry.title}
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}

function Sidebar({ currentView, onSetView, onSetFilter }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="logo-label">IT Tracker</span>
        <span className="logo-name">
          work<span>.</span>log
        </span>
      </div>

      <nav className="nav-section">
        <div className="nav-label">Views</div>
        <button
          className={`nav-item ${currentView === 'mine' ? 'active' : ''}`}
          onClick={() => onSetView('mine')}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="5" r="3" />
            <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" />
          </svg>
          My changes
        </button>
        <button
          className={`nav-item ${currentView === 'admin' ? 'active' : ''}`}
          onClick={() => onSetView('admin')}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="3" width="14" height="10" rx="2" />
            <path d="M5 7h6M5 10h4" />
          </svg>
          Admin view
        </button>
      </nav>

      <nav className="nav-section">
        <div className="nav-label">Volatile</div>
        <button className="nav-item" onClick={() => onSetFilter('Low')}>
          <svg width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="4" fill="#10B981" />
          </svg>
          Low
        </button>
        <button className="nav-item" onClick={() => onSetFilter('Medium')}>
          <svg width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="4" fill="#F59E0B" />
          </svg>
          Medium
        </button>
        <button className="nav-item" onClick={() => onSetFilter('High')}>
          <svg width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="4" fill="#EF4444" />
          </svg>
          High
        </button>
        <button className="nav-item" onClick={() => onSetFilter('Critical')}>
          <svg width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="4" fill="#A855F7" />
          </svg>
          Critical
        </button>
      </nav>

      <nav className="nav-section">
        <div className="nav-label">Status</div>
        <button className="nav-item" onClick={() => onSetFilter('In Progress')}>
          <svg width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="4" fill="#F59E0B" />
          </svg>
          In progress
        </button>
        <button className="nav-item" onClick={() => onSetFilter('Review')}>
          <svg width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="4" fill="#4F8EF7" />
          </svg>
          Review
        </button>
        <button className="nav-item" onClick={() => onSetFilter('Done')}>
          <svg width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="4" fill="#10B981" />
          </svg>
          Done
        </button>
        <button className="nav-item" onClick={() => onSetFilter('Blocked')}>
          <svg width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="4" fill="#EF4444" />
          </svg>
          Blocked
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="avatar">JD</div>
          <div className="user-info">
            <div className="user-name">john.doe</div>
            <div className="user-role">Developer</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function Topbar({ currentView, entryCount, searchQuery, onSearchChange, onResetFilter, onOpenModal }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="page-title">{currentView === 'admin' ? 'Admin — all users' : 'My changes'}</span>
        <span className="entry-count">{entryCount}</span>
      </div>
      <div className="topbar-right">
        <div className="search-wrap">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3 3" />
          </svg>
          <input
            type="text"
            className="search"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <button className="btn btn-ghost" onClick={onResetFilter}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 4h12M5 8h6M7 12h2" />
          </svg>
          Clear
        </button>
        <button className="btn btn-primary" onClick={onOpenModal}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3v10M3 8h10" />
          </svg>
          New entry
        </button>
      </div>
    </header>
  )
}

function FilterBar({ currentFilter, onSetFilter }) {
  const filters = [
    { value: 'all', label: 'All' },
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' },
    { value: 'In Progress', label: 'In progress' },
    { value: 'Review', label: 'Review' },
    { value: 'Done', label: 'Done' },
    { value: 'Blocked', label: 'Blocked' },
  ]

  const getChipClass = (value) => {
    let baseClass = 'chip'
    if (value === currentFilter) {
      const classMap = {
        all: 'active-all',
        Low: 'active-low',
        Medium: 'active-med',
        High: 'active-high',
        Critical: 'active-crit',
      }
      baseClass += ' ' + (classMap[value] || 'active-status')
    }
    return baseClass
  }

  return (
    <div className="filter-bar">
      <span className="filter-label">Filter</span>
      {filters.map((f) => (
        <button
          key={f.value}
          className={getChipClass(f.value)}
          onClick={() => onSetFilter(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

function Feed({ data, currentView, loading, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="feed">
        <div className="empty-state">
          <p>Loading entries...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="feed">
        <div className="empty-state">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }}
          >
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M9 12h6M9 8h6M9 16h3" />
          </svg>
          <p>No entries match.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="feed">
      {data.map((entry, i) => (
        <Card
          key={entry.id}
          entry={entry}
          currentView={currentView}
          index={i}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

function Card({ entry, currentView, index, onEdit, onDelete }) {
  const volClass = {
    Low: 'badge-low',
    Medium: 'badge-med',
    High: 'badge-high',
    Critical: 'badge-critical',
  }

  const dotClass = {
    'In Progress': 'dot-progress',
    Done: 'dot-done',
    Review: 'dot-review',
    Blocked: 'dot-blocked',
  }

  return (
    <div className="card" style={{ animationDelay: `${index * 0.04}s` }}>
      <div className="card-header">
        <span className="badge badge-client">{entry.client}</span>
        <span className={`badge ${volClass[entry.volatile]}`}>{entry.volatile}</span>
        {currentView === 'admin' && <span className="badge badge-user">{entry.user}</span>}
        <div className="card-actions">
          <button className="action-btn edit" onClick={() => onEdit(entry.id)}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M11 2l3 3-9 9H2v-3L11 2z" />
            </svg>
            Edit
          </button>
          <button className="action-btn delete" onClick={() => onDelete(entry.id)}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" />
            </svg>
            Delete
          </button>
        </div>
      </div>
      <div className="card-title">{entry.title}</div>
      <div className="card-desc">{entry.desc}</div>
      <div className="card-divider"></div>
      <div className="card-footer">
        {entry.ticket && (
          <a className="link-btn" href={entry.ticket} target="_blank" rel="noopener noreferrer">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="2" width="12" height="12" rx="2" />
              <path d="M5.5 8h5M8 5.5v5" />
            </svg>
            Ticket
          </a>
        )}
        {entry.pr && (
          <a className="link-btn" href={entry.pr} target="_blank" rel="noopener noreferrer">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="4" cy="4" r="1.5" />
              <circle cx="4" cy="12" r="1.5" />
              <circle cx="12" cy="4" r="1.5" />
              <path d="M4 5.5v5M5.5 4h3a2 2 0 0 1 2 2v.5" />
            </svg>
            PR
          </a>
        )}
        <span className="date-str">{entry.date}</span>
        <span className="status-badge">
          <span className={`status-dot ${dotClass[entry.status]}`}></span>
          {entry.status}
        </span>
      </div>
    </div>
  )
}

function Modal({
  isOpen,
  onClose,
  onClickOverlay,
  editingId,
  formData,
  onFormChange,
  onSubmit,
  showUserField,
}) {
  const handleFormChange = (field, value) => {
    onFormChange({ ...formData, [field]: value })
  }

  const isEditMode = editingId !== null

  return (
    <div
      className={`overlay ${isOpen ? 'open' : ''}`}
      onClick={onClickOverlay}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-title">
              {isEditMode ? 'Edit entry' : 'New entry'}
            </span>
            <span className={`modal-mode-badge ${isEditMode ? 'edit-mode' : ''}`}>
              {isEditMode ? 'editing' : 'new'}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="field">
          <label>Client tag</label>
          <input
            value={formData.client}
            onChange={(e) => handleFormChange('client', e.target.value)}
            placeholder="e.g. Acme Corp"
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Volatile</label>
            <select
              value={formData.volatile}
              onChange={(e) => handleFormChange('volatile', e.target.value)}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleFormChange('status', e.target.value)}
            >
              <option>In Progress</option>
              <option>Review</option>
              <option>Done</option>
              <option>Blocked</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Title</label>
          <input
            value={formData.title}
            onChange={(e) => handleFormChange('title', e.target.value)}
            placeholder="Short summary of the change"
          />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea
            value={formData.desc}
            onChange={(e) => handleFormChange('desc', e.target.value)}
            placeholder="What changed, why, and how..."
          ></textarea>
        </div>

        <div className="field">
          <label>Ticket link</label>
          <input
            value={formData.ticket}
            onChange={(e) => handleFormChange('ticket', e.target.value)}
            placeholder="https://jira.company.com/PROJ-0000"
          />
        </div>

        <div className="field">
          <label>PR link</label>
          <input
            value={formData.pr}
            onChange={(e) => handleFormChange('pr', e.target.value)}
            placeholder="https://github.com/org/repo/pull/0"
          />
        </div>

        {showUserField && (
          <div className="field">
            <label>Assigned to</label>
            <input
              value={formData.user}
              onChange={(e) => handleFormChange('user', e.target.value)}
              placeholder="dev@company.com"
            />
          </div>
        )}

        <button className="modal-submit" onClick={onSubmit}>
          {isEditMode ? 'Save changes' : 'Add entry'}
        </button>
      </div>
    </div>
  )
}

function DeleteConfirm({ title, onCancel, onConfirm }) {
  return (
    <div className="delete-confirm open">
      <div className="delete-box">
        <div className="delete-title">Delete this entry?</div>
        <div className="delete-sub">"{title}" will be permanently removed.</div>
        <div className="delete-actions">
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn"
            style={{ background: 'var(--high)', color: '#fff', border: 'none' }}
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
