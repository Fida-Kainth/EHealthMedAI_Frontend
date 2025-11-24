'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { post, get } from '@/lib/api'
import { sanitizeInput } from '@/lib/security'

interface SDK {
  id: number
  name: string
  language: string
  version: string
  download_url: string
  documentation_url: string
  is_active: boolean
}

export default function SDKsPage() {
  const router = useRouter()
  const [sdks, setSdks] = useState<SDK[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    language: 'javascript',
    version: '1.0.0',
    download_url: '',
    documentation_url: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchSDKs()
  }, [router])

  const fetchSDKs = async () => {
    try {
      const response = await get('/presentation/sdks')
      if (response.data?.sdks) {
        setSdks(response.data.sdks)
      }
    } catch (error) {
      console.error('Error fetching SDKs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreateLoading(true)

    if (!formData.name || !formData.version) {
      setCreateError('Name and version are required')
      setCreateLoading(false)
      return
    }

    // Validate URLs if provided
    if (formData.download_url) {
      try {
        new URL(formData.download_url)
      } catch {
        setCreateError('Invalid download URL format')
        setCreateLoading(false)
        return
      }
    }

    if (formData.documentation_url) {
      try {
        new URL(formData.documentation_url)
      } catch {
        setCreateError('Invalid documentation URL format')
        setCreateLoading(false)
        return
      }
    }

    try {
      const response = await post('/presentation/sdks', {
        name: sanitizeInput(formData.name),
        language: formData.language,
        version: sanitizeInput(formData.version),
        download_url: formData.download_url ? sanitizeInput(formData.download_url) : null,
        documentation_url: formData.documentation_url ? sanitizeInput(formData.documentation_url) : null,
        api_key_prefix: null
      })

      if (response.error) {
        setCreateError(response.error || response.message || 'Failed to create SDK')
        return
      }

      if (response.data?.sdk) {
        setShowCreateModal(false)
        setFormData({ name: '', language: 'javascript', version: '1.0.0', download_url: '', documentation_url: '' })
        setCreateError('')
        fetchSDKs()
      } else {
        setCreateError('Failed to create SDK')
      }
    } catch (error: any) {
      console.error('Error creating SDK:', error)
      setCreateError(error.message || 'Error creating SDK')
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
          <span className="text-white text-xl font-semibold">SDKs</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/architecture" className="text-white hover:text-slate-300 text-sm">
            ← Architecture
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-teal-600 hover:bg-teal-600 text-white px-4 py-2 rounded-lg"
          >
            + New SDK
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sdks.map((sdk) => (
            <div key={sdk.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{sdk.name}</h3>
                  <p className="text-slate-300 text-sm">{sdk.language} v{sdk.version}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${sdk.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
                  {sdk.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-2">
                {sdk.download_url && (
                  <a href={sdk.download_url} target="_blank" rel="noopener noreferrer" className="block text-teal-300 hover:text-slate-300 text-sm">
                    Download
                  </a>
                )}
                {sdk.documentation_url && (
                  <a href={sdk.documentation_url} target="_blank" rel="noopener noreferrer" className="block text-teal-300 hover:text-slate-300 text-sm">
                    Documentation
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => {
            setShowCreateModal(false)
            setCreateError('')
          }}>
            <div className="bg-slate-900 rounded-xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-white mb-6">Create SDK</h2>
              
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
                  <label className="block text-white mb-2">Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-800/80 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="javascript" className="bg-slate-800">JavaScript</option>
                    <option value="python" className="bg-slate-800">Python</option>
                    <option value="java" className="bg-slate-800">Java</option>
                    <option value="php" className="bg-slate-800">PHP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white mb-2">Version</label>
                  <input
                    type="text"
                    required
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Download URL</label>
                  <input
                    type="url"
                    value={formData.download_url}
                    onChange={(e) => setFormData({ ...formData, download_url: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Documentation URL</label>
                  <input
                    type="url"
                    value={formData.documentation_url}
                    onChange={(e) => setFormData({ ...formData, documentation_url: e.target.value })}
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

