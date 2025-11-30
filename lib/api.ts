/**
 * Secure API Client
 * Handles all API requests with security best practices
 */

import { tokenManager, sessionManager, clearAuth, getAuthHeader } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || (
  typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://ehealthmedai-backend.onrender.com/api'
    : 'http://localhost:5000/api'
)

interface RequestOptions extends RequestInit {
  requireAuth?: boolean
  skipAuth?: boolean
}

interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

/**
 * Generate CSRF token
 */
const generateCSRFToken = (): string => {
  if (typeof window === 'undefined') return ''
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Get or create CSRF token
 */
const getCSRFToken = (): string => {
  if (typeof window === 'undefined') return ''
  
  let token = sessionStorage.getItem('csrf_token')
  if (!token) {
    token = generateCSRFToken()
    sessionStorage.setItem('csrf_token', token)
  }
  return token
}

/**
 * Secure API request
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    requireAuth = true,
    skipAuth = false,
    headers = {},
    body,
    ...restOptions
  } = options

  // Check authentication
  if (requireAuth && !skipAuth) {
    const token = tokenManager.getToken()
    if (!token || tokenManager.isTokenExpired()) {
      // Return error instead of redirecting - let pages handle it
      return { error: 'Authentication required' }
    }
  }

  // Build headers
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-Token': getCSRFToken(),
  }

  // Add authorization header to base headers object first
  if (requireAuth && !skipAuth) {
    const authHeader = getAuthHeader()
    if (authHeader) {
      baseHeaders['Authorization'] = authHeader
    }
  }

  // Add custom headers
  if (headers) {
    Object.assign(baseHeaders, headers)
  }

  const requestHeaders = new Headers(baseHeaders)

  // Sanitize body
  let requestBody: string | undefined
  if (body) {
    if (typeof body === 'string') {
      requestBody = body
    } else {
      requestBody = JSON.stringify(body)
    }
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...restOptions,
      headers: requestHeaders,
      body: requestBody,
      credentials: 'include' // Include cookies for CSRF protection
    })

    // Handle token expiration
    if (response.status === 401) {
      clearAuth()
      return { error: 'Session expired. Please login again.' }
    }

    // Parse response
    const contentType = response.headers.get('content-type')
    let data: any

    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      return {
        error: data.message || data.error || `Request failed: ${response.statusText}`,
        data: data
      }
    }

    return { data }
  } catch (error: any) {
    console.error('API request error:', error)
    return {
      error: error.message || 'Network error. Please check your connection.'
    }
  }
}

/**
 * Refresh authentication token
 */
async function refreshToken(): Promise<boolean> {
  const refreshToken = tokenManager.getRefreshToken()
  if (!refreshToken) return false

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`
      },
      credentials: 'include'
    })

    if (response.ok) {
      const data = await response.json()
      if (data.token) {
        tokenManager.setToken(data.token, data.expiresIn)
        if (data.user) {
          sessionManager.createSession(data.user, data.expiresIn * 1000)
        }
        return true
      }
    }
  } catch (error) {
    console.error('Token refresh error:', error)
  }

  return false
}

/**
 * GET request
 */
export async function get<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' })
}

/**
 * POST request
 */
export async function post<T = any>(
  endpoint: string,
  body?: any,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'POST', body })
}

/**
 * PUT request
 */
export async function put<T = any>(
  endpoint: string,
  body?: any,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'PUT', body })
}

/**
 * PATCH request
 */
export async function patch<T = any>(
  endpoint: string,
  body?: any,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'PATCH', body })
}

/**
 * DELETE request
 */
export async function del<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' })
}

/**
 * Upload file securely
 */
export async function uploadFile<T = any>(
  endpoint: string,
  file: File,
  additionalData?: Record<string, any>
): Promise<ApiResponse<T>> {
  const formData = new FormData()
  formData.append('file', file)
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value))
      }
    })
  }

  const authHeader = getAuthHeader()
  const headers: Record<string, string> = {
    'X-CSRF-Token': getCSRFToken(),
    'X-Requested-With': 'XMLHttpRequest'
  }

  if (authHeader) {
    headers['Authorization'] = authHeader
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include'
    })

    if (response.status === 401) {
      clearAuth()
      return { error: 'Session expired. Please login again.' }
    }

    const data = await response.json()

    if (!response.ok) {
      return {
        error: data.message || data.error || `Upload failed: ${response.statusText}`,
        data: data
      }
    }

    return { data }
  } catch (error: any) {
    console.error('File upload error:', error)
    return {
      error: error.message || 'Upload failed. Please try again.'
    }
  }
}
