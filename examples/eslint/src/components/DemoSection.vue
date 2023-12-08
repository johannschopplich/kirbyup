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
  <k-section :headline="label">
    <k-box>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Quia sunt praesentium dolor fugiat officia rem corrupti alias veniam magni in doloribus nemo velit, et ut nostrum veritatis soluta, inventore nisi.</k-box>
  </k-section>
</template>
