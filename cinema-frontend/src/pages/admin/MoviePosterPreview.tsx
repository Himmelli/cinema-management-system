import { useEffect, useState } from 'react'
import { apiHttp } from '../../api/http'

type MoviePosterPreviewProps = {
  posterUrl: string
  title: string
}

const posterPathPattern =
  /^\/api\/movie-posters\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\.jpg$/

export default function MoviePosterPreview({
  posterUrl,
  title,
}: MoviePosterPreviewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let objectUrl: string | null = null

    async function loadPoster() {
      try {
        if (!posterPathPattern.test(posterUrl)) {
          throw new Error('Invalid poster URL.')
        }

        // apiHttp already adds /api to the request path.
        const response = await apiHttp.get<Blob>(posterUrl.slice('/api'.length), {
          responseType: 'blob',
          signal: controller.signal,
        })

        if (!controller.signal.aborted) {
          objectUrl = URL.createObjectURL(response.data)
          setImageUrl(objectUrl)
        }
      } catch {
        if (!controller.signal.aborted) {
          setHasError(true)
        }
      }
    }

    void loadPoster()

    return () => {
      controller.abort()

      if (objectUrl !== null) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [posterUrl])

  if (hasError) {
    return <p role="alert">Unable to load the poster.</p>
  }

  if (imageUrl === null) {
    return <p role="status">Loading poster…</p>
  }

  return (
    <img
      src={imageUrl}
      alt={`Poster for ${title}`}
      onError={() => setHasError(true)}
      style={{ display: 'block', width: 160, maxWidth: '100%', height: 'auto' }}
    />
  )
}