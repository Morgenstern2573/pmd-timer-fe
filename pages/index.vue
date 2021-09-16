<script>
import { GChart } from 'vue-google-charts'
import lOverlay from '~/components/l-overlay.vue'
import {
  saveTime,
  getUserAvg,
  getTodayData,
  getMaxDay,
  checkLoginStatus,
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
  },
  async asyncData({ redirect }) {
    const loginStatus = (await checkLoginStatus()).data.message

    if (loginStatus === 'no') {
      // return redirect('/login')
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

    const hourTime = JSON.parse(localStorage.getItem(MODES[0])).hours
    const minTime = JSON.parse(localStorage.getItem(MODES[0])).min
    const secTime = JSON.parse(localStorage.getItem(MODES[0])).secs
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
    }
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
  },
}
</script>

<template>
  <div class="container mx-auto">
    <l-overlay :visible="loading"></l-overlay>
    <div>
      <h1 class="text-2xl my-4 text-center uppercase">Tomato timer</h1>
      <div class="flex justify-center">
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
      <div class="flex justify-center my-8">
        <span class="text-5xl md:text-8xl leading-none font-normal">
          {{ padZeros(hourTime) }}:{{ padZeros(minTime) }}:{{
            padZeros(secTime)
          }}
        </span>
      </div>
      <div>
        <div class="flex justify-center">
          <button
            v-show="!counting"
            class="btn w-32 uppercase shadow-md tracking-widest text-2xl"
            @click="countDown"
          >
            Start
          </button>
          <button
            v-show="counting"
            class="btn w-32 uppercase shadow-md tracking-widest text-2xl"
            @click="pauseCountDown"
          >
            Pause
          </button>
        </div>
      </div>
    </div>
    <div>
      <p
        v-if="pendingData"
        class="w-64 shadow-md cursor-pointer p-2"
        @click="retrySave"
      >
        You have unsaved data.Click to save
      </p>

      <GChart
        :settings="{ packages: ['corechart'] }"
        type="LineChart"
        :data="chartData"
        :options="chartOptions"
      />
    </div>
  </div>
</template>

<style>
.btn {
  @apply bg-white px-3 py-2 rounded leading-none mx-2;
}

.active {
  @apply bg-gray-700 text-white;
}
</style>
