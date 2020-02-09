<template>
  <div>
    <mindmap
      v-model="data"
    ></mindmap>
  </div>
</template>

<script>
import dataLearn from '../../public/learn.json'
import mindmap from '../components/MindMap'
export default {
  components: {
    mindmap
  },
  data: () => ({
    data: [dataLearn],
  }),
  methods: {
  }
}
</script>

<style>

</style>