import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { listRooms } from '../../api/rooms'
import type { Room } from '../../api/rooms'
import { createSeat, deleteSeat, listSeats, updateSeat } from '../../api/seats'
import type { Seat } from '../../api/seats'
import './RoomSeatsPage.css'

type RoomSeatsData = {
  room: Room | undefined
  seats: Seat[]
}

const maxSeatNumber = 2_147_483_647
const seatNotFoundMessage =
  'This seat was not found in this room. Reload the page to refresh the map.'

function getSeatError(
  error: unknown,
  fallback: string,
  notFoundMessage = 'Room not found.',
): string {
  const status = isAxiosError(error) ? error.response?.status : undefined

  switch (status) {
    case 401:
      return 'Your session has expired. Reload the page to continue.'
    case 403:
      return 'You do not have permission to perform this action.'
    case 404:
      return notFoundMessage
    default:
      return fallback
  }
}

function compareSeats(first: Seat, second: Seat): number {
  return (
    first.rowLabel.localeCompare(second.rowLabel) ||
    first.seatNumber - second.seatNumber
  )
}

function groupSeatsByRow(seats: Seat[]): Map<string, Seat[]> {
  const rows = new Map<string, Seat[]>()

  for (const seat of seats) {
    const row = rows.get(seat.rowLabel)

    if (row) {
      row.push(seat)
    } else {
      rows.set(seat.rowLabel, [seat])
    }
  }

  return rows
}

function RoomSeatMap({ roomId }: { roomId: number }) {
  const [data, setData] = useState<RoomSeatsData | null>(null)
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null)
  const [seatToDelete, setSeatToDelete] = useState<Seat | null>(null)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isFormDisabled = isSaving || seatToDelete !== null

  useEffect(() => {
    const controller = new AbortController()

    async function loadSeatMap() {
      try {
        const [rooms, seats] = await Promise.all([
          listRooms(controller.signal),
          listSeats(roomId, controller.signal),
        ])

        if (!controller.signal.aborted) {
          setData({
            room: rooms.find((room) => room.id === roomId),
            seats: [...seats].sort(compareSeats),
          })
        }
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setLoadError(
            getSeatError(error, 'Unable to load the seat map. Reload the page to try again.'),
          )
        }
      }
    }

    void loadSeatMap()

    return () => controller.abort()
  }, [roomId])

  function selectSeatForEdit(seat: Seat | null) {
    setEditingSeat(seat)
    setFormError('')
    setSuccessMessage('')
  }

  function selectSeatForDeletion(seat: Seat | null) {
    setSeatToDelete(seat)
    setDeleteError('')
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
    const fields = new FormData(form)
    const rowLabel = String(fields.get('rowLabel') ?? '').trim()
    const seatNumber = Number(fields.get('seatNumber'))
    const seatType = String(fields.get('seatType') ?? '').trim()

    if (!rowLabel || !seatType) {
      setFormError('Row label and seat type are required.')
      return
    }

    if (!Number.isInteger(seatNumber) || seatNumber < 1 || seatNumber > maxSeatNumber) {
      setFormError('Enter a whole seat number between 1 and 2,147,483,647.')
      return
    }

    const request = { rowLabel, seatNumber, seatType }

    setIsSaving(true)

    try {
      const savedSeat = editingSeat
        ? await updateSeat(roomId, editingSeat.id, request)
        : await createSeat(roomId, request)

      setData((current) => {
        if (current === null) {
          return current
        }

        const seats = [
          ...current.seats.filter((seat) => seat.id !== savedSeat.id),
          savedSeat,
        ].sort(compareSeats)

        return { ...current, seats }
      })

      const label = `${savedSeat.rowLabel}${savedSeat.seatNumber}`

      if (editingSeat) {
        setEditingSeat(null)
        setSuccessMessage(`Seat ${label} updated successfully.`)
      } else {
        form.reset()
        setSuccessMessage(`Seat ${label} added successfully.`)
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setFormError('A seat with this row and number already exists in this room.')
      } else if (editingSeat) {
        setFormError(getSeatError(
          error,
          'Unable to update the seat. Please try again.',
          seatNotFoundMessage,
        ))
      } else {
        setFormError(getSeatError(error, 'Unable to add the seat. Please try again.'))
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteSeat() {
    if (seatToDelete === null || isDeleting || isSaving) {
      return
    }

    const { id, rowLabel, seatNumber } = seatToDelete
    setIsDeleting(true)
    setDeleteError('')

    try {
      await deleteSeat(roomId, id)

      setData((current) => {
        if (current === null) {
          return current
        }

        return {
          ...current,
          seats: current.seats.filter((seat) => seat.id !== id),
        }
      })

      setSeatToDelete(null)
      setSuccessMessage(`Seat ${rowLabel}${seatNumber} deleted successfully.`)
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setDeleteError('This seat is in use and cannot be deleted.')
      } else {
        setDeleteError(getSeatError(
          error,
          'Unable to delete the seat. Please try again.',
          seatNotFoundMessage,
        ))
      }
    } finally {
      setIsDeleting(false)
    }
  }

  if (loadError) {
    return <p role="alert">{loadError}</p>
  }

  if (data === null) {
    return <p role="status">Loading seat map…</p>
  }

  const roomName = data.room?.name ?? `Room #${roomId}`
  const seatRows = groupSeatsByRow(data.seats)
  const submitLabel = editingSeat ? 'Save changes' : 'Add seat'

  return (
    <>
      <section className="room-seat-panel" aria-labelledby="seat-map-title">
        <h2 id="seat-map-title">{roomName}</h2>
        {data.room && <p className="room-seat-cinema">{data.room.cinemaName}</p>}

        {successMessage && (
          <p className="room-seat-success" role="status">{successMessage}</p>
        )}

        {seatToDelete && (
          <section
            className="room-seat-delete-confirmation"
            aria-labelledby="delete-seat-title"
          >
            <h3 id="delete-seat-title">Delete seat?</h3>
            <p>
              Are you sure you want to delete{' '}
              <strong>{seatToDelete.rowLabel}{seatToDelete.seatNumber}</strong>
              {' '}from <strong>{roomName}</strong>?
            </p>

            {deleteError && <p role="alert">{deleteError}</p>}

            <div className="room-seat-form-actions">
              <button
                className="room-seat-secondary"
                type="button"
                disabled={isDeleting}
                onClick={() => selectSeatForDeletion(null)}
              >
                Cancel
              </button>
              <button
                className="room-seat-danger"
                type="button"
                disabled={isDeleting}
                onClick={() => void handleDeleteSeat()}
              >
                {isDeleting ? 'Deleting…' : 'Confirm deletion'}
              </button>
            </div>
          </section>
        )}

        {seatRows.size === 0 ? (
          <p>No seats have been added to this room yet.</p>
        ) : (
          <>
            <p className="room-seat-screen">Screen</p>

            {Array.from(seatRows, ([rowLabel, seats]) => (
              <div className="room-seat-row" key={rowLabel}>
                <h3>Row {rowLabel}</h3>

                <ul className="room-seat-list">
                  {seats.map((seat) => (
                    <li className="room-seat-card" key={seat.id}>
                      <strong>{seat.rowLabel}{seat.seatNumber}</strong>
                      <span>{seat.seatType}</span>
                      <span>{seat.status}</span>

                      <div className="room-seat-form-actions">
                        <button
                          className="room-seat-secondary"
                          type="button"
                          aria-label={`Edit seat ${seat.rowLabel}${seat.seatNumber}`}
                          disabled={isFormDisabled || editingSeat?.id === seat.id}
                          onClick={() => selectSeatForEdit(seat)}
                        >
                          Edit
                        </button>
                        <button
                          className="room-seat-secondary"
                          type="button"
                          aria-label={`Delete seat ${seat.rowLabel}${seat.seatNumber}`}
                          disabled={isFormDisabled || editingSeat !== null}
                          onClick={() => selectSeatForDeletion(seat)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
      </section>

      <section className="room-seat-panel" aria-labelledby="seat-form-title">
        <h2 id="seat-form-title">{editingSeat ? 'Edit seat' : 'Add seat'}</h2>

        <form
          key={editingSeat?.id ?? 'new-seat'}
          className="room-seat-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <fieldset disabled={isFormDisabled}>
            <div className="room-seat-field">
              <label htmlFor="seat-row-label">Row label</label>
              <input
                id="seat-row-label"
                name="rowLabel"
                defaultValue={editingSeat?.rowLabel ?? ''}
                maxLength={255}
                required
              />
            </div>

            <div className="room-seat-field">
              <label htmlFor="seat-number">Seat number</label>
              <input
                id="seat-number"
                name="seatNumber"
                type="number"
                defaultValue={editingSeat?.seatNumber ?? ''}
                min={1}
                max={maxSeatNumber}
                step={1}
                required
              />
            </div>

            <div className="room-seat-field">
              <label htmlFor="seat-type">Seat type</label>
              <input
                id="seat-type"
                name="seatType"
                defaultValue={editingSeat?.seatType ?? ''}
                maxLength={255}
                required
              />
            </div>

            <div className="room-seat-form-actions">
              <button className="room-seat-submit" type="submit">
                {isSaving ? 'Saving…' : submitLabel}
              </button>

              {editingSeat && (
                <button
                  className="room-seat-secondary"
                  type="button"
                  onClick={() => selectSeatForEdit(null)}
                >
                  Cancel
                </button>
              )}
            </div>
          </fieldset>

          {formError && <p role="alert">{formError}</p>}
        </form>
      </section>
    </>
  )
}

export default function RoomSeatsPage() {
  const { roomId } = useParams()
  const parsedRoomId = Number(roomId)
  const isValidRoomId =
    roomId !== undefined &&
    /^\d+$/.test(roomId) &&
    Number.isSafeInteger(parsedRoomId) &&
    parsedRoomId > 0

  return (
    <div className="room-seats-page">
      <Link className="room-seats-back" to="/admin/rooms">
        Back to rooms
      </Link>
      <h1>Seat map</h1>

      {isValidRoomId ? (
        <RoomSeatMap key={parsedRoomId} roomId={parsedRoomId} />
      ) : (
        <p role="alert">Invalid room ID.</p>
      )}
    </div>
  )
}