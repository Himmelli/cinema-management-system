import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { listGenres } from '../../api/genres'
import type { GenreResponse } from '../../api/genres'
import {
  createMovie,
  getMovie,
  updateMovie,
  uploadMoviePoster,
} from '../../api/movies'
import type { MovieDetail, MovieRequest, MovieSummary } from '../../api/movies'
import MoviePosterPreview from './MoviePosterPreview'

type MovieFormProps = {
  movieId: number | null
  onSaved: (movie: MovieSummary) => void
  onCancel: () => void
  disabled?: boolean
}

type FormDataSource = {
  genres: GenreResponse[]
  movie: MovieDetail | null
}

const MAX_POSTER_BYTES = 2 * 1024 * 1024

function getRequestError(error: unknown, fallback: string): string {
  if (isAxiosError<{ detail?: string }>(error)) {
    const status = error.response?.status

    if (status === 400 || status === 404) {
      return error.response?.data?.detail || fallback
    }

    if (status === 401) {
      return 'Your session has expired. Reload the page to continue.'
    }

    if (status === 403) {
      return 'The request was denied. Reload the page and try again.'
    }
  }

  return fallback
}

export default function MovieForm({
  movieId,
  onSaved,
  onCancel,
  disabled = false,
}: MovieFormProps) {
  const [source, setSource] = useState<FormDataSource | null>(null)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPoster, setIsUploadingPoster] = useState(false)
  const [posterError, setPosterError] = useState('')
  const [posterMessage, setPosterMessage] = useState('')

  const isEditing = movieId !== null
  const formDisabled = disabled || isSaving || isUploadingPoster
  const movie = source?.movie
  const selectedGenreIds = new Set(movie?.genres.map((genre) => genre.id))
  const actionLabel = isEditing ? 'Save changes' : 'Add movie'

  useEffect(() => {
    const controller = new AbortController()

    void Promise.all([
      listGenres(controller.signal),
      movieId === null
        ? Promise.resolve(null)
        : getMovie(movieId, controller.signal),
    ])
      .then(([genres, loadedMovie]) => {
        if (!controller.signal.aborted) {
          setSource({ genres, movie: loadedMovie })
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(
            getRequestError(error, 'Unable to load the movie form.'),
          )
        }
      })

    return () => controller.abort()
  }, [movieId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (formDisabled || source === null) {
      return
    }

    const form = event.currentTarget
    const values = new FormData(form)
    const title = String(values.get('title') ?? '').trim()
    const description = String(values.get('description') ?? '').trim()
    const releaseDate = String(values.get('releaseDate') ?? '')
    const genreIds = values.getAll('genreIds').map(Number)

    setFormError('')

    if (!title) {
      setFormError('Movie title is required.')
      return
    }

    if (genreIds.length === 0) {
      setFormError('Select at least one genre.')
      return
    }

    const request: MovieRequest = {
      title,
      description: description || null,
      duration: Number(values.get('duration')),
      releaseDate: releaseDate || null,
      genreIds,
    }

    setIsSaving(true)

    try {
      const savedMovie = movieId === null
        ? await createMovie(request)
        : await updateMovie(movieId, request)

      if (movieId === null) {
        form.reset()
      }

      onSaved(savedMovie)
    } catch (error) {
      setFormError(
        getRequestError(error, 'Unable to save the movie. Please try again.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePosterUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (formDisabled || movieId === null) {
      return
    }

    const form = event.currentTarget
    const file = new FormData(form).get('file')

    setPosterError('')
    setPosterMessage('')

    if (!(file instanceof File) || file.size === 0) {
      setPosterError('Select a poster image.')
      return
    }

    if (file.size > MAX_POSTER_BYTES) {
      setPosterError('The poster must be no larger than 2 MB.')
      return
    }

    setIsUploadingPoster(true)

    try {
      const updated = await uploadMoviePoster(movieId, file)

      setSource((current) => {
        if (!current?.movie || current.movie.id !== updated.id) {
          return current
        }

        return {
          ...current,
          movie: { ...current.movie, posterUrl: updated.posterUrl },
        }
      })

      form.reset()
      setPosterMessage('Poster uploaded.')
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 413) {
        setPosterError('The poster must be no larger than 2 MB.')
      } else {
        setPosterError(
          getRequestError(error, 'Unable to upload the poster. Please try again.'),
        )
      }
    } finally {
      setIsUploadingPoster(false)
    }
  }

  return (
    <section>
      <h2>{isEditing ? 'Edit movie' : 'Add movie'}</h2>

      {loadError && <p role="alert">{loadError}</p>}
      {!loadError && source === null && <p role="status">Loading movie form…</p>}

      {movie && (
        <section aria-labelledby="current-poster-heading">
          <h3 id="current-poster-heading">Current poster</h3>

          {movie.posterUrl ? (
            <MoviePosterPreview
              key={movie.posterUrl}
              posterUrl={movie.posterUrl}
              title={movie.title}
            />
          ) : (
            <p>No poster uploaded yet.</p>
          )}

          <form onSubmit={handlePosterUpload}>
            <label htmlFor="movie-poster-file">Poster image</label>
            <input
              id="movie-poster-file"
              name="file"
              type="file"
              accept="image/jpeg,image/png"
              disabled={formDisabled}
            />
            <button type="submit" disabled={formDisabled}>
              {isUploadingPoster ? 'Uploading…' : 'Upload poster'}
            </button>
          </form>

          {posterError && <p role="alert">{posterError}</p>}
          {posterMessage && <p role="status">{posterMessage}</p>}
        </section>
      )}

      {source?.genres.length === 0 && (
        <p>Add a genre before saving a movie.</p>
      )}

      {source !== null && source.genres.length > 0 && (
        <form onSubmit={handleSubmit}>
          <fieldset disabled={formDisabled}>
            <legend>Movie details</legend>

            <div>
              <label htmlFor="movie-title">Title</label>
              <input
                id="movie-title"
                name="title"
                defaultValue={movie?.title ?? ''}
                maxLength={255}
                required
              />
            </div>

            <div>
              <label htmlFor="movie-description">Description</label>
              <textarea
                id="movie-description"
                name="description"
                defaultValue={movie?.description ?? ''}
                maxLength={255}
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="movie-duration">Duration (minutes)</label>
              <input
                id="movie-duration"
                name="duration"
                type="number"
                defaultValue={movie?.duration ?? ''}
                min={1}
                max={2147483647}
                step={1}
                required
              />
            </div>

            <div>
              <label htmlFor="movie-release-date">Release date</label>
              <input
                id="movie-release-date"
                name="releaseDate"
                type="date"
                defaultValue={movie?.releaseDate ?? ''}
              />
            </div>

            <fieldset>
              <legend>Genres</legend>
              {source.genres.map((genre) => (
                <div key={genre.id}>
                  <label>
                    <input
                      type="checkbox"
                      name="genreIds"
                      value={genre.id}
                      defaultChecked={selectedGenreIds.has(genre.id)}
                    />
                    {genre.name}
                  </label>
                </div>
              ))}
            </fieldset>

            <button type="submit">
              {isSaving ? 'Saving…' : actionLabel}
            </button>
          </fieldset>
        </form>
      )}

      {isEditing && (
        <button type="button" onClick={onCancel} disabled={formDisabled}>
          Cancel
        </button>
      )}

      {formError && <p role="alert">{formError}</p>}
    </section>
  )
}