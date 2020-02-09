<template>
  <div>
    <!-- <mind-node v-model="data"></mind-node> -->
    <mindmap
      v-model="data"
    ></mindmap>
  </div>
</template>

<script>
import dataLearn from '../../public/learn.json'
// import MindNode from './MindNode'
import mindmap from '../components/MindMap'
export default {
  components: {
    // MindNode,
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