<script>
import { loginUser } from '~/lib/api'
import lOverlay from '~/components/l-overlay.vue'

export default {
  name: 'LogInPage',
  components: {
    lOverlay,
  },
  data() {
    return {
      username: '',
      password: '',
      errorMsg: '',
      loading: false,
    }
  },

  methods: {
    async submitForm() {
      this.username = this.username.trim()
      this.password = this.password.trim()
      if (this.username.length === 0 || this.password.length === 0) {
        this.errorMsg = 'No fields can be empty!'
        return
      }

      if (this.username.length < 2) {
        this.errorMsg = 'Username must be 2 characters or longer'
        return
      }

      if (this.password.length < 4) {
        this.errorMsg = 'Password must be 4 characters or longer'
        return
      }

      this.loading = true
      try {
        const response = await loginUser(this.username, this.password)
        if (response.data.status !== 'ok') {
          this.errorMsg = response.data.error
        } else {
          localStorage.setItem('token', response.data.token)
          this.$router.push('/')
        }
      } catch (err) {
        console.log(err)
        alert('Error Logging In user')
      }
      this.loading = false
    },
  },
}
</script>
<template>
  <div class="bg-grey-lighter min-h-screen flex flex-col">
    <l-overlay :visible="loading"></l-overlay>
    <div
      class="container max-w-sm mx-auto flex-1 flex flex-col items-center justify-center px-2"
    >
      <form
        class="bg-white px-6 py-8 rounded shadow-md text-black w-full border border-gray-100"
        @submit.prevent="submitForm"
      >
        <h1 class="mb-8 text-3xl text-center leading-none">Log In</h1>

        <p
          v-show="errorMsg.length > 0"
          class="bg-red-300 text-red-900 py-2 my-2 text-center rounded-sm"
        >
          {{ errorMsg }}
        </p>

        <input
          v-model="username"
          type="text"
          class="block border border-grey-light w-full p-3 rounded mb-4"
          name="username"
          placeholder="Username"
        />

        <!-- <input
          type="text"
          class="block border border-grey-light w-full p-3 rounded mb-4"
          name="email"
          placeholder="Email"
        /> -->

        <input
          v-model="password"
          type="password"
          class="block border border-grey-light w-full p-3 rounded mb-4"
          name="password"
          placeholder="Password"
        />

        <button
          type="submit"
          class="w-full text-center py-3 rounded bg-red-500 text-white hover:bg-red-800 focus:outline-none my-1"
        >
          Log In
        </button>
      </form>

      <div class="text-grey-dark mt-6">
        Don't have an account?
        <nuxt-link
          to="/signup"
          class="no-underline border-b border-blue text-red-300"
        >
          Register </nuxt-link
        >.
      </div>
    </div>
  </div>
</template>
