<script>
import SectionMixin from "../mixins/section.js";

export default {
  mixins: [SectionMixin],

  data() {
    return {
      label: undefined,
    };
  },

  async created() {
    const response = await this.load();
    this.label = response.label || "Tailwind Section"
  },
};
</script>

<template>
  <k-section :label="label">
    <div
      class="rounded-xl border border-solid border-gray-600 p-1"
    >
      Styled by Tailwind CSS
    </div>
  </k-section>
</template>
