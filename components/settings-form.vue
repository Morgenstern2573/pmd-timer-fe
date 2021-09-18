<script>
const MODES = ['PMD', 'SBR', 'LBR']

export default {
  name: 'SettingsForm',
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      pmdHr: 0,
      pmdMin: 0,
      sHr: 0,
      sMin: 0,
      lHr: 0,
      lMin: 0,
      errorMsg: '',
    }
  },
  created() {
    if (!JSON.parse(localStorage.getItem(MODES[0]))) {
      return
    }
    if (!JSON.parse(localStorage.getItem(MODES[1]))) {
      return
    }
    if (!JSON.parse(localStorage.getItem(MODES[2]))) {
      return
    }

    const pmd = JSON.parse(localStorage.getItem(MODES[0]))
    this.pmdHr = pmd.hours
    this.pmdMin = pmd.min
    const sBr = JSON.parse(localStorage.getItem(MODES[1]))
    this.sHr = sBr.hours
    this.sMin = sBr.min
    const lBr = JSON.parse(localStorage.getItem(MODES[2]))
    this.lHr = lBr.hours
    this.lMin = lBr.min
  },

  methods: {
    saveChanges() {
      this.pmdHr = parseInt(this.pmdHr)
      this.pmdMin = parseInt(this.pmdMin)
      this.sHr = parseInt(this.sHr)
      this.sMin = parseInt(this.sMin)
      this.lHr = parseInt(this.lHr)
      this.lMin = parseInt(this.lMin)
      const values = [
        this.pmdHr,
        this.pmdMin,
        this.sHr,
        this.sMin,
        this.lHr,
        this.lMin,
      ]

      for (let i = 0; i < values.length; i++) {
        if (isNaN(values[i])) {
          this.errorMsg = 'All values must be numbers.'
          return
        }

        if (values[i] < 0) {
          this.errorMsg = 'No values can be negative.'
          return
        }
      }

      if (this.pmdMin > 60 || this.sMin > 60 || this.lMin > 60) {
        this.errorMsg = 'Minute vales must be less than 60.'
        return
      }

      const pmd = { hours: this.pmdHr, min: this.pmdMin, secs: 0 }
      const sBr = { hours: this.sHr, min: this.sMin, secs: 0 }
      const lBr = { hours: this.lHr, min: this.lMin, secs: 0 }

      localStorage.setItem(MODES[0], JSON.stringify(pmd))
      localStorage.setItem(MODES[1], JSON.stringify(sBr))
      localStorage.setItem(MODES[2], JSON.stringify(lBr))

      this.errorMsg = ''
      this.$emit('update')
    },

    hideForm() {
      this.$emit('hide')
    },

    handleClick(event) {
      if (event.target === document.getElementById('form-bg')) {
        this.hideForm()
      }
    },
  },
}
</script>

<template>
  <div
    v-show="visible"
    id="form-bg"
    class="absolute inset-0 bg-black bg-opacity-25 flex justify-center items-center z-40"
    @click="handleClick"
  >
    <form
      class="bg-white px-6 py-8 rounded shadow-md text-black w-full border border-gray-100 max-w-lg mx-auto"
      @submit.prevent="saveChanges"
    >
      <h1 class="text-3xl font-semibold mb-8 text-center">Timer Settings</h1>

      <p
        v-show="errorMsg.length > 0"
        class="bg-red-300 text-red-900 py-2 my-2 text-center rounded-sm"
      >
        {{ errorMsg }}
      </p>

      <div class="mb-6 pb-6 border-b border-grey-light">
        <h2 class="text-2xl mb-2">Pomodoro</h2>
        <div class="flex">
          <div class="mr-4">
            <p class="text-sm">Hours</p>
            <input
              v-model="pmdHr"
              type="number"
              class="block border border-grey-light w-full p-1 rounded"
            />
          </div>
          <div>
            <p class="text-sm">Minutes</p>
            <input
              v-model="pmdMin"
              type="number"
              class="block border border-grey-light w-full p-1 rounded"
            />
          </div>
        </div>
      </div>

      <div class="mb-6 pb-6 border-b border-grey-light">
        <h2 class="text-2xl mb-2">Short Break</h2>
        <div class="flex">
          <div class="mr-4">
            <p class="text-sm">Hours</p>
            <input
              v-model="sHr"
              type="number"
              class="block border border-grey-light w-full p-1 rounded"
            />
          </div>
          <div>
            <p class="text-sm">Minutes</p>
            <input
              v-model="sMin"
              type="number"
              class="block border border-grey-light w-full p-1 rounded"
            />
          </div>
        </div>
      </div>

      <div class="mb-6 pb-6">
        <h2 class="text-2xl mb-2 leading-none">Long Break</h2>
        <div class="flex">
          <div class="mr-4">
            <p class="text-sm">Hours</p>
            <input
              v-model="lHr"
              type="number"
              class="block border border-grey-light w-full p-1 rounded"
            />
          </div>
          <div>
            <p class="text-sm">Minutes</p>
            <input
              v-model="lMin"
              type="number"
              class="block border border-grey-light w-full p-1 rounded"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        class="text-center p-3 w-40 rounded bg-red-500 text-white hover:bg-red-800 focus:outline-none mr-4"
      >
        Save Changes
      </button>

      <button
        type="button"
        class="text-center border w-40 p-3 rounded bg-white text-red-500 hover:text-red-800 hover:border-red-500"
        @click="hideForm"
      >
        Cancel
      </button>
    </form>
  </div>
</template>

<style></style>
