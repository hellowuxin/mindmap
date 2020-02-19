<template>
  <div id="app" style="height: 700px; display: flex; align-items: center;">
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
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  display: flex;
  align-content: center;
  justify-content: center;
}
</style>