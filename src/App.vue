<template>
  <div id="app" style="display: flex; align-items: center; justify-content: center">
    <div>
      <mindmap 
        v-model="data"
        :height="700"
        :width="700"
        :draggable="draggable"
        :xSpacing="xSpacing"
        :ySpacing="ySpacing"
        :gps="gps"
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
    tdata: [{ name: '空白节点', children: [] }],
    data: [dataLearn],
    draggable: true,
    xSpacing: 80,
    ySpacing: 20,
    gps: true,
  }),
  mounted() {
    setTimeout(() => {
      
    }, 2000)
  }
}
</script>

<style>

</style>