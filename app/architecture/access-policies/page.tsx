'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { post, get } from '@/lib/api'
import { sanitizeInput } from '@/lib/security'

interface AccessPolicy {
  id: number
  name: string
  resource_type: string
  permissions: string[]
  role: string
  is_active: boolean
}

export default function AccessPoliciesPage() {
  const router = useRouter()
  const [policies, setPolicies] = useState<AccessPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [formData, setFormData] = useState({
    policy_name: '',
    resource_type: 'conversation',
    permissions: [] as string[],
    role: 'user'
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchPolicies()
  }, [router])

  const fetchPolicies = async () => {
    try {
      const response = await get('/security/access-policies')
      if (response.data?.policies) {
        setPolicies(response.data.policies)
      }
    } catch (error) {
      console.error('Error fetching access policies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreateLoading(true)

    if (!formData.policy_name) {
      setCreateError('Policy name is required')
      setCreateLoading(false)
      return
    }

    if (formData.permissions.length === 0) {
      setCreateError('At least one permission must be selected')
      setCreateLoading(false)
      return
    }

    try {
      const response = await post('/security/access-policies', {
        name: sanitizeInput(formData.policy_name),
        resource_type: formData.resource_type,
        role: formData.role,
        permissions: formData.permissions,
        resource_id: null,
        conditions: {}
      })

      if (response.error) {
        setCreateError(response.error || response.message || 'Failed to create access policy')
        return
      }

      if (response.data?.policy) {
        setShowCreateModal(false)
        setFormData({ policy_name: '', resource_type: 'conversation', permissions: [], role: 'user' })
        setCreateError('')
        fetchPolicies()
      } else {
        setCreateError('Failed to create access policy')
      }
    } catch (error: any) {
      console.error('Error creating access policy:', error)
      setCreateError(error.message || 'Error creating access policy')
    } finally {
      setCreateLoading(false)
    }
  }

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
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
          <span className="text-white text-xl font-semibold">Access Policies</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/architecture" className="text-white hover:text-slate-300 text-sm">
            ← Architecture
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-teal-600 hover:bg-teal-600 text-white px-4 py-2 rounded-lg"
          >
            + New Policy
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Role-Based Access Control (RBAC)</h2>
          <p className="text-slate-200">
            Define access policies to control what resources users can access based on their roles. All policies enforce HIPAA compliance.
          </p>
        </div>

        <div className="space-y-4">
          {policies.map((policy) => (
            <div key={policy.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{policy.name}</h3>
                  <p className="text-slate-300 text-sm capitalize">{policy.resource_type} • {policy.role}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${policy.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
                  {policy.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {policy.permissions && policy.permissions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {policy.permissions.map((perm, idx) => (
                    <span key={idx} className="px-2 py-1 bg-teal-600/50 text-white text-xs rounded">
                      {perm}
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
              <h2 className="text-2xl font-bold text-white mb-6">Create Access Policy</h2>
              
              {createError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-white mb-2">Policy Name</label>
                  <input
                    type="text"
                    required
                    value={formData.policy_name}
                    onChange={(e) => setFormData({ ...formData, policy_name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Resource Type</label>
                  <select
                    value={formData.resource_type}
                    onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  >
                    <option value="conversation" className="bg-slate-800">Conversation</option>
                    <option value="appointment" className="bg-slate-800">Appointment</option>
                    <option value="patient" className="bg-slate-800">Patient</option>
                    <option value="recording" className="bg-slate-800">Recording</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  >
                    <option value="user" className="bg-slate-800">User</option>
                    <option value="admin" className="bg-slate-800">Admin</option>
                    <option value="provider" className="bg-slate-800">Provider</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white mb-2">Permissions</label>
                  <div className="space-y-2">
                    {['read', 'write', 'delete', 'update'].map(perm => (
                      <label key={perm} className="flex items-center space-x-2 text-white">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(perm)}
                          onChange={() => togglePermission(perm)}
                          className="w-4 h-4"
                        />
                        <span className="capitalize">{perm}</span>
                      </label>
                    ))}
                  </div>
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

