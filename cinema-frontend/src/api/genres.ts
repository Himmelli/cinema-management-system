import { getCsrfHeaders } from './auth'
import { apiHttp } from './http'

type ApiResponse<T> = {
  data: T
}

export type GenreResponse = {
  id: number
  name: string
}

export async function listGenres(signal: AbortSignal): Promise<GenreResponse[]> {
  const response = await apiHttp.get<ApiResponse<GenreResponse[]>>('/genres', {
    signal,
  })
  return response.data.data
}

export async function createGenre(name: string): Promise<GenreResponse> {
  const headers = await getCsrfHeaders()

  const response = await apiHttp.post<ApiResponse<GenreResponse>>(
    '/genres',
    { name },
    { headers },
  )

  return response.data.data
}

export async function updateGenre(
  id: number,
  name: string,
): Promise<GenreResponse> {
  const headers = await getCsrfHeaders()

  const response = await apiHttp.put<ApiResponse<GenreResponse>>(
    `/genres/${id}`,
    { name },
    { headers },
  )

  return response.data.data
}

export async function deleteGenre(id: number): Promise<void> {
  const headers = await getCsrfHeaders()
  const response = await apiHttp.delete(`/genres/${id}`, { headers })

  if (response.status !== 204) {
    throw new Error('The server did not confirm the deletion.')
  }
}