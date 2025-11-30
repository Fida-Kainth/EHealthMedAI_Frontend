'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { post, get } from '@/lib/api'
import { sanitizeInput } from '@/lib/security'
import { isAuthenticated } from '@/lib/auth'

interface HL7Connector {
  id: number
  name: string
  hl7_version: string
  message_types: string[]
  endpoint_url: string
  is_active: boolean
}

export default function HL7Page() {
  const router = useRouter()
  const [connectors, setConnectors] = useState<HL7Connector[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    hl7_version: '2.8',
    message_types: [] as string[],
    endpoint_url: '',
    authentication_type: 'basic',
    credentials: {}
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchConnectors()
  }, [router])

  const fetchConnectors = async () => {
    try {
      const response = await get('/integrations-ehr/hl7')
      if (response.data?.connectors) {
        setConnectors(response.data.connectors)
      }
    } catch (error) {
      console.error('Error fetching HL7 connectors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreateLoading(true)

    if (!formData.name || !formData.endpoint_url) {
      setCreateError('Name and Endpoint URL are required')
      setCreateLoading(false)
      return
    }

    // Validate URL
    try {
      new URL(formData.endpoint_url)
    } catch {
      setCreateError('Invalid Endpoint URL format')
      setCreateLoading(false)
      return
    }

    try {
      const response = await post('/integrations-ehr/hl7', {
        name: sanitizeInput(formData.name),
        hl7_version: formData.hl7_version,
        message_types: formData.message_types,
        endpoint_url: sanitizeInput(formData.endpoint_url),
        authentication_type: formData.authentication_type,
        credentials: formData.credentials
      })

      if (response.error) {
        setCreateError(response.error || response.message || 'Failed to create HL7 connector')
        return
      }

      if (response.data?.connector) {
        setShowCreateModal(false)
        setFormData({ name: '', hl7_version: '2.8', message_types: [], endpoint_url: '', authentication_type: 'basic', credentials: {} })
        setCreateError('')
        fetchConnectors()
      } else {
        setCreateError('Failed to create HL7 connector')
      }
    } catch (error: any) {
      console.error('Error creating HL7 connector:', error)
      setCreateError(error.message || 'Error creating HL7 connector')
    } finally {
      setCreateLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
      <header className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="text-white text-xl font-semibold">HL7 Connectors</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/architecture" className="text-white hover:text-slate-300 text-sm">
            ← Architecture
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-teal-600 hover:bg-teal-600 text-white px-4 py-2 rounded-lg"
          >
            + New Connector
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {connectors.map((connector) => (
            <div key={connector.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{connector.name}</h3>
                  <p className="text-slate-300 text-sm">HL7 v{connector.hl7_version}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${connector.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
                  {connector.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {connector.endpoint_url && (
                <p className="text-teal-300 text-sm mb-2">{connector.endpoint_url}</p>
              )}
              {connector.message_types && connector.message_types.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {connector.message_types.map((type, idx) => (
                    <span key={idx} className="px-2 py-1 bg-teal-600/50 text-white text-xs rounded">
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => {
            setShowCreateModal(false)
            setCreateError('')
          }}>
            <div className="bg-slate-900 rounded-xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-white mb-6">Create HL7 Connector</h2>
              
              {createError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-white mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">HL7 Version</label>
                  <select
                    value={formData.hl7_version}
                    onChange={(e) => setFormData({ ...formData, hl7_version: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  >
                    <option value="2.3" className="bg-slate-800">2.3</option>
                    <option value="2.5" className="bg-slate-800">2.5</option>
                    <option value="2.8" className="bg-slate-800">2.8</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white mb-2">Endpoint URL</label>
                  <input
                    type="url"
                    required
                    value={formData.endpoint_url}
                    onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    type="submit" 
                    disabled={createLoading}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {createLoading ? 'Creating...' : 'Create'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowCreateModal(false)
                      setCreateError('')
                    }} 
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
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

