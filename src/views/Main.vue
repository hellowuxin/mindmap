<template>
  <div>
    <!-- <v-row class="mx-12">
      <v-col cols="3">
        <v-btn width="200" height="200" @click="addMindMap()">
          <v-icon x-large>mdi-plus</v-icon>
        </v-btn>
      </v-col>
    </v-row> -->
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
    addMindMap() {
      
    }
  }
}
</script>

<style>

</style>