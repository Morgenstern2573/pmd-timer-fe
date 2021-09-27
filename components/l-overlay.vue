<script>
export default {
  name: 'LoadingOverlay',
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
  },
}
</script>

<template>
  <div
    v-show="visible"
    class="absolute inset-0 h-full bg-black bg-opacity-25 flex justify-center items-center z-50"
  >
    <div
      class="h-16 w-16 border-4 rounded-full border-black animate-spin"
      style="border-top: 4px white solid"
    ></div>
  </div>
</template>

<style></style>
