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
    <div class="demo-lg:p-4 demo-rounded-xl demo-bg-gray-600 demo-p-1">
      Styled by UnoCSS
    </div>
  </k-field>
</template>
