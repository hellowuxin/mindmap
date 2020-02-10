<template>
  <v-app>
    <v-app-bar app>
      <v-app-bar-nav-icon></v-app-bar-nav-icon>
      <v-toolbar-title>d3-网页思维导图</v-toolbar-title>
    </v-app-bar>

    <v-content>
      <v-container fluid>
        <mindmap
          v-model="data"
        ></mindmap>
      </v-container>
    </v-content>

    <v-footer app>
    </v-footer>
  </v-app>
</template>

<script>
import dataLearn from '../public/learn.json'
import mindmap from './index'
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