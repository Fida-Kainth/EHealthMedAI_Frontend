'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { post, get } from '@/lib/api'
import { sanitizeInput } from '@/lib/security'
import { isAuthenticated } from '@/lib/auth'

interface EHRSystem {
  id: number
  name: string
  vendor: string
  integration_type: string
  connection_status: string
  last_sync: string
}

export default function EHRPage() {
  const router = useRouter()
  const [ehrSystems, setEhrSystems] = useState<EHRSystem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    vendor: '',
    integration_type: 'hl7',
    api_endpoint: '',
    credentials: {}
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchEHRSystems()
  }, [router])

  const fetchEHRSystems = async () => {
    try {
      const response = await get('/integrations-ehr/systems')
      if (response.data?.systems) {
        setEhrSystems(response.data.systems)
      }
    } catch (error) {
      console.error('Error fetching EHR systems:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreateLoading(true)

    // Sanitize input
    const sanitizedData = {
      name: sanitizeInput(formData.name),
      vendor: sanitizeInput(formData.vendor),
      integration_type: formData.integration_type,
      api_endpoint: sanitizeInput(formData.api_endpoint),
      credentials: formData.credentials
    }

    try {
      const response = await post('/integrations-ehr/systems', sanitizedData)
      
      if (response.data?.system) {
        setShowCreateModal(false)
        setCreateError('')
        setFormData({ 
          name: '', 
          vendor: '', 
          integration_type: 'hl7', 
          api_endpoint: '', 
          credentials: {} 
        })
        fetchEHRSystems()
      } else {
        setCreateError(response.error || response.message || 'Failed to connect EHR system')
      }
    } catch (error: any) {
      console.error('Error creating EHR system:', error)
      setCreateError(error.message || 'Failed to connect EHR system. Please try again.')
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
          <span className="text-white text-xl font-semibold">EHR Systems</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/architecture" className="text-white hover:text-slate-300 text-sm">
            ← Architecture
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-teal-600 hover:bg-teal-600 text-white px-4 py-2 rounded-lg"
          >
            + Connect EHR
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ehrSystems.map((system) => (
            <div key={system.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{system.name}</h3>
                  <p className="text-slate-300 text-sm">{system.vendor}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  system.connection_status === 'connected' ? 'bg-green-500' : 
                  system.connection_status === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                } text-white`}>
                  {system.connection_status}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-300">Integration: </span>
                  <span className="text-white capitalize">{system.integration_type}</span>
                </div>
                {system.last_sync && (
                  <div>
                    <span className="text-slate-300">Last Sync: </span>
                    <span className="text-white">{new Date(system.last_sync).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {ehrSystems.length === 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center border border-white/20">
            <p className="text-white text-lg mb-4">No EHR systems connected</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-teal-600 hover:bg-teal-600 text-white px-6 py-2 rounded-lg"
            >
              Connect First EHR System
            </button>
          </div>
        )}

        {showCreateModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" 
            onClick={() => {
              setShowCreateModal(false)
              setCreateError('')
              setFormData({ 
                name: '', 
                vendor: '', 
                integration_type: 'hl7', 
                api_endpoint: '', 
                credentials: {} 
              })
            }}
          >
            <div className="bg-slate-900 rounded-xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-white mb-6">Connect EHR System</h2>
              
              {createError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-white mb-2">System Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Vendor</label>
                  <input
                    type="text"
                    required
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                    placeholder="Epic, Cerner, Allscripts, etc."
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Integration Type</label>
                  <select
                    value={formData.integration_type}
                    onChange={(e) => setFormData({ ...formData, integration_type: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  >
                    <option value="hl7" className="bg-slate-800">HL7</option>
                    <option value="fhir" className="bg-slate-800">FHIR</option>
                    <option value="api" className="bg-slate-800">REST API</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white mb-2">API Endpoint</label>
                  <input
                    type="url"
                    value={formData.api_endpoint}
                    onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowCreateModal(false)
                      setCreateError('')
                      setFormData({ 
                        name: '', 
                        vendor: '', 
                        integration_type: 'hl7', 
                        api_endpoint: '', 
                        credentials: {} 
                      })
                    }} 
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                    disabled={createLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={createLoading}
                  >
                    {createLoading ? 'Connecting...' : 'Connect'}
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

