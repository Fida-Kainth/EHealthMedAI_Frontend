'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { post, get } from '@/lib/api'
import { sanitizeInput } from '@/lib/security'

interface Portal {
  id: number
  name: string
  type: string
  url: string
  is_active: boolean
}

export default function PortalsPage() {
  const router = useRouter()
  const [portals, setPortals] = useState<Portal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'admin',
    url: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchPortals()
  }, [router])

  const fetchPortals = async () => {
    try {
      const response = await get('/presentation/portals')
      if (response.data?.portals) {
        setPortals(response.data.portals)
      }
    } catch (error) {
      console.error('Error fetching portals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreateLoading(true)

    if (!formData.name) {
      setCreateError('Name is required')
      setCreateLoading(false)
      return
    }

    if (formData.url) {
      // Validate URL if provided
      try {
        new URL(formData.url)
      } catch {
        setCreateError('Invalid URL format')
        setCreateLoading(false)
        return
      }
    }

    try {
      const response = await post('/presentation/portals', {
        name: sanitizeInput(formData.name),
        type: formData.type,
        url: formData.url ? sanitizeInput(formData.url) : null,
        config: {}
      })

      if (response.error) {
        setCreateError(response.error || response.message || 'Failed to create portal')
        return
      }

      if (response.data?.portal) {
        setShowCreateModal(false)
        setFormData({ name: '', type: 'admin', url: '' })
        setCreateError('')
        fetchPortals()
      } else {
        setCreateError('Failed to create portal')
      }
    } catch (error: any) {
      console.error('Error creating portal:', error)
      setCreateError(error.message || 'Error creating portal')
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
          <span className="text-white text-xl font-semibold">Portals</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/architecture" className="text-white hover:text-slate-300 text-sm">
            ← Architecture
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-teal-600 hover:bg-teal-600 text-white px-4 py-2 rounded-lg"
          >
            + New Portal
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portals.map((portal) => (
            <div key={portal.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{portal.name}</h3>
                  <p className="text-slate-300 text-sm capitalize">{portal.type}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${portal.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
                  {portal.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {portal.url && (
                <a href={portal.url} target="_blank" rel="noopener noreferrer" className="text-teal-300 hover:text-slate-300 text-sm">
                  {portal.url}
                </a>
              )}
            </div>
          ))}
        </div>

        {portals.length === 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center border border-white/20">
            <p className="text-white text-lg mb-4">No portals configured</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-teal-600 hover:bg-teal-600 text-white px-6 py-2 rounded-lg"
            >
              Create First Portal
            </button>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => {
            setShowCreateModal(false)
            setCreateError('')
          }}>
            <div className="bg-slate-900 rounded-xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-white mb-6">Create Portal</h2>
              
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
                  <label className="block text-white mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-800/80 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="admin" className="bg-slate-800">Admin</option>
                    <option value="client" className="bg-slate-800">Client</option>
                    <option value="patient" className="bg-slate-800">Patient</option>
                    <option value="provider" className="bg-slate-800">Provider</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white mb-2">URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
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

