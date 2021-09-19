<script>
import { GChart } from 'vue-google-charts'
import lOverlay from '~/components/l-overlay.vue'
import SettingsForm from '~/components/settings-form.vue'
import {
  saveTime,
  getUserAvg,
  getTodayData,
  getMaxDay,
  checkLoginStatus,
  logOutUser,
} from '~/lib/api'
const MODES = ['PMD', 'SBR', 'LBR']

function askNotificationPermission() {
  // function to actually ask the permissions
  function handlePermission(permission) {
    // Whatever the user answers, we make sure the browser stores the information
    if (!('permission' in Notification)) {
      Notification.permission = permission
    }
  }

  if (Notification.permission !== 'default') {
    return
  }

  // Let's check if the browser supports notifications
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications.')
  } else {
    Notification.requestPermission().then((permission) => {
      handlePermission(permission)
    })
  }
}

function generateChartData(avg, cur, max) {
  const chartData = [['Hour', 'Present', 'Average', 'Max']]
  for (let i = 0; i < 24; i++) {
    const h = String(i)
    let a = avg[h]
    let b = cur[h]
    let c = max[h]

    if (!a) {
      a = 0
    }

    if (!b) {
      b = 0
    }

    if (!c) {
      c = 0
    }

    chartData.push([h, b, a, c])
  }
  return chartData
}
export default {
  name: 'IndexPage',
  components: {
    GChart,
    lOverlay,
    SettingsForm,
  },
  async asyncData({ redirect }) {
    try {
      const loginStatus = (await checkLoginStatus()).data.message
      if (loginStatus === 'no') {
        return redirect('/login')
      }
    } catch (err) {
      console.log(err)
    }

    askNotificationPermission()

    if (!JSON.parse(localStorage.getItem(MODES[0]))) {
      localStorage.setItem(
        MODES[0],
        JSON.stringify({ hours: 0, min: 25, secs: 0 })
      )
    }
    if (!JSON.parse(localStorage.getItem(MODES[1]))) {
      localStorage.setItem(
        MODES[1],
        JSON.stringify({ hours: 0, min: 5, secs: 0 })
      )
    }
    if (!JSON.parse(localStorage.getItem(MODES[2]))) {
      localStorage.setItem(
        MODES[2],
        JSON.stringify({ hours: 0, min: 15, secs: 0 })
      )
    }

    const pmd = JSON.parse(localStorage.getItem(MODES[0]))
    const hourTime = pmd.hours
    const minTime = pmd.min
    const secTime = pmd.secs
    const mode = MODES[0]
    let avg, cur, max, chartData
    try {
      avg = (await getUserAvg()).data.data
      cur = (await getTodayData()).data.data
      max = (await getMaxDay()).data.data
      chartData = generateChartData(avg, cur, max)
      console.log(avg, cur, max)
    } catch (err) {
      // add code to disable rendering of the chart if data fetch fails
      alert('Error while fetching chart data')
      console.log(err)
    }
    const chartOptions = {
      hAxis: {
        title: 'Hour of Day',
      },
      vAxis: {
        title: 'Minutes Worked',
      },

      series: {
        0: { lineWidth: 6 },
        1: { lineWidth: 4, lineDashStyle: [4, 4] },
        2: { lineWidth: 4, lineDashStyle: [4, 4] },
      },
    }
    return {
      hourTime,
      minTime,
      secTime,
      mode,
      MODES,
      chartData,
      chartOptions,
      avg,
      cur,
      max,
    }
  },

  data() {
    return {
      startTime: new Date(),
      endTime: new Date(),
      intervalId: 0,
      pmdCount: 0,
      counting: false,
      pendingData: Boolean(localStorage.getItem('P-DATA')),
      loading: false,
      showSettings: false,
    }
  },

  computed: {
    currentSum() {
      let sum = 0
      for (const key in this.cur) {
        if (Object.hasOwnProperty.call(this.cur, key)) {
          sum += this.cur[key]
        }
      }
      if (sum === 0) {
        return `0 Hours, 0 Minutes`
      }
      const hrs = Math.trunc(sum / 60)
      const mins = sum - hrs * 60
      return `${hrs} Hours, ${mins} Minutes`
    },

    percentileScore() {
      let cSum = 0
      for (const key in this.cur) {
        if (Object.hasOwnProperty.call(this.cur, key)) {
          cSum += this.cur[key]
        }
      }

      if (cSum === 0) {
        return 0
      }

      let aSum = 0
      for (const key in this.avg) {
        if (Object.hasOwnProperty.call(this.avg, key)) {
          aSum += this.avg[key]
        }
      }

      return Math.trunc((cSum / aSum) * 100)
    },
  },

  methods: {
    padZeros(inVal) {
      if (inVal === null || inVal === undefined || typeof inVal !== 'number') {
        return
      }

      if (inVal < 0) {
        return
      }

      inVal = String(inVal)

      if (inVal.length < 2) {
        inVal = '0' + inVal
      }

      return inVal
    },

    decrementTime(min, secs) {
      if (typeof min !== 'number' || typeof secs !== 'number') {
        return { status: 'err' }
      }

      if (min < 0 || secs < 0) {
        return { status: 'err' }
      }

      if (min === 0 && secs === 0) {
        return { status: 'finished' }
      }

      let total = min * 60 + secs
      total--

      const hr = Math.trunc(total / 3600)
      total = total - 3600 * hr
      min = Math.trunc(total / 60)
      secs = total - 60 * min

      return { status: 'ok', hr, min, secs }
    },

    countDown() {
      this.startTime = new Date()
      this.counting = true

      this.intervalId = setInterval(() => {
        const val = this.decrementTime(
          this.minTime + this.hourTime * 60,
          this.secTime
        )

        if (val.status === 'err') {
          this.pauseCountDown()
          return
        }

        if (val.status === 'finished') {
          this.pauseCountDown()
          if (Notification.permission === 'granted') {
            // eslint-disable-next-line no-unused-vars
            const not = new Notification('Pomodoro Timer', {
              body: 'Your time is up!',
            })
          }

          if (this.mode !== MODES[0]) {
            this.switchMode(MODES[0])
            return
          }

          this.pmdCount += 1

          if (this.pmdCount !== 0 && this.pmdCount % 4 === 0) {
            this.switchMode(MODES[2])
          } else {
            this.switchMode(MODES[1])
          }

          return
        }
        this.hourTime = val.hr
        this.minTime = val.min
        this.secTime = val.secs
      }, 1000)
    },

    async pauseCountDown() {
      this.endTime = new Date()
      this.counting = false
      clearInterval(this.intervalId)

      const timeInterval = this.getInterval(this.startTime, this.endTime)
      // insert sending api to server here
      this.loading = true
      if (this.mode === MODES[0] && Object.keys(timeInterval).length > 0) {
        try {
          let response
          for (const key in timeInterval) {
            if (Object.hasOwnProperty.call(timeInterval, key)) {
              response = await saveTime(key, timeInterval[key])
            }
          }

          this.cur = response.data.data
          this.chartData = generateChartData(this.avg, this.cur, this.max)
        } catch {
          alert('failed to save pending data')
          let d = JSON.parse(localStorage.getItem('P-DATA'))
          if (!d || d.length === 0) {
            const a = JSON.stringify([timeInterval])
            localStorage.setItem('P-DATA', a)
          } else {
            d.push(timeInterval)
            d = JSON.stringify(d)
            localStorage.setItem('P-DATA', d)
          }

          this.pendingData = true
        }

        this.startTime = this.endTime
      }
      this.loading = false
    },

    getInterval(start, end) {
      let minutesDifference = Math.trunc(
        (end.getTime() - start.getTime()) / 60000
      )

      if (minutesDifference === 0) {
        return {}
      }
      // TO-DO
      // Add code to return an empty interval if minute difference
      // is greater than the time for a pomodoro??
      // need a way to ensure accurate readings when the device goes to sleep
      // create a new date object at the end of every tick? idk
      const interval = {}
      const stHour = start.getHours()
      const endHour = end.getHours()
      let r
      if (stHour < endHour) {
        interval[start.toDateString()] = {}
        for (let i = stHour; i <= endHour; i++) {
          if (i === stHour) {
            r = 60 - start.getMinutes()
            minutesDifference = minutesDifference - r
          } else if (i === endHour) {
            r = minutesDifference
          } else {
            minutesDifference = minutesDifference - 60
            r = 60
          }
          interval[start.toDateString()][i] = r
        }
      } else if (stHour > endHour) {
        interval[start.toDateString()] = {}
        for (let i = stHour; i <= 23; i++) {
          if (i === stHour) {
            r = 60 - start.getMinutes()
            minutesDifference = minutesDifference - r
          } else {
            minutesDifference = minutesDifference - 60
            r = 60
          }
          interval[start.toDateString()][i] = r
        }
        for (let i = 0; i <= endHour; i++) {
          interval[end.toDateString()] = {}
          if (i === endHour) {
            r = minutesDifference
          }
          interval[end.toDateString()][i] = r
        }
      } else {
        interval[start.toDateString()] = {}
        interval[start.toDateString()][stHour] = minutesDifference
      }

      return interval
    },

    async retrySave() {
      this.loading = true
      const intervalList = JSON.parse(localStorage.getItem('P-DATA'))
      if (!intervalList || intervalList.length === 0) {
        localStorage.removeItem('P-DATA')
        return
      }
      for (let i = 0; i < intervalList.length; i++) {
        const timeInterval = intervalList[i]
        if (Object.keys(timeInterval).length > 0) {
          try {
            for (const key in timeInterval) {
              if (Object.hasOwnProperty.call(timeInterval, key)) {
                await saveTime(key, timeInterval[key])
              }
            }
            localStorage.removeItem('P-DATA')
            this.pendingData = false
          } catch (err) {
            console.log(err)
            alert('failed to save pending data')
          }
        }
      }
      this.loading = false
    },

    async switchMode(mode) {
      if (!mode || this.mode === mode) {
        return
      }

      await this.pauseCountDown()
      this.mode = mode
      const time = JSON.parse(localStorage.getItem(mode))
      this.hourTime = time.hours
      this.minTime = time.min
      this.secTime = time.secs
    },

    async refreshMode() {
      await this.pauseCountDown()
      const time = JSON.parse(localStorage.getItem(this.mode))
      this.hourTime = time.hours
      this.minTime = time.min
      this.secTime = time.secs
    },

    async logOut() {
      this.loading = true
      try {
        await logOutUser()
        this.$router.push('/login')
      } catch (err) {
        console.log(err)
        alert('logout failed')
      }
      this.loading = false
    },
  },
}
</script>

<template>
  <div class="container mx-auto px-3 md:px-5 min-h-screen flex flex-col">
    <l-overlay :visible="loading"></l-overlay>
    <settings-form
      :visible="showSettings"
      @hide="showSettings = false"
      @update="
        showSettings = false
        refreshMode()
      "
    ></settings-form>

    <header>
      <div class="container mx-auto flex flex-wrap py-5 items-center">
        <a
          class="flex title-font font-medium items-center text-gray-900 w-3/5 md:w-auto"
        >
          <svg
            class="w-10 h-10 md:w-12 md:h-12 text-white p-1 lg:p-2 bg-red-500 rounded-full"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M10.54,14.53L8.41,12.4L7.35,13.46L10.53,16.64L16.53,10.64L15.47,9.58L10.54,14.53M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22A9,9 0 0,0 21,13A9,9 0 0,0 12,4M7.88,3.39L6.6,1.86L2,5.71L3.29,7.24L7.88,3.39M22,5.72L17.4,1.86L16.11,3.39L20.71,7.25L22,5.72Z"
            />
          </svg>
          <span class="ml-3 text-lg md:text-xl uppercase">Tomato timer</span>
        </a>
        <nav
          class="md:ml-auto flex flex-col md:flex-row items-end flex-wrap md:items-center text-base justify-center w-2/5 md:w-auto"
        >
          <a
            class="mb-2 sm:md-4 md:mr-5 md:mb-0 cursor-pointer text-red-500"
            title="Settings"
            @click="showSettings = true"
          >
            <svg class="w-8 h-8 md:w-12 md:h-12" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.21,15.05 2.27,14.78 2.46,14.63L4.57,12.97L4.5,12L4.57,11L2.46,9.37C2.27,9.22 2.21,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.79,8.95 21.73,9.22 21.54,9.37L19.43,11L19.5,12L19.43,13L21.54,14.63C21.73,14.78 21.79,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.04 19.05,18.95L16.56,17.95C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.62L12.75,4H11.25Z"
              />
            </svg>
          </a>

          <button
            class="inline-flex items-center text-red-900 bg-white border border-red-900 py-1 px-1 md:px-3 focus:outline-none hover:bg-red-900 hover:text-white rounded text-sm md:text-base"
            @click="logOut"
          >
            Log Out
          </button>
        </nav>
      </div>
    </header>
    <!-- mode switch controls -->
    <div class="flex justify-center my-2 md:my-4 xl:my-0 lg:text-lg">
      <button
        class="btn shadow"
        :class="{ active: mode === MODES[0] }"
        @click="switchMode(MODES[0])"
      >
        Pomodoro
      </button>
      <button
        class="btn shadow"
        :class="{ active: mode === MODES[1] }"
        @click="switchMode(MODES[1])"
      >
        Short Break
      </button>
      <button
        class="btn shadow"
        :class="{ active: mode === MODES[2] }"
        @click="switchMode(MODES[2])"
      >
        Long Break
      </button>
    </div>
    <!-- timer display -->
    <div class="flex justify-center my-8">
      <span class="text-5xl md:text-8xl leading-none font-normal">
        {{ padZeros(hourTime) }}:{{ padZeros(minTime) }}:{{ padZeros(secTime) }}
      </span>
    </div>
    <!-- start / pause button -->
    <div class="flex justify-center mb-8">
      <button
        class="btn w-32 uppercase shadow-md tracking-widest text-2xl border border-gray-200"
        @click="counting ? pauseCountDown() : countDown()"
      >
        {{ counting ? 'Pause' : 'Start' }}
      </button>
    </div>
    <!-- chart and warning -->
    <div class="mb-4">
      <!-- button for unsaved data -->
      <button
        v-if="pendingData"
        type="button"
        class="block shadow-md cursor-pointer px-2 py-4 my-4 bg-red-500 text-red-900 rounded-sm text-center mx-auto"
        @click="retrySave"
      >
        You have unsaved data. Click here to save
      </button>
      <!-- metadata -->
      <div
        class="flex justify-center px-2 text-sm md:text-base lg:text-lg mb-2"
      >
        <p class="mr-1 md:mr-4 lg:mr-8 w-1/2 md:w-auto">
          <span class="font-medium mr-1">Today's Work:</span>
          <span>{{ currentSum }}</span>
        </p>
        <p class="w-1/2 md:w-auto text-right">
          <span class="font-medium mr-1">Percentile Score:</span>
          <span>{{ percentileScore }}</span>
        </p>
      </div>
      <GChart
        :settings="{ packages: ['corechart'] }"
        type="LineChart"
        :data="chartData"
        :options="chartOptions"
      />
    </div>

    <footer class="flex mt-auto justify-center text-sm text-gray-900 p-3">
      <p>
        Made by
        <a class="text-red-600" href="Morgenstern2573.github.io"
          >Paul Akinyemi</a
        >
      </p>
    </footer>
  </div>
</template>

<style>
.btn {
  @apply bg-white text-red-900 px-3 py-2 rounded leading-none mx-2;
}

.active {
  @apply bg-red-500 text-white;
}
</style>
