'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Recording {
  id: number
  call_log_id: number
  recording_url: string
  duration_seconds: number
  file_size_bytes: number
  format: string
  created_at: string
}

export default function RecordingsPage() {
  const router = useRouter()
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchRecordings()
  }, [router])

  const fetchRecordings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/voice-ai/recordings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setRecordings(data.recordings)
      }
    } catch (error) {
      console.error('Error fetching recordings:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
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
          <span className="text-white text-xl font-semibold">Call Recordings</span>
        </div>
        <Link href="/architecture" className="text-white hover:text-slate-300 text-sm">
          ← Architecture
        </Link>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">HIPAA-Compliant Call Recordings</h2>
          <p className="text-slate-200">
            All call recordings are encrypted and stored securely. Recordings are only created with explicit consent from all parties.
          </p>
        </div>

        <div className="space-y-4">
          {recordings.map((recording) => (
            <div key={recording.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-teal-300 font-mono text-sm">Call #{recording.call_log_id}</span>
                    <span className="px-2 py-1 rounded text-xs bg-teal-600/50 text-white">
                      {recording.format.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-slate-300">Duration</div>
                      <div className="text-white font-semibold">{formatDuration(recording.duration_seconds)}</div>
                    </div>
                    <div>
                      <div className="text-slate-300">File Size</div>
                      <div className="text-white font-semibold">{formatFileSize(recording.file_size_bytes)}</div>
                    </div>
                    <div>
                      <div className="text-slate-300">Recorded</div>
                      <div className="text-white font-semibold">{new Date(recording.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
                {recording.recording_url && (
                  <a
                    href={recording.recording_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-teal-600 hover:bg-teal-600 text-white px-4 py-2 rounded-lg"
                  >
                    Play
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {recordings.length === 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center border border-white/20">
            <p className="text-white text-lg">No call recordings found</p>
          </div>
        )}
      </main>
    </div>
  )
}

