<template>
  <v-app>
    <v-main>
      <v-container fluid class="fill-height">
        <v-card outlined class="fill-height" width="100%">
          <v-sheet class="fill-height">
            <v-row no-gutters class="fill-height">
              <v-col md="9" cols="12" class="d-flex flex-column">
                <div class="d-flex grey lighten-3">
                  <div class="d-flex px-3 title font-weight-regular align-center" 
                    style="height: 48px; width: 100%"
                  >
                    <v-btn icon href="https://github.com/hellowuxin/mindmap">
                      <v-icon>mdi-github</v-icon>
                    </v-btn>
                  </div>
                  <v-divider vertical></v-divider>
                </div>
                <v-divider></v-divider>
                <div class="d-flex flex-grow-1">
                  <mindmap
                    v-model="mmdata"  
                    :gps="options.gps.value"
                    :fitView="options.fitView.value"
                    :draggable="options.draggable.value"
                    :keyboard="options.keyboard.value"
                    :showNodeAdd="options.showNodeAdd.value"
                    :contextMenu="options.contextMenu.value"
                    :zoomable="options.zoomable.value"
                    :showUndo="options.showUndo.value"
                    :xSpacing="xSpacing"
                    :ySpacing="ySpacing"
                    :strokeWidth="strokeWidth"
                    :download="options.download.value"
                    @updateNodeName="updateNodeName"
                    @click="click"
                  ></mindmap>
                  <v-divider vertical></v-divider>
                </div>
              </v-col>
              <v-col md="3" cols="12">
                <div class="grey lighten-3">
                  <div class="d-flex px-3 title font-weight-regular align-center" 
                    style="height: 48px"
                  >Options</div>
                </div>
                <v-divider></v-divider>
                <div class="py-3">
                  <v-col class="pb-0" cols="12" v-for="(opt, key) in options" :key="key">
                    <v-switch class="mt-0" 
                      hide-details 
                      inset 
                      v-model="opt.value"
                      :label="key"
                    ></v-switch>
                  </v-col>
                  <v-col class="pb-0" cols="12">
                    <v-slider
                      hide-details 
                      v-model="strokeWidth"
                      label="strokeWidth"
                      :thumb-size="20"
                      thumb-label
                      min="1"
                      max="10"
                    ></v-slider>
                  </v-col>
                  <v-col class="pb-0" cols="12">
                    <v-slider
                      hide-details 
                      v-model="xSpacing"
                      label="xSpacing"
                      :thumb-size="20"
                      thumb-label
                    ></v-slider>
                  </v-col>
                  <v-col class="pb-0" cols="12">
                    <v-slider
                      hide-details 
                      v-model="ySpacing"
                      label="ySpacing"
                      :thumb-size="20"
                      thumb-label
                    ></v-slider>
                  </v-col>
                </div>
              </v-col>
            </v-row>
          </v-sheet>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import dataLearn from '../public/learn.json'
import mindmap from './components/MindMap.vue'

@Component({
  components: {
    mindmap
  }
})
export default class App extends Vue {
  showSource = false
  onboarding = 0
  length = 3
  mmdata = dataLearn
  items = [
    { title: 'template' },
    { title: 'script' }
  ]
  options = {
    gps: { value: true },
    fitView: { value: true },
    keyboard: { value: true },
    draggable: { value: true },
    showNodeAdd: { value: true },
    contextMenu: { value: true },
    zoomable: { value: true },
    showUndo: { value: true },
    download: { value: true },
  }
  xSpacing = 80
  ySpacing = 20
  strokeWidth = 4

  updateNodeName(...args: any) {
    console.log('updateNodeName', ...args)
  }
  click(...args: any) {
    console.log('click', ...args)
  }
  mounted() {}
}
</script>

<style>

</style>