<script>
import { GChart } from 'vue-google-charts'
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

export default {
  name: 'IndexPage',
  components: {
    GChart,
  },
  asyncData() {
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

    // dummy data
    const chartData = [
      ['Hour', 'Present', 'Average', 'Max'],
      ['0', 0, 0, 2],
      ['1', 0, 0, 3],
      ['2', 1, 5, 10],
    ]
    const chartOptions = {
      hAxis: {
        title: 'Hour of Day',
      },
      vAxis: {
        title: 'Minutes Worked',
      },
    }
    return { hourTime, minTime, secTime, mode, MODES, chartData, chartOptions }
  },

  data() {
    return {
      startTime: new Date(),
      endTime: new Date(),
      intervalId: 0,
      pmdCount: 0,
      counting: false,
      pendingData: Boolean(JSON.parse(localStorage.getItem('P-DATA'))),
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

      if (this.pendingData) {
        this.loading = true
        try {
          // sendToServer(JSON.parse(localStorage.getItem('P-DATA')))
        } catch (err) {
          console.log(err)
          console.log('failed to save pending data')
        }
        this.loading = false
      }

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

    pauseCountDown() {
      this.endTime = new Date()
      this.counting = false
      const timeInterval = this.getInterval(this.startTime, this.endTime)
      // insert sending api to server here
      this.loading = true
      try {
        // sendToServer(timeInterval)
      } catch {
        if (!JSON.parse(localStorage.getItem('P-DATA'))) {
          localStorage.setItem('P-DATA', JSON.stringify(timeInterval))
        } else {
          let d = JSON.parse(localStorage.getItem('P-DATA'))
          d = Object.assign(d, timeInterval)
          localStorage.setItem('P-DATA', JSON.stringify(d))
        }
      }
      this.loading = false

      clearInterval(this.intervalId)
    },

    getInterval(start, end) {
      let minutesDifference = Math.trunc(
        (end.getTime() - start.getTime()) / 60000
      )
      const interval = {}
      const stHour = start.getHours()
      const endHour = end.getHours()
      let r
      if (stHour < endHour) {
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
          interval[i] = r
        }
      } else if (stHour > endHour) {
        for (let i = stHour; i <= 23; i++) {
          if (i === stHour) {
            r = 60 - start.getMinutes()
            minutesDifference = minutesDifference - r
          } else {
            minutesDifference = minutesDifference - 60
            r = 60
          }
          interval[i] = r
        }
        for (let i = 0; i <= endHour; i++) {
          if (i === endHour) {
            r = minutesDifference
          }
          interval[i] = r
        }
      } else {
        interval[stHour] = minutesDifference
      }

      return interval
    },

    // sendToServer(data) {
    //   axios.post(data)
    //   localStorage.removeItem('P-DATA')
    // }

    switchMode(mode) {
      if (!mode || this.mode === mode) {
        return
      }

      this.mode = mode
      this.pauseCountDown()
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
        <span class="cnt-number leading-none">
          {{ padZeros(hourTime) }} : {{ padZeros(minTime) }} :
          {{ padZeros(secTime) }}
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
      <p v-if="pendingData" class="w-64 shadow-md cursor-pointer p-2">
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

.cnt-number {
  font-size: 10rem;
}

.active {
  @apply bg-gray-700 text-white;
}
</style>
