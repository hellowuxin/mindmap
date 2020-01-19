<template>
  <div>
    <!-- <v-row class="mx-12">
      <v-col cols="3">
        <v-btn width="200" height="200" @click="addMindMap()">
          <v-icon x-large>mdi-plus</v-icon>
        </v-btn>
      </v-col>
    </v-row> -->
    <mind-map :data="data"></mind-map>
  </div>
</template>

<script>
import dataLearn from '../../public/learn.json'
import MindMap from './MindMap'
export default {
  components: {
    MindMap,
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