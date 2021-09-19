<template>
  <div class="container mx-auto lg:w-3/4 p-5 text-gray-900">
    <h1 class="font-semibold text-3xl my-8">Help and About the Timer</h1>

    <div class="h-40 md:h-48 lg:h-64 flex justify-center mt-2 mb-4">
      <img
        src="~/assets/my-pmd-timer.jpg"
        alt="Screenshot of the application"
        class="h-full"
      />
    </div>

    <h2 class="text-xl font-medium mb-2">What is the Timer?</h2>
    <p class="mb-6">
      The Tomato Timer is an online productivity tool based off two ideas:
      <a
        href="https://francescocirillo.com/pages/pomodoro-technique"
        class="text-red-500"
        >The Pomodoro Technique</a
      >
      and
      <a
        href="https://sethroberts.net/2011/05/01/percentile-feedback-and-productivity/"
        class="text-red-500"
        >Percentile Feedback</a
      >, and it's job is to boost work efficiency and motivation
    </p>

    <h2 class="text-xl font-medium mb-2">How do I use it?</h2>
    <p class="mb-2">
      When you want to begin work on a task, start the timer in Pomodoro mode.
      The default length is 25 minutes, but you can customize that with the
      settings panel(click the gear icon in the top right).
    </p>
    <p class="mb-6">
      When the time elapses, the timer will send a browser notification to alert
      you, at which point, you take a break, and repeat the cycle till your work
      is done.
    </p>

    <h2 class="text-xl font-medium mb-2">What's up with the graph?</h2>
    <p class="mb-2">
      Tomato Timer keeps a record of how much work you do and when you do it,
      and displays it on the graph
    </p>
    <p class="mb-6">
      The graph has 3 lines: one for the work you've done today, one for the
      average of all work you've done with the timer(per day) and one for the
      day where you've done the most work so far
    </p>

    <h2 class="text-xl font-medium mb-2">What's the Percentile Score?</h2>
    <p class="mb-12">
      It's how much work you've done today as a percentage of your total average
      work. For example, if you have a percentile score of 50, you've done 50%
      of your total average work today.
    </p>

    <footer class="fixed bottom-0 left-0 py-4 flex justify-center w-full">
      <button
        class="py-2 px-4 bg-red-700 rounded hover:bg-white border hover:text-red-700 border-red-700 text-white"
      >
        <nuxt-link to="/">Use the Timer!</nuxt-link>
      </button>
    </footer>
  </div>
</template>

<script>
export default {}
</script>
