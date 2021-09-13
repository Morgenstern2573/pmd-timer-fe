import axios from 'axios'

const API = 'http://localhost:5000/api/'

const blackAxios = axios.create({
  baseURL: API,
})

export async function saveTime(date, timeInterval) {
  const form = new FormData()
  form.set('date', date)
  form.set('time_data', JSON.stringify(timeInterval))
  const response = await blackAxios.post(`/save-time`, form)
  return { httpStatus: response.status, data: response.data }
}
