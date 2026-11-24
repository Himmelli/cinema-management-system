import axios from 'axios'

const httpConfig = {
  baseURL: '/api',
  allowAbsoluteUrls: false,
  timeout: 10_000,
}

export const authHttp = axios.create(httpConfig)
export const apiHttp = axios.create(httpConfig)

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

apiHttp.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return config
})