import { isAxiosError } from 'axios'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createGenre,
  deleteGenre,
  listGenres,
  updateGenre,
} from '../../api/genres'
import type { GenreResponse } from '../../api/genres'

function getGenreError(error: unknown, fallback: string): string {
  if (isAxiosError<{ detail?: string }>(error)) {
    const status = error.response?.status

    if (status === 400 || status === 409) {
      return error.response?.data?.detail || fallback
    }

    if (status === 404) {
      return 'This genre no longer exists. Reload the page to continue.'
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

export default function GenresPage() {
  const [genres, setGenres] = useState<GenreResponse[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [genreToDelete, setGenreToDelete] = useState<GenreResponse | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const nameInput = useRef<HTMLInputElement>(null)

  const isEditing = editingId !== null
  const actionsLocked = isSaving || genreToDelete !== null

  useEffect(() => {
    const controller = new AbortController()

    void listGenres(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) {
          setGenres(items)
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        const sessionExpired = isAxiosError(error) && error.response?.status === 401

        setLoadError(
          sessionExpired
            ? 'Your session has expired. Reload the page to continue.'
            : 'Unable to load genres. Reload the page to try again.',
        )
      })

    return () => controller.abort()
  }, [])

  function startEditing(genre: GenreResponse) {
    setEditingId(genre.id)
    setName(genre.name)
    setFormError('')
    setSuccessMessage('')
    nameInput.current?.focus()
  }

  function cancelEditing() {
    setEditingId(null)
    setName('')
    setFormError('')
    nameInput.current?.focus()
  }

  function startDeleting(genre: GenreResponse) {
    setGenreToDelete(genre)
    setDeleteError('')
    setSuccessMessage('')
  }

  function cancelDeleting() {
    setGenreToDelete(null)
    setDeleteError('')
  }

  async function handleDelete() {
    if (genreToDelete === null || isDeleting) {
      return
    }

    const { id, name: genreName } = genreToDelete
    setDeleteError('')
    setIsDeleting(true)

    try {
      await deleteGenre(id)
      setGenres((current) => current?.filter((genre) => genre.id !== id) ?? [])

      if (editingId === id) {
        setEditingId(null)
        setName('')
        setFormError('')
      }

      setGenreToDelete(null)
      setSuccessMessage(`${genreName} was deleted.`)
    } catch (error) {
      setDeleteError(
        getGenreError(error, 'Unable to delete the genre. Please try again.'),
      )
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (actionsLocked || genres === null) {
      return
    }

    setFormError('')
    setSuccessMessage('')

    const trimmedName = name.trim()

    if (!trimmedName) {
      setFormError('Genre name is required.')
      return
    }

    setIsSaving(true)

    try {
      const saved = editingId === null
        ? await createGenre(trimmedName)
        : await updateGenre(editingId, trimmedName)

      setGenres((current) => {
        const otherGenres = (current ?? []).filter((genre) => genre.id !== saved.id)

        return [...otherGenres, saved].sort((first, second) =>
          first.name.localeCompare(second.name, 'en'),
        )
      })

      setEditingId(null)
      setName('')
      setSuccessMessage(
        isEditing ? `${saved.name} was updated.` : `${saved.name} was added.`,
      )
    } catch (error) {
      const fallback = isEditing
        ? 'Unable to update the genre. Please try again.'
        : 'Unable to add the genre. Please try again.'

      setFormError(getGenreError(error, fallback))
    } finally {
      setIsSaving(false)
    }
  }

  let submitLabel = isEditing ? 'Save changes' : 'Add genre'

  if (isSaving) {
    submitLabel = isEditing ? 'Saving…' : 'Adding…'
  }

  return (
    <section>
      <h1>Genres</h1>

      {loadError && <p role="alert">{loadError}</p>}
      {!loadError && genres === null && <p role="status">Loading genres…</p>}

      {genres !== null && (
        <>
          <form onSubmit={handleSubmit}>
            <label htmlFor="genre-name">Genre name</label>
            <input
              ref={nameInput}
              id="genre-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={255}
              disabled={actionsLocked}
              required
            />
            <button type="submit" disabled={actionsLocked}>
              {submitLabel}
            </button>
            {isEditing && (
              <button type="button" onClick={cancelEditing} disabled={actionsLocked}>
                Cancel
              </button>
            )}
          </form>

          {formError && <p role="alert">{formError}</p>}
          {successMessage && <p role="status">{successMessage}</p>}

          {genres.length === 0 ? (
            <p>No genres found.</p>
          ) : (
            <ul>
              {genres.map((genre) => (
                <li key={genre.id}>
                  {genre.name}{' '}
                  <button
                    type="button"
                    aria-label={`Edit ${genre.name}`}
                    onClick={() => startEditing(genre)}
                    disabled={actionsLocked}
                  >
                    Edit
                  </button>{' '}
                  <button
                    type="button"
                    aria-label={`Delete ${genre.name}`}
                    onClick={() => startDeleting(genre)}
                    disabled={actionsLocked}
                  >
                    Delete
                  </button>

                  {genreToDelete?.id === genre.id && (
                    <div role="group" aria-label={`Confirm deletion of ${genre.name}`}>
                      <p>Delete {genre.name}?</p>
                      <button
                        type="button"
                        onClick={() => void handleDelete()}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting…' : 'Confirm deletion'}
                      </button>{' '}
                      <button
                        type="button"
                        onClick={cancelDeleting}
                        disabled={isDeleting}
                      >
                        Cancel
                      </button>
                      {deleteError && <p role="alert">{deleteError}</p>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}