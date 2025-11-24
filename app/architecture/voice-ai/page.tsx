'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { post, get } from '@/lib/api'

interface Agent {
  id: number
  name: string
  type: string
}

interface STTConfig {
  id?: number
  provider: string
  model: string
  language_code: string
  sample_rate: number
  encoding: string
}

interface NLUConfig {
  id?: number
  provider: string
  model: string
  temperature: number
  max_tokens: number
  system_prompt: string
}

interface TTSConfig {
  id?: number
  provider: string
  voice_id: string
  voice_name: string
  language_code: string
  speaking_rate: number
  pitch: number
}

export default function VoiceAIPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null)
  const [sttConfig, setSttConfig] = useState<STTConfig>({
    provider: 'google',
    model: 'latest_long',
    language_code: 'en-US',
    sample_rate: 16000,
    encoding: 'LINEAR16'
  })
  const [nluConfig, setNluConfig] = useState<NLUConfig>({
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 1000,
    system_prompt: ''
  })

  // Ensure provider is always openai
  useEffect(() => {
    if (nluConfig.provider !== 'openai') {
      setNluConfig({ ...nluConfig, provider: 'openai' })
    }
  }, [nluConfig.provider])
  const [ttsConfig, setTtsConfig] = useState<TTSConfig>({
    provider: 'elevenlabs',
    voice_id: '21m00Tcm4TlvDq8ikWAM',
    voice_name: 'Rachel',
    language_code: 'en-US',
    speaking_rate: 1.0,
    pitch: 0.0
  })

  // Ensure provider is always elevenlabs
  useEffect(() => {
    if (ttsConfig.provider !== 'elevenlabs') {
      setTtsConfig({ ...ttsConfig, provider: 'elevenlabs' })
    }
  }, [ttsConfig.provider])
  const [activeTab, setActiveTab] = useState<'stt' | 'nlu' | 'tts' | 'test'>('stt')
  const [testMessage, setTestMessage] = useState('Hello, I need help with an appointment.')
  const [testResponse, setTestResponse] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)
  const [ttsTestText, setTtsTestText] = useState('Hello, this is a test of the text-to-speech system.')
  const [ttsTestAudio, setTtsTestAudio] = useState<string | null>(null)
  const [testingTts, setTestingTts] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [elevenLabsVoices, setElevenLabsVoices] = useState<any[]>([])
  const [loadingVoices, setLoadingVoices] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchAgents()
  }, [router])

  useEffect(() => {
    // Check for agent query parameter
    const params = new URLSearchParams(window.location.search)
    const agentParam = params.get('agent')
    if (agentParam) {
      const agentId = parseInt(agentParam)
      if (!isNaN(agentId)) {
        setSelectedAgent(agentId)
      }
    }
  }, [])

  useEffect(() => {
    if (selectedAgent) {
      fetchConfigs()
    }
  }, [selectedAgent])

  const fetchAgents = async () => {
    try {
      const response = await get('/agents')
      console.log('Agents response:', response)
      
      if (response.error) {
        console.error('API error:', response.error)
        setAgents([])
        return
      }
      
      if (response.data?.agents) {
        const agentsList = Array.isArray(response.data.agents) ? response.data.agents : []
        setAgents(agentsList)
        console.log('Loaded agents:', agentsList.length)
        
        if (agentsList.length > 0) {
          setSelectedAgent(agentsList[0].id)
        } else {
          console.warn('No agents found. Create agents in the dashboard first.')
        }
      } else {
        console.warn('No agents data in response:', response)
        setAgents([])
      }
    } catch (error: any) {
      console.error('Error fetching agents:', error)
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchConfigs = async () => {
    if (!selectedAgent) return

    try {
      // Fetch STT
      const sttRes = await get(`/voice-ai/stt/${selectedAgent}`)
      if (sttRes.data?.configurations && sttRes.data.configurations.length > 0) {
        setSttConfig(sttRes.data.configurations[0])
      }

      // Fetch NLU
      const nluRes = await get(`/voice-ai/nlu/${selectedAgent}`)
      if (nluRes.data?.configurations && nluRes.data.configurations.length > 0) {
        const config = nluRes.data.configurations[0]
        // Ensure provider is always openai
        setNluConfig({ ...config, provider: 'openai' })
      }

      // Fetch TTS
      const ttsRes = await get(`/voice-ai/tts/${selectedAgent}`)
      if (ttsRes.data?.configurations && ttsRes.data.configurations.length > 0) {
        setTtsConfig(ttsRes.data.configurations[0])
      }
    } catch (error) {
      console.error('Error fetching configs:', error)
    }
  }

  const fetchElevenLabsVoices = async () => {
    setLoadingVoices(true)
    try {
      const response = await get('/voice-ai/tts/elevenlabs/voices')
      if (response.data?.voices) {
        setElevenLabsVoices(response.data.voices)
      }
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error)
      setSaveMessage({ type: 'error', text: 'Failed to load ElevenLabs voices. Check your API key.' })
    } finally {
      setLoadingVoices(false)
    }
  }

  const saveConfig = async (type: 'stt' | 'nlu' | 'tts') => {
    if (!selectedAgent) {
      setSaveMessage({ type: 'error', text: 'Please select an agent first' })
      return
    }

    setSaving(true)
    setSaveMessage(null)

    try {
      const endpoint = `/voice-ai/${type}`
      let body: any
      
      if (type === 'stt') {
        body = { ...sttConfig, agent_id: selectedAgent }
      } else if (type === 'nlu') {
        // Always use OpenAI for NLU
        body = { ...nluConfig, agent_id: selectedAgent, provider: 'openai' }
      } else {
        // TTS config - always use ElevenLabs
        body = {
          agent_id: selectedAgent,
          provider: 'elevenlabs',
          voice_id: ttsConfig.voice_id || null,
          voice_name: ttsConfig.voice_name || null,
          language_code: ttsConfig.language_code || 'en-US',
          speaking_rate: ttsConfig.speaking_rate || 1.0,
          pitch: ttsConfig.pitch || 0.0,
          volume_gain_db: 0.0,
          config: {}
        }
      }

      console.log('Saving config:', { type, endpoint, body })

      const response = await post(endpoint, body)

      if (response.error) {
        setSaveMessage({ type: 'error', text: response.error || response.message || 'Failed to save configuration' })
        return
      }

      if (response.data?.configuration) {
        setSaveMessage({ type: 'success', text: `${type.toUpperCase()} configuration saved successfully!` })
        // Clear message after 3 seconds
        setTimeout(() => setSaveMessage(null), 3000)
        // Refresh configs to show updated values
        if (selectedAgent) {
          fetchConfigs()
        }
      } else {
        setSaveMessage({ type: 'error', text: response.message || 'Failed to save configuration' })
      }
    } catch (error: any) {
      console.error('Error saving config:', error)
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Error saving configuration'
      setSaveMessage({ type: 'error', text: errorMessage })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    // Always fetch ElevenLabs voices when agent is selected (since we only support ElevenLabs)
    if (selectedAgent && elevenLabsVoices.length === 0) {
      fetchElevenLabsVoices()
    }
  }, [selectedAgent])

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
          <span className="text-white text-xl font-semibold">Voice AI Configuration</span>
        </div>
        <Link href="/architecture" className="text-white hover:text-slate-300 text-sm">
          ← Architecture
        </Link>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Agent Selector */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20">
          <label className="block text-white font-semibold mb-3">Select Agent</label>
          <select
            value={selectedAgent || ''}
            onChange={(e) => setSelectedAgent(parseInt(e.target.value))}
            className="w-full md:w-64 px-4 py-2 rounded-lg bg-slate-800/80 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            style={{ colorScheme: 'dark' }}
          >
            <option value="" className="bg-slate-800 text-white" disabled>
              {agents.length === 0 ? 'No agents available' : 'Select an agent...'}
            </option>
            {agents.length === 0 ? (
              <option value="" className="bg-slate-800 text-white" disabled>
                Create agents in Dashboard first
              </option>
            ) : (
              agents.map(agent => (
                <option key={agent.id} value={agent.id} className="bg-slate-800 text-white">
                  {agent.name}
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['stt', 'nlu', 'tts', 'test'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setSaveMessage(null)
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-teal-600 text-white'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* STT Configuration */}
        {activeTab === 'stt' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Speech-to-Text (STT) Configuration</h2>
            
            {saveMessage && activeTab === 'stt' && (
              <div className={`mb-4 p-3 rounded-lg ${
                saveMessage.type === 'success' 
                  ? 'bg-green-500/20 border border-green-500 text-green-200' 
                  : 'bg-red-500/20 border border-red-500 text-red-200'
              }`}>
                {saveMessage.text}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Provider</label>
                <select
                  value={sttConfig.provider}
                  onChange={(e) => setSttConfig({ ...sttConfig, provider: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                >
                  <option value="google" className="bg-slate-800">Google</option>
                  <option value="aws" className="bg-slate-800">AWS</option>
                  <option value="azure" className="bg-slate-800">Azure</option>
                  <option value="deepgram" className="bg-slate-800">Deepgram</option>
                </select>
              </div>
              <div>
                <label className="block text-white mb-2">Model</label>
                <input
                  type="text"
                  value={sttConfig.model}
                  onChange={(e) => setSttConfig({ ...sttConfig, model: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Language Code</label>
                <input
                  type="text"
                  value={sttConfig.language_code}
                  onChange={(e) => setSttConfig({ ...sttConfig, language_code: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Sample Rate (Hz)</label>
                <input
                  type="number"
                  value={sttConfig.sample_rate}
                  onChange={(e) => setSttConfig({ ...sttConfig, sample_rate: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                />
              </div>
            </div>
            <button
              onClick={() => saveConfig('stt')}
              disabled={saving || !selectedAgent}
              className="mt-6 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save STT Configuration'}
            </button>
          </div>
        )}

        {/* NLU Configuration */}
        {activeTab === 'nlu' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Natural Language Understanding (NLU) Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Provider</label>
                <select
                  value="openai"
                  disabled
                  className="w-full px-4 py-2 rounded-lg bg-slate-800/80 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 opacity-75 cursor-not-allowed"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="openai" className="bg-slate-800">OpenAI</option>
                </select>
                <p className="mt-1 text-xs text-slate-400">OpenAI is the only supported NLU provider</p>
              </div>
              <div>
                <label className="block text-white mb-2">Model</label>
                <input
                  type="text"
                  value={nluConfig.model}
                  onChange={(e) => setNluConfig({ ...nluConfig, model: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Temperature (0-2)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={nluConfig.temperature}
                  onChange={(e) => setNluConfig({ ...nluConfig, temperature: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Max Tokens</label>
                <input
                  type="number"
                  value={nluConfig.max_tokens}
                  onChange={(e) => setNluConfig({ ...nluConfig, max_tokens: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white mb-2">System Prompt</label>
                <textarea
                  value={nluConfig.system_prompt}
                  onChange={(e) => setNluConfig({ ...nluConfig, system_prompt: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                />
              </div>
            </div>
            {saveMessage && activeTab === 'nlu' && (
              <div className={`mb-4 p-3 rounded-lg ${
                saveMessage.type === 'success' 
                  ? 'bg-green-500/20 border border-green-500 text-green-200' 
                  : 'bg-red-500/20 border border-red-500 text-red-200'
              }`}>
                {saveMessage.text}
              </div>
            )}
            <button
              onClick={() => saveConfig('nlu')}
              disabled={saving || !selectedAgent}
              className="mt-6 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save NLU Configuration'}
            </button>
          </div>
        )}

        {/* TTS Configuration */}
        {activeTab === 'tts' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Text-to-Speech (TTS) Configuration</h2>
            
            {saveMessage && (
              <div className={`mb-4 p-3 rounded-lg ${
                saveMessage.type === 'success' 
                  ? 'bg-green-500/20 border border-green-500 text-green-200' 
                  : 'bg-red-500/20 border border-red-500 text-red-200'
              }`}>
                {saveMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Provider</label>
                <select
                  value="elevenlabs"
                  disabled
                  className="w-full px-4 py-2 rounded-lg bg-slate-800/80 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 opacity-75 cursor-not-allowed"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="elevenlabs" className="bg-slate-800">ElevenLabs</option>
                </select>
                <p className="mt-1 text-xs text-slate-400">ElevenLabs is the only supported TTS provider</p>
              </div>
              
              <div>
                <label className="block text-white mb-2">ElevenLabs Voice</label>
                  <div className="flex gap-2">
                    <select
                      value={ttsConfig.voice_id}
                      onChange={(e) => {
                        const selectedVoice = elevenLabsVoices.find(v => v.voice_id === e.target.value)
                        setTtsConfig({ 
                          ...ttsConfig, 
                          voice_id: e.target.value,
                          voice_name: selectedVoice?.name || ttsConfig.voice_name
                        })
                      }}
                      className="flex-1 px-4 py-2 rounded-lg bg-slate-800/80 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      style={{ colorScheme: 'dark' }}
                      disabled={loadingVoices}
                    >
                      {loadingVoices ? (
                        <option className="bg-slate-800">Loading voices...</option>
                      ) : (
                        elevenLabsVoices.map(voice => (
                          <option key={voice.voice_id} value={voice.voice_id} className="bg-slate-800">
                            {voice.name}
                          </option>
                        ))
                      )}
                    </select>
                    <button
                      onClick={fetchElevenLabsVoices}
                      disabled={loadingVoices}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg disabled:opacity-50"
                    >
                      {loadingVoices ? '...' : '↻'}
                    </button>
                  </div>
                </div>
              
              <div>
                <label className="block text-white mb-2">Voice ID</label>
                <input
                  type="text"
                  value={ttsConfig.voice_id}
                  onChange={(e) => setTtsConfig({ ...ttsConfig, voice_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  placeholder="Voice ID"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2">Voice Name</label>
                <input
                  type="text"
                  value={ttsConfig.voice_name}
                  onChange={(e) => setTtsConfig({ ...ttsConfig, voice_name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  placeholder="Voice Name"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2">Language Code</label>
                <input
                  type="text"
                  value={ttsConfig.language_code}
                  onChange={(e) => setTtsConfig({ ...ttsConfig, language_code: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  placeholder="en-US"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2">Speaking Rate (0.25-4.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.25"
                  max="4.0"
                  value={ttsConfig.speaking_rate}
                  onChange={(e) => setTtsConfig({ ...ttsConfig, speaking_rate: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2">Pitch (-20 to 20)</label>
                <input
                  type="number"
                  step="0.1"
                  min="-20"
                  max="20"
                  value={ttsConfig.pitch}
                  onChange={(e) => setTtsConfig({ ...ttsConfig, pitch: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                />
              </div>
            </div>
            
            {!selectedAgent && (
              <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg text-yellow-200 text-sm">
                Please select an agent first to save TTS configuration
              </div>
            )}
            <button
              onClick={() => saveConfig('tts')}
              disabled={saving || !selectedAgent}
              className={`mt-6 px-6 py-2 bg-teal-600 text-white rounded-lg transition-colors ${
                saving || !selectedAgent
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-teal-700 cursor-pointer'
              }`}
            >
              {saving ? 'Saving...' : 'Save TTS Configuration'}
            </button>
          </div>
        )}

        {/* Test Agent */}
        {activeTab === 'test' && (
          <div className="space-y-6">
            {/* Test NLU/Agent Response */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Test Agent Response (NLU)</h2>
              
              {!selectedAgent && (
                <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg text-yellow-200 text-sm">
                  Please select an agent first to test
                </div>
              )}

              <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500 rounded-lg text-blue-200 text-sm">
                <div className="font-semibold mb-1">💡 Testing Tips:</div>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Save NLU configuration first for best results</li>
                  <li>If you don't have API keys, set <code className="bg-blue-500/30 px-1 rounded">MOCK_AI_RESPONSES=true</code> in backend/.env</li>
                  <li>For production, configure OPENAI_API_KEY in backend/.env</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white mb-2">Test Message</label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                    placeholder="Enter a test message..."
                  />
                </div>

                <button
                  onClick={async () => {
                    if (!selectedAgent) return
                    setTesting(true)
                    setTestError(null)
                    setTestResponse(null)

                    try {
                      const response = await post(`/agents/${selectedAgent}/test`, { message: testMessage })
                      
                      if (response.error) {
                        let errorMsg = response.error
                        if (response.data?.error) {
                          errorMsg = response.data.error
                        }
                        if (response.data?.suggestion) {
                          errorMsg += `\n\nSuggestion: ${response.data.suggestion}`
                        }
                        setTestError(errorMsg)
                      } else {
                        setTestResponse(response.data)
                        setTestError(null)
                      }
                    } catch (error: any) {
                      const errorMsg = error.message || error.response?.data?.error || 'Error testing agent'
                      setTestError(errorMsg)
                    } finally {
                      setTesting(false)
                    }
                  }}
                  disabled={testing || !selectedAgent}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testing ? 'Testing...' : 'Test Agent Response'}
                </button>

                {testError && (
                  <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg">
                    <div className="text-red-200 font-semibold mb-2">Error Testing Agent</div>
                    <div className="text-red-300 text-sm mb-2">{testError}</div>
                    <div className="text-red-400 text-xs mt-3 p-2 bg-red-500/10 rounded border border-red-500/30">
                      <div className="font-semibold mb-1">Troubleshooting:</div>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Make sure you have saved NLU configuration for this agent</li>
                        <li>Check if OPENAI_API_KEY is set in backend/.env</li>
                        <li>For testing without API keys, set MOCK_AI_RESPONSES=true in backend/.env</li>
                        <li>Verify your API keys are valid and have sufficient credits</li>
                        <li>Check backend server logs for detailed error information</li>
                      </ul>
                    </div>
                  </div>
                )}

                {testResponse && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-white/20">
                      <div className="text-sm text-slate-300 mb-2">Your Message:</div>
                      <div className="text-white">{testResponse.userMessage}</div>
                    </div>
                    <div className="p-4 bg-teal-500/20 rounded-lg border border-teal-500/50">
                      <div className="text-sm text-teal-300 mb-2">Agent Response:</div>
                      <div className="text-white">{testResponse.aiResponse}</div>
                    </div>
                    {testResponse.usage && (
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-white/20 text-sm text-slate-300">
                        <div>Model: {testResponse.model}</div>
                        <div>Provider: {testResponse.provider}</div>
                        {testResponse.usage.tokens && (
                          <div>Tokens used: {testResponse.usage.tokens}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Test TTS */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Test Text-to-Speech (TTS)</h2>
              
              {!selectedAgent && (
                <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg text-yellow-200 text-sm">
                  Please select an agent first to test TTS
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-white mb-2">Text to Synthesize</label>
                  <textarea
                    value={ttsTestText}
                    onChange={(e) => setTtsTestText(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                    placeholder="Enter text to convert to speech..."
                  />
                </div>

                <button
                  onClick={async () => {
                    if (!selectedAgent) return
                    setTestingTts(true)
                    setTtsTestAudio(null)

                    try {
                      const response = await post('/voice-ai/tts/test', {
                        text: ttsTestText,
                        provider: ttsConfig.provider,
                        voice_id: ttsConfig.voice_id,
                        agent_id: selectedAgent
                      })
                      
                      if (response.error) {
                        setTestError(response.error || 'Failed to test TTS')
                      } else if (response.data?.audio) {
                        setTtsTestAudio(response.data.audio)
                        setTestError(null)
                      }
                    } catch (error: any) {
                      setTestError(error.message || 'Error testing TTS')
                    } finally {
                      setTestingTts(false)
                    }
                  }}
                  disabled={testingTts || !selectedAgent}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testingTts ? 'Synthesizing...' : 'Test TTS'}
                </button>

                {ttsTestAudio && (
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-white/20">
                    <div className="text-sm text-slate-300 mb-2">Audio Output:</div>
                    <audio controls className="w-full">
                      <source src={`data:audio/mpeg;base64,${ttsTestAudio}`} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}


