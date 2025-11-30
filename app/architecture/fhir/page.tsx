'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { post, get } from '@/lib/api'
import { sanitizeInput } from '@/lib/security'
import { isAuthenticated } from '@/lib/auth'

interface FHIRConnector {
  id: number
  name: string
  fhir_version: string
  base_url: string
  resource_types: string[]
  is_active: boolean
}

export default function FHIRPage() {
  const router = useRouter()
  const [connectors, setConnectors] = useState<FHIRConnector[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    fhir_version: 'R4',
    base_url: '',
    resource_types: [] as string[],
    authentication_type: 'oauth2'
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
      const response = await get('/integrations-ehr/fhir')
      if (response.data?.connectors) {
        setConnectors(response.data.connectors)
      }
    } catch (error) {
      console.error('Error fetching FHIR connectors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreateLoading(true)

    if (!formData.name || !formData.base_url) {
      setCreateError('Name and Base URL are required')
      setCreateLoading(false)
      return
    }

    // Validate URL
    try {
      new URL(formData.base_url)
    } catch {
      setCreateError('Invalid Base URL format')
      setCreateLoading(false)
      return
    }

    try {
      const response = await post('/integrations-ehr/fhir', {
        name: sanitizeInput(formData.name),
        fhir_version: formData.fhir_version,
        base_url: sanitizeInput(formData.base_url),
        resource_types: formData.resource_types,
        authentication_type: formData.authentication_type,
        credentials: {}
      })

      if (response.error) {
        setCreateError(response.error || response.message || 'Failed to create FHIR connector')
        return
      }

      if (response.data?.connector) {
        setShowCreateModal(false)
        setFormData({ name: '', fhir_version: 'R4', base_url: '', resource_types: [], authentication_type: 'oauth2' })
        setCreateError('')
        fetchConnectors()
      } else {
        setCreateError('Failed to create FHIR connector')
      }
    } catch (error: any) {
      console.error('Error creating FHIR connector:', error)
      setCreateError(error.message || 'Error creating FHIR connector')
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
          <span className="text-white text-xl font-semibold">FHIR Connectors</span>
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
                  <p className="text-slate-300 text-sm">FHIR {connector.fhir_version}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${connector.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
                  {connector.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-teal-300 text-sm mb-2">{connector.base_url}</p>
              {connector.resource_types && connector.resource_types.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {connector.resource_types.map((type, idx) => (
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
              <h2 className="text-2xl font-bold text-white mb-6">Create FHIR Connector</h2>
              
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
                  <label className="block text-white mb-2">FHIR Version</label>
                  <select
                    value={formData.fhir_version}
                    onChange={(e) => setFormData({ ...formData, fhir_version: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  >
                    <option value="STU3" className="bg-slate-800">STU3</option>
                    <option value="R4" className="bg-slate-800">R4</option>
                    <option value="R5" className="bg-slate-800">R5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white mb-2">Base URL</label>
                  <input
                    type="url"
                    required
                    value={formData.base_url}
                    onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                    placeholder="https://fhir.example.com"
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

