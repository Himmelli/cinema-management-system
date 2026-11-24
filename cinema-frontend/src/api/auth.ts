import { isAxiosError } from 'axios'
import { apiHttp, authHttp, setAccessToken } from './http'

type ApiResponse<T> = {
  data: T
}

type LoginRequest = {
  email: string
  password: string
}

type LoginResponse = {
  accessToken: string
  tokenType: string
  expiresAt: string
}

type CsrfResponse = {
  headerName: string
  token: string
}

export type UserResponse = {
  id: number
  fullName: string
  email: string
  role: string
}

let restoreInFlight: Promise<UserResponse | null> | null = null

export async function getCsrfHeaders() {
  const response = await authHttp.get<ApiResponse<CsrfResponse>>('/auth/csrf')
  const csrf = response.data.data

  if (!csrf?.headerName || !csrf.token) {
    throw new Error('The server did not provide a CSRF token.')
  }

  return { [csrf.headerName]: csrf.token }
}

async function loadAccount(
  tokenResponse: LoginResponse | undefined,
): Promise<UserResponse> {
  if (!tokenResponse?.accessToken) {
    setAccessToken(null)
    throw new Error('The server did not provide an access token.')
  }

  setAccessToken(tokenResponse.accessToken)

  try {
    const profile = await apiHttp.get<ApiResponse<UserResponse>>('/auth/me')

    if (!profile.data.data) {
      throw new Error('The account response did not include a user.')
    }

    return profile.data.data
  } catch (error) {
    setAccessToken(null)
    throw error
  }
}

export async function signIn(credentials: LoginRequest): Promise<UserResponse> {
  const response = await authHttp.post<ApiResponse<LoginResponse>>(
    '/auth/login',
    credentials,
  )

  return loadAccount(response.data.data)
}

async function refreshSession(): Promise<UserResponse | null> {
  const headers = await getCsrfHeaders()

  try {
    const response = await authHttp.post<ApiResponse<LoginResponse>>(
      '/auth/refresh',
      undefined,
      { headers },
    )

    return await loadAccount(response.data.data)
  } catch (error) {
    if (
      isAxiosError(error) &&
      error.config?.url === '/auth/refresh' &&
      error.response?.status === 401
    ) {
      setAccessToken(null)
      return null
    }

    throw error
  }
}

export function restoreSession(): Promise<UserResponse | null> {
  if (restoreInFlight) {
    return restoreInFlight
  }

  const refresh = navigator.locks
    ? navigator.locks.request('cinespot-session-refresh', refreshSession)
    : refreshSession()

  restoreInFlight = refresh.finally(() => {
    restoreInFlight = null
  })

  return restoreInFlight
}

export async function signOut(): Promise<void> {
  const headers = await getCsrfHeaders()
  const response = await authHttp.post('/auth/logout', undefined, { headers })

  if (response.status !== 204) {
    throw new Error('The server did not confirm sign-out.')
  }

  setAccessToken(null)
}