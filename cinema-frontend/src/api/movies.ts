import { getCsrfHeaders } from './auth'
import type { GenreResponse } from './genres'
import { apiHttp } from './http'

type ApiResponse<T> = {
  data: T
}

export type MovieSummary = {
  id: number
  title: string
  duration: number
  releaseDate: string | null
  status: string
}

export type MovieDetail = MovieSummary & {
  description: string | null
  posterUrl: string | null
  trailerUrl: string | null
  genres: GenreResponse[]
}

export type MovieRequest = {
  title: string
  description: string | null
  duration: number
  releaseDate: string | null
  genreIds: number[]
}

export async function listMovies(signal: AbortSignal): Promise<MovieSummary[]> {
  const response = await apiHttp.get<ApiResponse<MovieSummary[]>>(
    '/admin/movies',
    { signal },
  )

  return response.data.data
}

export async function getMovie(
  id: number,
  signal: AbortSignal,
): Promise<MovieDetail> {
  const response = await apiHttp.get<ApiResponse<MovieDetail>>(
    `/admin/movies/${id}`,
    { signal },
  )

  return response.data.data
}

export async function createMovie(movie: MovieRequest): Promise<MovieSummary> {
  const headers = await getCsrfHeaders()

  const response = await apiHttp.post<ApiResponse<MovieSummary>>(
    '/admin/movies',
    movie,
    { headers },
  )

  return response.data.data
}

export async function updateMovie(
  id: number,
  movie: MovieRequest,
): Promise<MovieDetail> {
  const headers = await getCsrfHeaders()

  const response = await apiHttp.put<ApiResponse<MovieDetail>>(
    `/admin/movies/${id}`,
    movie,
    { headers },
  )

  return response.data.data
}

export async function deleteMovie(id: number): Promise<void> {
  const headers = await getCsrfHeaders()
  const response = await apiHttp.delete(`/admin/movies/${id}`, { headers })

  if (response.status !== 204) {
    throw new Error('The server did not confirm the deletion.')
  }
}

export async function uploadMoviePoster(
  id: number,
  file: File,
): Promise<MovieDetail> {
  const headers = await getCsrfHeaders()
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiHttp.post<ApiResponse<MovieDetail>>(
    `/admin/movies/${id}/poster`,
    formData,
    { headers },
  )

  return response.data.data
}