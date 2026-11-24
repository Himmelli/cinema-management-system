import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { listCinemas } from '../../api/cinemas'
import type { Cinema } from '../../api/cinemas'
import { createRoom, deleteRoom, listRooms, updateRoom } from '../../api/rooms'
import type { Room } from '../../api/rooms'
import { Link } from 'react-router'
import './RoomsPage.css'

function getRoomError(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) {
    return fallback
  }

  switch (error.response?.status) {
    case 401:
      return 'Your session has expired. Reload the page to continue.'
    case 403:
      return 'The request was denied. Reload the page and try again.'
    default:
      return fallback
  }
}

function compareRooms(first: Room, second: Room): number {
  return (
    first.cinemaName.localeCompare(second.cinemaName) ||
    first.name.localeCompare(second.name) ||
    first.id - second.id
  )
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [cinemas, setCinemas] = useState<Cinema[]>([])
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [roomLoadError, setRoomLoadError] = useState('')
  const [cinemaLoadError, setCinemaLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const formTitle = editingRoom ? 'Edit room' : 'Add room'
  const submitLabel = editingRoom ? 'Save changes' : 'Add room'
  const isFormDisabled = isLoading || isSaving || roomToDelete !== null

  useEffect(() => {
    const controller = new AbortController()

    async function loadPage() {
      const [roomResult, cinemaResult] = await Promise.allSettled([
        listRooms(controller.signal),
        listCinemas(controller.signal),
      ])

      if (controller.signal.aborted) {
        return
      }

      if (roomResult.status === 'fulfilled') {
        setRooms(roomResult.value)
      } else {
        setRoomLoadError(
          getRoomError(roomResult.reason, 'Unable to load rooms. Reload the page to try again.'),
        )
      }

      if (cinemaResult.status === 'fulfilled') {
        setCinemas(cinemaResult.value)
      } else {
        setCinemaLoadError(
          getRoomError(cinemaResult.reason, 'Unable to load cinemas. Reload the page to try again.'),
        )
      }

      setIsLoading(false)
    }

    void loadPage()

    return () => controller.abort()
  }, [])

  function startEditing(room: Room) {
    setEditingRoom(room)
    setFormError('')
    setSuccessMessage('')
  }

  function cancelEditing() {
    setEditingRoom(null)
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

    const form = event.currentTarget
    const values = new FormData(form)
    const name = String(values.get('name') ?? '').trim()
    const roomType = String(values.get('roomType') ?? '').trim()
    const cinemaId = Number(values.get('cinemaId'))

    if (editingRoom === null && !cinemas.some((cinema) => cinema.id === cinemaId)) {
      setFormError('Select a cinema.')
      return
    }

    if (!name || !roomType) {
      setFormError('Room name and room type are required.')
      return
    }

    setIsSaving(true)

    try {
      if (editingRoom) {
        const updatedRoom = await updateRoom(editingRoom.id, { name, roomType })

        setRooms((current) =>
          current
            .map((room) => room.id === updatedRoom.id ? updatedRoom : room)
            .sort(compareRooms),
        )
        setEditingRoom(null)
        setSuccessMessage('Room updated successfully.')
      } else {
        const newRoom = await createRoom({ cinemaId, name, roomType })

        setRooms((current) => [...current, newRoom].sort(compareRooms))
        form.reset()
        setSuccessMessage('Room added successfully.')
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 404) {
        setFormError(
          editingRoom
            ? 'This room was not found. Reload the page to refresh the list.'
            : 'The selected cinema was not found. Reload the page and select a cinema.',
        )
      } else {
        const fallback = editingRoom
          ? 'Unable to update the room. Please try again.'
          : 'Unable to add the room. Please try again.'

        setFormError(getRoomError(error, fallback))
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteRoom() {
    if (roomToDelete === null || isDeleting || isSaving) {
      return
    }

    const roomId = roomToDelete.id
    setIsDeleting(true)
    setDeleteError('')

    try {
      await deleteRoom(roomId)

      setRooms((current) => current.filter((room) => room.id !== roomId))
      setRoomToDelete(null)
      setSuccessMessage('Room deleted successfully.')
    } catch (error: unknown) {
      const response = isAxiosError<{ detail?: string }>(error)
        ? error.response
        : undefined

      if (response?.status === 409) {
        setDeleteError(response.data?.detail || 'This room is in use and cannot be deleted.')
      } else if (response?.status === 404) {
        setDeleteError('This room was not found. Reload the page to refresh the list.')
      } else {
        setDeleteError(getRoomError(error, 'Unable to delete the room. Please try again.'))
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="rooms-page">
      <h1>Rooms</h1>

      {successMessage && (
        <p className="rooms-success" role="status">{successMessage}</p>
      )}

      <div className="rooms-grid">
        <section className="rooms-panel" aria-labelledby="room-list-title">
          <h2 id="room-list-title">Room list</h2>

          {isLoading && <p role="status">Loading rooms…</p>}
          {roomLoadError && <p role="alert">{roomLoadError}</p>}
          {!isLoading && !roomLoadError && rooms.length === 0 && <p>No rooms found.</p>}

          {roomToDelete && (
            <section className="rooms-delete-confirmation" aria-labelledby="delete-room-title">
              <h3 id="delete-room-title">Delete room?</h3>
              <p>
                Are you sure you want to delete <strong>{roomToDelete.name}</strong>{' '}
                at <strong>{roomToDelete.cinemaName}</strong>?
              </p>

              {deleteError && <p role="alert">{deleteError}</p>}

              <div className="rooms-form-actions">
                <button
                  className="rooms-secondary-button"
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setRoomToDelete(null)
                    setDeleteError('')
                  }}
                >
                  Cancel
                </button>
                <button
                  className="rooms-danger-button"
                  type="button"
                  disabled={isDeleting}
                  onClick={() => void handleDeleteRoom()}
                >
                  {isDeleting ? 'Deleting…' : 'Confirm deletion'}
                </button>
              </div>
            </section>
          )}

          {rooms.length > 0 && (
            <div className="rooms-table-wrapper">
              <table className="rooms-table">
                <thead>
                  <tr>
                    <th scope="col">Room</th>
                    <th scope="col">Cinema</th>
                    <th scope="col">Room type</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id}>
                      <th scope="row">{room.name}</th>
                      <td>{room.cinemaName}</td>
                      <td>{room.roomType}</td>
                      <td>{room.status}</td>
                      <td>
                        <div className="rooms-form-actions">
                          <Link
                            className="rooms-view-seats-link"
                            to={`/admin/rooms/${room.id}/seats`}
                            aria-label={`View seats for ${room.name} at ${room.cinemaName}`}
                          >
                            View seats
                          </Link>
                          <button
                            className="rooms-secondary-button"
                            type="button"
                            aria-label={`Edit ${room.name} at ${room.cinemaName}`}
                            disabled={isSaving || roomToDelete !== null}
                            onClick={() => startEditing(room)}
                          >
                            Edit
                          </button>
                          <button
                            className="rooms-secondary-button"
                            type="button"
                            aria-label={`Delete ${room.name} at ${room.cinemaName}`}
                            disabled={isSaving || editingRoom !== null || roomToDelete !== null}
                            onClick={() => {
                              setRoomToDelete(room)
                              setDeleteError('')
                              setSuccessMessage('')
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

        <section className="rooms-panel" aria-labelledby="room-form-title">
          <h2 id="room-form-title">{formTitle}</h2>

          {isLoading && <p role="status">Loading cinemas…</p>}
          {!editingRoom && cinemaLoadError && <p role="alert">{cinemaLoadError}</p>}
          {!editingRoom && !isLoading && !cinemaLoadError && cinemas.length === 0 && (
            <p>Add a cinema before creating a room.</p>
          )}

          {(editingRoom || cinemas.length > 0) && (
            <form
              key={editingRoom?.id ?? 'new-room'}
              className="rooms-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="rooms-form-field">
                <label htmlFor="room-cinema">Cinema</label>
                {editingRoom ? (
                  <input id="room-cinema" value={editingRoom.cinemaName} readOnly />
                ) : (
                  <select
                    id="room-cinema"
                    name="cinemaId"
                    defaultValue=""
                    required
                    disabled={isFormDisabled}
                  >
                    <option value="" disabled>Select a cinema</option>
                    {cinemas.map((cinema) => (
                      <option key={cinema.id} value={cinema.id}>
                        {cinema.name} ({cinema.city})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="rooms-form-field">
                <label htmlFor="room-name">Room name</label>
                <input
                  id="room-name"
                  name="name"
                  defaultValue={editingRoom?.name ?? ''}
                  maxLength={255}
                  required
                  disabled={isFormDisabled}
                />
              </div>

              <div className="rooms-form-field">
                <label htmlFor="room-type">Room type</label>
                <input
                  id="room-type"
                  name="roomType"
                  defaultValue={editingRoom?.roomType ?? ''}
                  maxLength={255}
                  required
                  disabled={isFormDisabled}
                />
              </div>

              {formError && <p role="alert">{formError}</p>}

              <div className="rooms-form-actions">
                <button
                  className="rooms-primary-button"
                  type="submit"
                  disabled={isFormDisabled}
                >
                  {isSaving ? 'Saving…' : submitLabel}
                </button>

                {editingRoom && (
                  <button
                    className="rooms-secondary-button"
                    type="button"
                    disabled={isFormDisabled}
                    onClick={cancelEditing}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}