<script>
export default {
  data() {
    return {
      label: undefined,
    };
  },

  async created() {
    // `load` is provided by Kirby in section components
    const response = await this.load();
    this.label = response.label || "Tailwind Section";
  },
};
</script>

<template>
  <k-section :label="label">
    <div class="rounded-xl bg-gray-600 p-1">Styled by Tailwind CSS</div>
  </k-section>
</template>
