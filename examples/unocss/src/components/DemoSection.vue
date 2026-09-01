<script>
export default {
  data() {
    return {
      label: undefined,
    }
  },

  async created() {
    // `load` is provided by Kirby in section components
    const response = await this.load()
    this.label = response.label || 'UnoCSS Section'
  },
}
</script>

<template>
  <k-section :label="label">
    <div class="demo-lg:p-4 demo-rounded-xl demo-bg-gray-600 demo-p-1">
      Styled by UnoCSS
    </div>
  </k-section>
</template>
