'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated } from '@/lib/auth'

interface SRSDocument {
  id: number
  document_id: string
  title: string
  section: string
  subsection: string
  version: string
  status: string
  content: string
}

const sections = [
  { value: 'overview', label: 'Overview' },
  { value: 'functional_requirements', label: 'Functional Requirements' },
  { value: 'external_interfaces', label: 'External Interfaces' },
  { value: 'nfrs', label: 'Non-Functional Requirements' },
  { value: 'data_models', label: 'Data Models' },
  { value: 'use_cases', label: 'Use Cases' },
  { value: 'acceptance_criteria', label: 'Acceptance Criteria' },
  { value: 'deployment_ops', label: 'Deployment & Operations' },
  { value: 'appendices', label: 'Appendices' }
]

export default function SRSPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<SRSDocument[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<SRSDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSection, setSelectedSection] = useState<string>('all')
  const [selectedDoc, setSelectedDoc] = useState<SRSDocument | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    document_id: '',
    title: '',
    section: 'overview',
    subsection: '',
    content: '',
    version: '1.0'
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchDocuments()
  }, [router])

  useEffect(() => {
    filterDocuments()
  }, [selectedSection, documents])

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/srs/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents)
        setFilteredDocuments(data.documents)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterDocuments = () => {
    if (selectedSection === 'all') {
      setFilteredDocuments(documents)
    } else {
      setFilteredDocuments(documents.filter(d => d.section === selectedSection))
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/srs/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        setShowCreateModal(false)
        setFormData({ document_id: '', title: '', section: 'overview', subsection: '', content: '', version: '1.0' })
        fetchDocuments()
      }
    } catch (error) {
      console.error('Error creating document:', error)
    }
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/50',
    in_review: 'bg-yellow-500/50',
    approved: 'bg-green-500/50',
    published: 'bg-teal-600/50',
    deprecated: 'bg-red-500/50'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading SRS documents...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
      <header className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-white text-xl font-semibold">SRS Documents</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-white hover:text-slate-300 text-sm">
            ← Dashboard
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg"
          >
            + New Document
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Section Filter */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20">
          <label className="block text-white font-semibold mb-3">Filter by Section</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full md:w-64 px-4 py-2 rounded-lg bg-slate-800/80 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            style={{ colorScheme: 'dark' }}
          >
            <option value="all" className="bg-slate-800 text-white">All Sections</option>
            {sections.map(section => (
              <option key={section.value} value={section.value} className="bg-slate-800 text-white">
                {section.label}
              </option>
            ))}
          </select>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 cursor-pointer transition-all hover:bg-white/20 ${
                selectedDoc?.id === doc.id ? 'ring-2 ring-blue-400' : 'border-white/20'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-teal-300 font-mono text-sm">{doc.document_id}</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${statusColors[doc.status]}`}>
                    {doc.status}
                  </span>
                </div>
                <span className="text-slate-300 text-xs">v{doc.version}</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{doc.title}</h3>
              <p className="text-slate-300 text-sm mb-2 capitalize">{doc.section}</p>
              <p className="text-slate-200 text-sm line-clamp-3">{doc.content.substring(0, 150)}...</p>
            </div>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center border border-white/20">
            <p className="text-white text-lg">No documents found in this section</p>
          </div>
        )}

        {/* Document Detail Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedDoc(null)}>
            <div className="bg-slate-900 rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedDoc.title}</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-teal-300 font-mono">{selectedDoc.document_id}</span>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${statusColors[selectedDoc.status]}`}>
                      {selectedDoc.status}
                    </span>
                    <span className="text-slate-300">v{selectedDoc.version}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="text-white hover:text-slate-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-white font-semibold mb-2">Section</h3>
                  <p className="text-slate-200 capitalize">{selectedDoc.section}</p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Content</h3>
                  <div className="text-slate-200 whitespace-pre-wrap bg-slate-950/50 p-4 rounded-lg">
                    {selectedDoc.content}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateModal(false)}>
            <div className="bg-slate-900 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-white mb-6">Create SRS Document</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-white mb-2">Document ID</label>
                  <input
                    type="text"
                    required
                    value={formData.document_id}
                    onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                    placeholder="SRS-001"
                  />
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white mb-2">Section</label>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                    >
                      {sections.map(s => (
                        <option key={s.value} value={s.value} className="bg-slate-800">{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white mb-2">Version</label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-white mb-2">Subsection (Optional)</label>
                  <input
                    type="text"
                    value={formData.subsection}
                    onChange={(e) => setFormData({ ...formData, subsection: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Content</label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={10}
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

