<template>
  <div>
    <!-- <v-row class="mx-12">
      <v-col cols="3">
        <v-btn width="200" height="200" @click="addMindMap()">
          <v-icon x-large>mdi-plus</v-icon>
        </v-btn>
      </v-col>
    </v-row> -->
    <mind-node v-model="data"></mind-node>
  </div>
</template>

<script>
import dataLearn from '../../public/learn.json'
import MindNode from './MindNode'
export default {
  components: {
    MindNode,
  },
  data: () => ({
    data: dataLearn,
  }),
  methods: {
    addMindMap() {
      
    }
  }
}
</script>

<style>

</style>