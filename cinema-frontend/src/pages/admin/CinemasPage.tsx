import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createCinema,
  deleteCinema,
  listCinemas,
  updateCinema,
} from '../../api/cinemas'
import type { Cinema, CinemaRequest } from '../../api/cinemas'
import './CinemasPage.css'

const emptyForm: CinemaRequest = {
  name: '',
  city: '',
  address: '',
}

const cinemaFields = [
  { name: 'name', label: 'Name' },
  { name: 'city', label: 'City' },
  { name: 'address', label: 'Address' },
] as const

function compareCinemas(first: Cinema, second: Cinema): number {
  return (
    first.city.localeCompare(second.city) ||
    first.name.localeCompare(second.name) ||
    first.id - second.id
  )
}

function getCinemaError(error: unknown, fallback: string): string {
  if (!isAxiosError<{ detail?: string }>(error)) {
    return fallback
  }

  const response = error.response

  switch (response?.status) {
    case 400:
      return response.data?.detail || fallback
    case 401:
      return 'Your session has expired. Reload the page to continue.'
    case 403:
      return 'The request was denied. Reload the page and try again.'
    case 409:
      return response.data?.detail || fallback
    default:
      return fallback
  }
}

export function CinemasPage() {
  const [cinemas, setCinemas] = useState<Cinema[]>([])
  const [fields, setFields] = useState<CinemaRequest>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [cinemaToDelete, setCinemaToDelete] = useState<Cinema | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const isEditing = editingId !== null
  const isConfirmingDeletion = cinemaToDelete !== null
  const isFormDisabled = isLoading || isSaving || isConfirmingDeletion

  useEffect(() => {
    const controller = new AbortController()

    async function loadCinemas() {
      try {
        const result = await listCinemas(controller.signal)

        if (!controller.signal.aborted) {
          setCinemas([...result].sort(compareCinemas))
        }
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setLoadError(getCinemaError(error, 'Unable to load the cinemas.'))
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadCinemas()

    return () => controller.abort()
  }, [])

  function resetForm() {
    setEditingId(null)
    setFields(emptyForm)
    setFormError('')
  }

  function startEditing(cinema: Cinema) {
    setEditingId(cinema.id)
    setFields({
      name: cinema.name,
      city: cinema.city,
      address: cinema.address,
    })
    setFormError('')
    setSuccessMessage('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isFormDisabled) {
      return
    }

    setFormError('')
    setSuccessMessage('')

    const request: CinemaRequest = {
      name: fields.name.trim(),
      city: fields.city.trim(),
      address: fields.address.trim(),
    }

    if (!request.name || !request.city || !request.address) {
      setFormError('Name, city, and address are required.')
      return
    }

    const id = editingId

    setIsSaving(true)

    try {
      const savedCinema = id === null
        ? await createCinema(request)
        : await updateCinema(id, request)

      setCinemas((current) =>
        [...current.filter((cinema) => cinema.id !== savedCinema.id), savedCinema]
          .sort(compareCinemas),
      )

      resetForm()
      setSuccessMessage(
        id === null ? 'Cinema added successfully.' : 'Cinema updated successfully.',
      )
    } catch (error: unknown) {
      if (id !== null && isAxiosError(error) && error.response?.status === 404) {
        setFormError('This cinema was not found. Reload the page to refresh the list.')
        return
      }

      setFormError(getCinemaError(error, 'Unable to save the cinema. Please try again.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteCinema() {
    if (cinemaToDelete === null || isDeleting || isSaving || isEditing) {
      return
    }

    const cinemaId = cinemaToDelete.id

    setIsDeleting(true)
    setDeleteError('')

    try {
      await deleteCinema(cinemaId)
      setCinemas((current) => current.filter((cinema) => cinema.id !== cinemaId))
      setCinemaToDelete(null)
      setSuccessMessage('Cinema deleted successfully.')
    } catch (error: unknown) {
      const status = isAxiosError(error) ? error.response?.status : undefined

      if (status === 404) {
        setDeleteError('This cinema was not found. Reload the page to refresh the list.')
        return
      }

      const fallback = status === 409
        ? 'This cinema is in use and cannot be deleted.'
        : 'Unable to delete the cinema. Please try again.'

      setDeleteError(getCinemaError(error, fallback))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="cinemas-page">
      <header className="cinemas-page-header">
        <h1>Cinemas</h1>
      </header>

      {successMessage && <p role="status">{successMessage}</p>}

      <div className="cinemas-grid">
        <section className="cinema-panel" aria-labelledby="cinema-list-title">
          <h2 id="cinema-list-title">Cinema list</h2>

          {isLoading && <p role="status">Loading cinemas…</p>}
          {loadError && <p role="alert">{loadError}</p>}

          {cinemaToDelete !== null && (
            <section aria-labelledby="delete-cinema-title">
              <h3 id="delete-cinema-title">Delete cinema?</h3>
              <p>
                Are you sure you want to delete <strong>{cinemaToDelete.name}</strong>?
              </p>

              {deleteError && <p role="alert">{deleteError}</p>}

              <div className="cinema-form-actions">
                <button
                  type="button"
                  className="cinema-secondary-button"
                  disabled={isDeleting}
                  onClick={() => {
                    setCinemaToDelete(null)
                    setDeleteError('')
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="cinema-secondary-button"
                  disabled={isDeleting}
                  onClick={() => void handleDeleteCinema()}
                >
                  {isDeleting ? 'Deleting…' : 'Confirm deletion'}
                </button>
              </div>
            </section>
          )}

          {!isLoading && !loadError && cinemas.length === 0 && (
            <p>No cinemas found.</p>
          )}

          {cinemas.length > 0 && (
            <div className="cinema-table-wrapper">
              <table className="cinema-table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">City</th>
                    <th scope="col">Address</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cinemas.map((cinema) => (
                    <tr key={cinema.id}>
                      <td>{cinema.name}</td>
                      <td>{cinema.city}</td>
                      <td>{cinema.address}</td>
                      <td>
                        <div className="cinema-form-actions">
                          <button
                            type="button"
                            className="cinema-secondary-button"
                            disabled={isSaving || isConfirmingDeletion}
                            onClick={() => startEditing(cinema)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="cinema-secondary-button"
                            disabled={isSaving || isEditing || isConfirmingDeletion}
                            onClick={() => {
                              setDeleteError('')
                              setSuccessMessage('')
                              setCinemaToDelete(cinema)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="cinema-panel" aria-labelledby="cinema-form-title">
          <h2 id="cinema-form-title">{isEditing ? 'Edit cinema' : 'Add cinema'}</h2>

          <form className="cinema-form" onSubmit={handleSubmit} noValidate>
            {cinemaFields.map(({ name, label }) => (
              <div className="cinema-form-field" key={name}>
                <label htmlFor={`cinema-${name}`}>{label}</label>
                <input
                  id={`cinema-${name}`}
                  name={name}
                  value={fields[name]}
                  maxLength={255}
                  required
                  disabled={isFormDisabled}
                  onChange={(event) => {
                    const value = event.currentTarget.value
                    setFields((current) => ({ ...current, [name]: value }))
                  }}
                />
              </div>
            ))}

            {formError && <p role="alert">{formError}</p>}

            <div className="cinema-form-actions">
              <button
                type="submit"
                className="cinema-primary-button"
                disabled={isFormDisabled}
              >
                {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Add cinema'}
              </button>

              {isEditing && (
                <button
                  type="button"
                  className="cinema-secondary-button"
                  disabled={isFormDisabled}
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

export default CinemasPage