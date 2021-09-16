<script>
import { registerUser } from '~/lib/api'
import lOverlay from '~/components/l-overlay.vue'

export default {
  name: 'SignUpPage',
  components: {
    lOverlay,
  },
  data() {
    return {
      username: '',
      password: '',
      confirm: '',
      errorMsg: '',
      loading: false,
    }
  },

  methods: {
    async submitForm() {
      this.username = this.username.trim()
      this.password = this.password.trim()
      this.confirm = this.confirm.trim()

      if (
        this.username.length === 0 ||
        this.password.length === 0 ||
        this.confirm.length === 0
      ) {
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

      if (this.password !== this.confirm) {
        this.errorMsg = "Password and confirmation don't match"
        return
      }

      this.loading = true
      try {
        const response = await registerUser(this.username, this.password)
        if (response.data.status !== 'ok') {
          this.errorMsg = response.data.error
        } else {
          this.$router.push('/')
        }
      } catch (err) {
        console.log(err)
        alert('Error registering user')
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
        class="bg-white px-6 py-8 rounded shadow-md text-black w-full"
        @submit.prevent="submitForm"
      >
        <h1 class="mb-8 text-3xl text-center">Sign up</h1>

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
        <input
          v-model="confirm"
          type="password"
          class="block border border-grey-light w-full p-3 rounded mb-4"
          name="confirm_password"
          placeholder="Confirm Password"
        />

        <button
          type="submit"
          class="w-full text-center py-3 rounded bg-red-500 text-white hover:bg-red-800 focus:outline-none my-1"
        >
          Sign up
        </button>
      </form>

      <div class="text-grey-dark mt-6">
        Already have an account?
        <nuxt-link
          to="/login"
          class="no-underline border-b border-blue text-red-300"
          href="../login/"
        >
          Log in </nuxt-link
        >.
      </div>
    </div>
  </div>
</template>
