import axios from 'axios'

const API = 'https://secret-escarpment-69658.herokuapp.com/'
// const API = 'https://c3f0-105-112-37-161.ngrok.io'
// const API = 'http://localhost:5000'
const blackAxios = axios.create({
  baseURL: API,
  withCredentials: true,
})

export async function saveTime(date, timeInterval) {
  const token = localStorage.getItem('token')
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const form = new FormData()
  form.set('date', date)
  form.set('time_data', JSON.stringify(timeInterval))
  const response = await blackAxios.post(`/api/save-time`, form, config)
  return { httpStatus: response.status, data: response.data }
}

export async function getUserAvg() {
  const token = localStorage.getItem('token')
  const headers = {
    Authorization: `Bearer ${token}`,
  }
  const cDate = new Date().toDateString()
  const response = await blackAxios.get('/api/user-average', {
    params: {
      c_date: cDate,
    },
    headers,
  })
  return { httpStatus: response.status, data: response.data }
}

export async function getTodayData() {
  const token = localStorage.getItem('token')
  const headers = {
    Authorization: `Bearer ${token}`,
  }
  const cDate = new Date().toDateString()
  const response = await blackAxios.get('/api/current-day', {
    params: {
      c_date: cDate,
    },
    headers,
  })
  return { httpStatus: response.status, data: response.data }
}

export async function getMaxDay() {
  const token = localStorage.getItem('token')
  const headers = {
    Authorization: `Bearer ${token}`,
  }
  const cDate = new Date().toDateString()
  const response = await blackAxios.get('/api/max-day', {
    params: {
      c_date: cDate,
    },
    headers,
  })
  return { httpStatus: response.status, data: response.data }
}

export async function registerUser(name, pwd) {
  const token = localStorage.getItem('token')
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
  const form = new FormData()
  form.set('username', name)
  form.set('password', pwd)
  const response = await blackAxios.post('/auth/register', form, config)
  return { httpStatus: response.status, data: response.data }
}

export async function loginUser(name, pwd) {
  const token = localStorage.getItem('token')
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
  const form = new FormData()
  form.set('username', name)
  form.set('password', pwd)
  const response = await blackAxios.post('/auth/login', form, config)
  return { httpStatus: response.status, data: response.data }
}

export async function checkLoginStatus() {
  const token = localStorage.getItem('token')
  const headers = {
    Authorization: `Bearer ${token}`,
  }
  const response = await blackAxios.get('/auth/check-login', { headers })
  return { httpStatus: response.status, data: response.data }
}

export async function logOutUser() {
  const token = localStorage.getItem('token')
  const headers = {
    Authorization: `Bearer ${token}`,
  }
  const response = await blackAxios.get('/auth/logout', { headers })
  return { httpStatus: response.status, data: response.data }
}
