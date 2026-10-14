<script>
export default {
  props: {
    label: String,
    help: String,
  },
}
</script>

<template>
  <k-field :label="label" :help="help">
    <k-text>
      <p>
        Lorem ipsum dolor sit amet consectetur, adipisicing elit. Quia sunt
        praesentium dolor fugiat officia rem corrupti alias veniam magni in
        doloribus nemo velit, et ut nostrum veritatis soluta, inventore nisi.
      </p>
    </k-text>
  </k-field>
</template>
