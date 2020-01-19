<template>
  <div>
    <!-- <v-row class="mx-12">
      <v-col cols="3">
        <v-btn width="200" height="200" @click="addMindMap()">
          <v-icon x-large>mdi-plus</v-icon>
        </v-btn>
      </v-col>
    </v-row> -->
    <mind-map></mind-map>
  </div>
</template>

<script>
import MindMap from './MindMap'
export default {
  components: {
    MindMap,
  },
  methods: {
    addMindMap() {
      
    }
  }
}
</script>

<style>

</style>