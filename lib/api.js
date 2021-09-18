import axios from 'axios'

const API = 'https://secret-escarpment-69658.herokuapp.com/'
// const API = 'https://505a-105-112-74-115.ngrok.io/'
// const API = 'http://localhost:5000'

const blackAxios = axios.create({
  baseURL: API,
  withCredentials: true,
})

export async function saveTime(date, timeInterval) {
  const form = new FormData()
  form.set('date', date)
  form.set('time_data', JSON.stringify(timeInterval))
  const response = await blackAxios.post(`/api/save-time`, form)
  return { httpStatus: response.status, data: response.data }
}

export async function getUserAvg() {
  const cDate = new Date().toDateString()
  const response = await blackAxios.get('/api/user-average', {
    params: {
      c_date: cDate,
    },
  })
  return { httpStatus: response.status, data: response.data }
}

export async function getTodayData() {
  const cDate = new Date().toDateString()
  const response = await blackAxios.get('/api/current-day', {
    params: {
      c_date: cDate,
    },
  })
  return { httpStatus: response.status, data: response.data }
}

export async function getMaxDay() {
  const cDate = new Date().toDateString()
  const response = await blackAxios.get('/api/max-day', {
    params: {
      c_date: cDate,
    },
  })
  return { httpStatus: response.status, data: response.data }
}

export async function registerUser(name, pwd) {
  const form = new FormData()
  form.set('username', name)
  form.set('password', pwd)
  const response = await blackAxios.post('/auth/register', form)
  return { httpStatus: response.status, data: response.data }
}

export async function loginUser(name, pwd) {
  const form = new FormData()
  form.set('username', name)
  form.set('password', pwd)
  const response = await blackAxios.post('/auth/login', form)
  return { httpStatus: response.status, data: response.data }
}

export async function checkLoginStatus() {
  const response = await blackAxios.get('/auth/login')
  return { httpStatus: response.status, data: response.data }
}

export async function logOutUser() {
  const response = await blackAxios.get('/auth/logout')
  return { httpStatus: response.status, data: response.data }
}
