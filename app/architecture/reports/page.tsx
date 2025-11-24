'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { post, get } from '@/lib/api'
import { sanitizeInput } from '@/lib/security'

interface ReportTemplate {
  id: number
  name: string
  type: string
  description: string | null
  schedule: string | null
  format: string
  is_active: boolean
  created_at: string
}

interface GeneratedReport {
  id: number
  template_id: number
  template_name: string
  template_type: string
  report_url: string | null
  format: string | null
  status: string
  created_at: string
  completed_at: string | null
}

export default function ReportsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'templates' | 'generated'>('templates')
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'performance',
    description: '',
    schedule: '',
    format: 'pdf',
    recipients: [] as string[]
  })
  const [recipientEmail, setRecipientEmail] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchTemplates()
    fetchGeneratedReports()
  }, [router])

  const fetchTemplates = async () => {
    try {
      const response = await get('/reports/templates')
      if (response.data?.templates) {
        setTemplates(response.data.templates)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGeneratedReports = async () => {
    try {
      const response = await get('/reports/generated')
      if (response.data?.reports) {
        setGeneratedReports(response.data.reports)
      }
    } catch (error) {
      console.error('Error fetching generated reports:', error)
    }
  }

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreateLoading(true)

    if (!formData.name || !formData.type) {
      setCreateError('Name and type are required')
      setCreateLoading(false)
      return
    }

    try {
      const response = await post('/reports/templates', {
        name: sanitizeInput(formData.name),
        type: formData.type,
        description: sanitizeInput(formData.description),
        schedule: formData.schedule || null,
        format: formData.format,
        recipients: formData.recipients,
        query_config: {}
      })

      if (response.error) {
        setCreateError(response.error || response.message || 'Failed to create template')
        return
      }

      if (response.data?.template) {
        setTemplates([...templates, response.data.template])
        setFormData({ name: '', type: 'performance', description: '', schedule: '', format: 'pdf', recipients: [] })
        setShowCreateModal(false)
      } else {
        setCreateError('Failed to create template')
      }
    } catch (error: any) {
      console.error('Error creating template:', error)
      setCreateError(error.message || 'Error creating template')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemplate) return

    setCreateError('')
    setCreateLoading(true)

    try {
      const response = await post('/reports/generate', {
        template_id: selectedTemplate,
        parameters: {}
      })

      if (response.error) {
        setCreateError(response.error || response.message || 'Failed to generate report')
        return
      }

      if (response.data?.report) {
        await fetchGeneratedReports()
        setShowGenerateModal(false)
        setSelectedTemplate(null)
      } else {
        setCreateError('Failed to generate report')
      }
    } catch (error: any) {
      console.error('Error generating report:', error)
      setCreateError(error.message || 'Error generating report')
    } finally {
      setCreateLoading(false)
    }
  }

  const addRecipient = () => {
    if (recipientEmail && !formData.recipients.includes(recipientEmail)) {
      setFormData({ ...formData, recipients: [...formData.recipients, recipientEmail] })
      setRecipientEmail('')
    }
  }

  const removeRecipient = (email: string) => {
    setFormData({ ...formData, recipients: formData.recipients.filter(e => e !== email) })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
      <header className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-white text-xl font-semibold">Reports</span>
        </div>
        <Link href="/architecture" className="text-white hover:text-slate-300 text-sm">
          ← Architecture
        </Link>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="mb-6 flex space-x-4 border-b border-white/20">
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'templates'
                ? 'text-teal-400 border-b-2 border-teal-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Report Templates
          </button>
          <button
            onClick={() => setActiveTab('generated')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'generated'
                ? 'text-teal-400 border-b-2 border-teal-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Generated Reports
          </button>
        </div>

        {/* Report Templates Tab */}
        {activeTab === 'templates' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Report Templates</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
              >
                Create Template
              </button>
            </div>

            {loading ? (
              <div className="text-white text-center py-12">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 text-center">
                <p className="text-white mb-4">No report templates yet.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                >
                  Create Your First Template
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-white font-semibold text-lg">{template.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        template.is_active
                          ? 'bg-green-500/20 text-green-200 border border-green-500'
                          : 'bg-red-500/20 text-red-200 border border-red-500'
                      }`}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm mb-2">{template.type}</p>
                    {template.description && (
                      <p className="text-slate-400 text-sm mb-3">{template.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Format: {template.format.toUpperCase()}</span>
                      {template.schedule && <span>Schedule: {template.schedule}</span>}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTemplate(template.id)
                        setShowGenerateModal(true)
                      }}
                      className="mt-4 w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                    >
                      Generate Report
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Generated Reports Tab */}
        {activeTab === 'generated' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Generated Reports</h2>
            {generatedReports.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 text-center">
                <p className="text-white">No reports generated yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedReports.map(report => (
                  <div
                    key={report.id}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-white font-semibold text-lg">{report.template_name}</h3>
                        <p className="text-slate-300 text-sm">{report.template_type}</p>
                      </div>
                      <span className={`px-3 py-1 rounded text-sm ${
                        report.status === 'completed'
                          ? 'bg-green-500/20 text-green-200 border border-green-500'
                          : report.status === 'generating'
                          ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500'
                          : 'bg-red-500/20 text-red-200 border border-red-500'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
                      <span>Created: {new Date(report.created_at).toLocaleString()}</span>
                      {report.completed_at && (
                        <span>Completed: {new Date(report.completed_at).toLocaleString()}</span>
                      )}
                    </div>
                    {report.status === 'completed' && (
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('token')
                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
                            const response = await fetch(
                              `${apiUrl}/api/reports/${report.id}/download`,
                              {
                                headers: {
                                  Authorization: `Bearer ${token}`
                                }
                              }
                            )
                            
                            if (response.ok) {
                              const blob = await response.blob()
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              const contentDisposition = response.headers.get('Content-Disposition')
                              const filename = contentDisposition
                                ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
                                : `report-${report.id}.${report.format || 'json'}`
                              a.download = filename
                              document.body.appendChild(a)
                              a.click()
                              window.URL.revokeObjectURL(url)
                              document.body.removeChild(a)
                            } else {
                              const errorData = await response.json().catch(() => ({ message: 'Failed to download report' }))
                              alert(errorData.message || 'Failed to download report')
                            }
                          } catch (error: any) {
                            console.error('Error downloading report:', error)
                            alert(error.message || 'Error downloading report')
                          }
                        }}
                        className="inline-block px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                      >
                        Download Report
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Template Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Create Report Template</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateError('')
                    setFormData({ name: '', type: 'performance', description: '', schedule: '', format: 'pdf', recipients: [] })
                  }}
                  className="text-white hover:text-slate-300"
                >
                  ✕
                </button>
              </div>

              {createError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateTemplate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white mb-2">Template Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                      placeholder="Performance Report"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-slate-800/80 border border-white/30 text-white"
                    >
                      <option value="performance">Performance</option>
                      <option value="compliance">Compliance</option>
                      <option value="financial">Financial</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                      placeholder="Report description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white mb-2">Schedule</label>
                      <select
                        value={formData.schedule}
                        onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-slate-800/80 border border-white/30 text-white"
                      >
                        <option value="">Manual</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white mb-2">Format</label>
                      <select
                        value={formData.format}
                        onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-slate-800/80 border border-white/30 text-white"
                      >
                        <option value="pdf">PDF</option>
                        <option value="csv">CSV</option>
                        <option value="json">JSON</option>
                        <option value="html">HTML</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white mb-2">Recipients (Email)</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
                        className="flex-1 px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                        placeholder="email@example.com"
                      />
                      <button
                        type="button"
                        onClick={addRecipient}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
                      >
                        Add
                      </button>
                    </div>
                    {formData.recipients.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.recipients.map(email => (
                          <span
                            key={email}
                            className="px-3 py-1 bg-slate-700/50 text-white rounded-lg text-sm flex items-center gap-2"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() => removeRecipient(email)}
                              className="hover:text-red-400"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createLoading ? 'Creating...' : 'Create Template'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setCreateError('')
                      setFormData({ name: '', type: 'performance', description: '', schedule: '', format: 'pdf', recipients: [] })
                    }}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Generate Report Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Generate Report</h2>
                <button
                  onClick={() => {
                    setShowGenerateModal(false)
                    setSelectedTemplate(null)
                    setCreateError('')
                  }}
                  className="text-white hover:text-slate-300"
                >
                  ✕
                </button>
              </div>

              {createError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                  {createError}
                </div>
              )}

              <form onSubmit={handleGenerateReport}>
                <p className="text-white mb-4">
                  Generate a new report from the selected template?
                </p>

                <div className="mt-6 flex space-x-3">
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createLoading ? 'Generating...' : 'Generate Report'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGenerateModal(false)
                      setSelectedTemplate(null)
                      setCreateError('')
                    }}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg"
                  >
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

