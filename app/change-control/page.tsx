'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated } from '@/lib/auth'

interface ChangeControl {
  id: number
  change_id: string
  change_type: string
  title: string
  description: string
  reason: string
  impact_assessment: string
  status: string
  proposed_by_email: string
  reviewed_by_email: string
  approved_by_email: string
  created_at: string
}

export default function ChangeControlPage() {
  const router = useRouter()
  const [changes, setChanges] = useState<ChangeControl[]>([])
  const [filteredChanges, setFilteredChanges] = useState<ChangeControl[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    change_type: 'all'
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    change_id: '',
    change_type: 'requirement_change',
    title: '',
    description: '',
    reason: '',
    impact_assessment: '',
    affected_documents: [] as string[],
    affected_requirements: [] as string[]
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchChanges()
  }, [router])

  useEffect(() => {
    filterChanges()
  }, [filters, changes])

  const fetchChanges = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/change-control`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setChanges(data.changes)
        setFilteredChanges(data.changes)
      }
    } catch (error) {
      console.error('Error fetching changes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterChanges = () => {
    let filtered = changes

    if (filters.status !== 'all') {
      filtered = filtered.filter(c => c.status === filters.status)
    }

    if (filters.change_type !== 'all') {
      filtered = filtered.filter(c => c.change_type === filters.change_type)
    }

    setFilteredChanges(filtered)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/change-control`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        setShowCreateModal(false)
        setFormData({ change_id: '', change_type: 'requirement_change', title: '', description: '', reason: '', impact_assessment: '', affected_documents: [], affected_requirements: [] })
        fetchChanges()
      }
    } catch (error) {
      console.error('Error creating change request:', error)
    }
  }

  const statusColors: Record<string, string> = {
    proposed: 'bg-gray-500/50',
    under_review: 'bg-yellow-500/50',
    approved: 'bg-green-500/50',
    rejected: 'bg-red-500/50',
    implemented: 'bg-teal-600/50'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading change control log...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
      <header className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-white text-xl font-semibold">Change Control Log</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-white hover:text-slate-300 text-sm">
            ← Dashboard
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg"
          >
            + New Change Request
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
              >
                <option value="all" className="bg-slate-800">All Statuses</option>
                <option value="proposed" className="bg-slate-800">Proposed</option>
                <option value="under_review" className="bg-slate-800">Under Review</option>
                <option value="approved" className="bg-slate-800">Approved</option>
                <option value="rejected" className="bg-slate-800">Rejected</option>
                <option value="implemented" className="bg-slate-800">Implemented</option>
              </select>
            </div>
            <div>
              <label className="block text-white text-sm mb-2">Change Type</label>
              <select
                value={filters.change_type}
                onChange={(e) => setFilters({ ...filters, change_type: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
              >
                <option value="all" className="bg-slate-800">All Types</option>
                <option value="requirement_change" className="bg-slate-800">Requirement Change</option>
                <option value="constraint_change" className="bg-slate-800">Constraint Change</option>
                <option value="assumption_change" className="bg-slate-800">Assumption Change</option>
                <option value="new_feature" className="bg-slate-800">New Feature</option>
                <option value="bug_fix" className="bg-slate-800">Bug Fix</option>
              </select>
            </div>
          </div>
        </div>

        {/* Changes List */}
        <div className="space-y-4">
          {filteredChanges.map((change) => (
            <div
              key={change.id}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-teal-300 font-mono text-sm">{change.change_id}</span>
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${statusColors[change.status]}`}>
                      {change.status}
                    </span>
                    <span className="px-3 py-1 rounded text-xs font-semibold bg-purple-500/50 text-white">
                      {change.change_type.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">{change.title}</h3>
                  <p className="text-slate-200 mb-3">{change.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {change.reason && (
                  <div>
                    <div className="text-slate-300 font-semibold mb-1">Reason</div>
                    <div className="text-slate-200">{change.reason}</div>
                  </div>
                )}
                {change.impact_assessment && (
                  <div>
                    <div className="text-slate-300 font-semibold mb-1">Impact Assessment</div>
                    <div className="text-slate-200">{change.impact_assessment}</div>
                  </div>
                )}
                {change.proposed_by_email && (
                  <div>
                    <div className="text-slate-300">Proposed By</div>
                    <div className="text-white">{change.proposed_by_email}</div>
                  </div>
                )}
                <div>
                  <div className="text-slate-300">Created</div>
                  <div className="text-white">{new Date(change.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredChanges.length === 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center border border-white/20">
            <p className="text-white text-lg mb-4">No change requests found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg"
            >
              Create First Change Request
            </button>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateModal(false)}>
            <div className="bg-slate-900 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-white mb-6">Create Change Request</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white mb-2">Change ID</label>
                    <input
                      type="text"
                      required
                      value={formData.change_id}
                      onChange={(e) => setFormData({ ...formData, change_id: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                      placeholder="CHG-001"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2">Change Type</label>
                    <select
                      value={formData.change_type}
                      onChange={(e) => setFormData({ ...formData, change_type: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                    >
                      <option value="requirement_change" className="bg-slate-800">Requirement Change</option>
                      <option value="constraint_change" className="bg-slate-800">Constraint Change</option>
                      <option value="assumption_change" className="bg-slate-800">Assumption Change</option>
                      <option value="new_feature" className="bg-slate-800">New Feature</option>
                      <option value="bug_fix" className="bg-slate-800">Bug Fix</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-white mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Reason</label>
                  <textarea
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Impact Assessment</label>
                  <textarea
                    required
                    value={formData.impact_assessment}
                    onChange={(e) => setFormData({ ...formData, impact_assessment: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  />
                </div>
                <div className="flex gap-4">
                  <button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg">
                    Create
                  </button>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

