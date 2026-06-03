const BASE_URL = '/api'

function getToken() {
  return localStorage.getItem('access_token')
}

async function request(method, path, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }

  const token = getToken()
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`
  }

  if (body !== null) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${path}`, options)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Ошибка сети' }))
    throw new Error(error.error || JSON.stringify(error.errors) || 'Ошибка запроса')
  }

  return response.json()
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
}