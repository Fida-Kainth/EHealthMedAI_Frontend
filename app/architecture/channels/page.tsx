'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { post, get, del } from '@/lib/api'

interface Channel {
  id: number
  agent_id: number
  channel_type: string
  is_active: boolean
}

interface Agent {
  id: number
  name: string
  type: string
}

export default function ChannelsPage() {
  const router = useRouter()
  const [channels, setChannels] = useState<Channel[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    agent_id: '',
    channel_type: 'phone'
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchChannels()
    fetchAgents()
  }, [router])

  const fetchChannels = async () => {
    try {
      const response = await get('/presentation/channels')
      if (response.data?.channels) {
        setChannels(response.data.channels)
      }
    } catch (error) {
      console.error('Error fetching channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAgents = async () => {
    try {
      const response = await get('/agents')
      if (response.data?.agents) {
        setAgents(response.data.agents)
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreateLoading(true)

    if (!formData.agent_id) {
      setCreateError('Agent is required')
      setCreateLoading(false)
      return
    }

    try {
      const response = await post('/presentation/channels', {
        agent_id: parseInt(formData.agent_id),
        channel_type: formData.channel_type,
        channel_config: {}
      })

      if (response.error) {
        setCreateError(response.error || response.message || 'Failed to create voice channel')
        return
      }

      if (response.data?.channel) {
        setShowCreateModal(false)
        setFormData({ agent_id: '', channel_type: 'phone' })
        setCreateError('')
        fetchChannels()
      } else {
        setCreateError('Failed to create voice channel')
      }
    } catch (error: any) {
      console.error('Error creating channel:', error)
      setCreateError(error.message || 'Error creating voice channel')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDelete = async (channelId: number, channelType: string) => {
    if (!confirm(`Are you sure you want to delete this ${channelType.replace('_', ' ')} channel? This action cannot be undone.`)) {
      return
    }

    setDeleteLoading(channelId)

    try {
      const response = await del(`/presentation/channels/${channelId}`)

      if (response.error) {
        alert(response.error)
      } else {
        fetchChannels() // Refresh the list
      }
    } catch (error: any) {
      alert(error.message || 'Error deleting channel')
    } finally {
      setDeleteLoading(null)
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
          <span className="text-white text-xl font-semibold">Voice Channels</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/architecture" className="text-white hover:text-slate-300 text-sm">
            ← Architecture
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-teal-600 hover:bg-teal-600 text-white px-4 py-2 rounded-lg"
          >
            + New Channel
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((channel) => {
            const agent = agents.find(a => a.id === channel.agent_id)
            return (
              <div key={channel.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg capitalize">{channel.channel_type.replace('_', ' ')}</h3>
                    {agent && <p className="text-slate-300 text-sm">{agent.name}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${channel.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
                      {channel.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => handleDelete(channel.id, channel.channel_type)}
                      disabled={deleteLoading === channel.id}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete channel"
                    >
                      {deleteLoading === channel.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="text-slate-400 text-sm">
                  <p>Channel ID: {channel.id}</p>
                  {agent && <p>Agent Type: {agent.type}</p>}
                </div>
              </div>
            )
          })}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => {
            setShowCreateModal(false)
            setCreateError('')
          }}>
            <div className="bg-slate-900 rounded-xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-white mb-6">Create Voice Channel</h2>
              
              {createError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-white mb-2">Agent</label>
                  <select
                    required
                    value={formData.agent_id}
                    onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-800/80 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="" className="bg-slate-800 text-white" disabled>
                      {agents.length === 0 ? 'No agents available' : 'Select Agent'}
                    </option>
                    {agents.length === 0 ? (
                      <option value="" className="bg-slate-800 text-white" disabled>
                        Create agents in Dashboard first
                      </option>
                    ) : (
                      agents.map(agent => (
                        <option key={agent.id} value={agent.id} className="bg-slate-800 text-white">
                          {agent.name} ({agent.type})
                        </option>
                      ))
                    )}
                  </select>
                  {agents.length === 0 && (
                    <p className="mt-2 text-yellow-300 text-sm">
                      No agents found. Go to <Link href="/dashboard" className="underline hover:text-teal-400">Dashboard</Link> to create agents first.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-white mb-2">Channel Type</label>
                  <select
                    value={formData.channel_type}
                    onChange={(e) => setFormData({ ...formData, channel_type: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-800/80 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="phone" className="bg-slate-800">Phone</option>
                    <option value="sms" className="bg-slate-800">SMS</option>
                    <option value="whatsapp" className="bg-slate-800">WhatsApp</option>
                    <option value="web_chat" className="bg-slate-800">Web Chat</option>
                    <option value="mobile_app" className="bg-slate-800">Mobile App</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <button 
                    type="submit" 
                    disabled={createLoading || !formData.agent_id}
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

