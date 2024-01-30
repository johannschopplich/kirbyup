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
    this.label = response.label || "Demo Section"
  },
};
</script>

<template>
  <k-section :label="label">
    <k-text>
      <p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Quia sunt praesentium dolor fugiat officia rem corrupti alias veniam magni in doloribus nemo velit, et ut nostrum veritatis soluta, inventore nisi.</p>
    </k-text>
  </k-section>
</template>
