<template>
  <div id="app" style="height: 700px">
    <!-- <mindmap 
      v-model="data"
    ></mindmap> -->
    <test v-model="data"></test>
  </div>
</template>

<script>
import dataLearn from '../public/learn.json'
// import mindmap from './index'
import test from './components/Test'
export default {
  components: {
    test
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