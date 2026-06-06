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

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, options)
  } catch (err) {
    // Сетевая ошибка — бэкенд недоступен / CORS / нет соединения.
    const e = new Error('Не удалось подключиться к серверу. Проверьте, что бэкенд запущен.')
    e.kind = 'network'
    throw e
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Ошибка сети' }))
    const e = new Error(error.error || JSON.stringify(error.errors) || 'Ошибка запроса')
    e.kind = 'http'
    e.status = response.status
    throw e
  }

  return response.json()
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
}