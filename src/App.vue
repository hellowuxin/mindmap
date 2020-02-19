<template>
  <div id="app" style="width: 1000px; height: 1000px; display: flex; align-items: center; justify-content: center">
    <div>
      <mindmap 
        v-model="data"
        :height="700"
        :width="700"
      ></mindmap>
    </div>
  </div>
</template>

<script>
import dataLearn from '../public/learn.json'
import mindmap from './components/MindMap'
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