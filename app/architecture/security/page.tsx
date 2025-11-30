'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { post, get } from '@/lib/api'
import { sanitizeInput } from '@/lib/security'
import { isAuthenticated } from '@/lib/auth'

interface EncryptionKey {
  id: number
  key_name: string
  key_type: string
  algorithm: string
  created_at: string
  expires_at: string
  is_active: boolean
}

export default function SecurityPage() {
  const router = useRouter()
  const [keys, setKeys] = useState<EncryptionKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [formData, setFormData] = useState({
    key_name: '',
    key_type: 'aes',
    algorithm: 'AES-256',
    expires_at: ''
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchKeys()
  }, [router])

  const fetchKeys = async () => {
    try {
      const response = await get('/security/encryption-keys')
      if (response.data?.keys) {
        setKeys(response.data.keys)
      }
    } catch (error) {
      console.error('Error fetching encryption keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreateLoading(true)

    if (!formData.key_name) {
      setCreateError('Key name is required')
      setCreateLoading(false)
      return
    }

    try {
      const response = await post('/security/encryption-keys', {
        key_name: sanitizeInput(formData.key_name),
        key_type: formData.key_type,
        algorithm: formData.algorithm,
        expires_at: formData.expires_at || null
      })

      if (response.error) {
        setCreateError(response.error || response.message || 'Failed to create encryption key')
        return
      }

      if (response.data?.key) {
        setShowCreateModal(false)
        setFormData({ key_name: '', key_type: 'aes', algorithm: 'AES-256', expires_at: '' })
        setCreateError('')
        fetchKeys()
      } else {
        setCreateError('Failed to create encryption key')
      }
    } catch (error: any) {
      console.error('Error creating encryption key:', error)
      setCreateError(error.message || 'Error creating encryption key')
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
          <span className="text-white text-xl font-semibold">Encryption Keys</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/architecture" className="text-white hover:text-slate-300 text-sm">
            ← Architecture
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-teal-600 hover:bg-teal-600 text-white px-4 py-2 rounded-lg"
          >
            + New Key
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">HIPAA-Compliant Encryption</h2>
          <p className="text-slate-200">
            All encryption keys are managed securely. AES-256 encryption is used for data at rest, and TLS 1.2/1.3 for data in transit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {keys.map((key) => (
            <div key={key.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{key.key_name}</h3>
                  <p className="text-slate-300 text-sm">{key.algorithm}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${key.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
                  {key.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-300">Type: </span>
                  <span className="text-white uppercase">{key.key_type}</span>
                </div>
                <div>
                  <span className="text-slate-300">Created: </span>
                  <span className="text-white">{new Date(key.created_at).toLocaleDateString()}</span>
                </div>
                {key.expires_at && (
                  <div>
                    <span className="text-slate-300">Expires: </span>
                    <span className="text-white">{new Date(key.expires_at).toLocaleDateString()}</span>
                  </div>
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
              <h2 className="text-2xl font-bold text-white mb-6">Create Encryption Key</h2>
              
              {createError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-white mb-2">Key Name</label>
                  <input
                    type="text"
                    required
                    value={formData.key_name}
                    onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Algorithm</label>
                  <select
                    value={formData.algorithm}
                    onChange={(e) => setFormData({ ...formData, algorithm: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  >
                    <option value="AES-256" className="bg-slate-800">AES-256</option>
                    <option value="AES-192" className="bg-slate-800">AES-192</option>
                    <option value="AES-128" className="bg-slate-800">AES-128</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white mb-2">Expires At (Optional)</label>
                  <input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
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

