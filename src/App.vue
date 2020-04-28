<template>
  <v-app>
    <v-content>
      <v-container fluid>
        <v-card outlined>
          <!-- <v-toolbar class="grey lighten-3" flat dense>
            <v-spacer></v-spacer>
            <v-btn icon href="https://github.com/hellowuxin/mindmap" target="_blank">
              <v-icon>mdi-github-circle</v-icon>
            </v-btn>
            <v-btn icon disabled @click="showSource = !showSource">
              <v-icon>mdi-code-tags</v-icon>
            </v-btn>
          </v-toolbar>
          <v-expand-transition>
            <v-card flat dark tile
              v-show="showSource"
            >
              <v-item-group
                v-model="onboarding"
                class="pa-2"
                mandatory
              >
                <v-item
                  v-for="(item, index) in items"
                  :key="index"
                  v-slot:default="{ active, toggle }"
                >
                  <v-btn rounded
                    class="mr-2"
                    :input-value="active"
                    @click="toggle"
                  >
                    {{ item.title }}
                  </v-btn>
                </v-item>
              </v-item-group>
              <v-divider></v-divider>
              <v-window v-model="onboarding">
                <v-window-item
                  v-for="n in length"
                  :key="`card-${n}`"
                >
                  <pre class="pa-5"><code>str</code></pre>
                </v-window-item>
              </v-window>
            </v-card>
          </v-expand-transition> -->
          <v-sheet>
            <v-row no-gutters>
              <v-col md="9" cols="12">
                <div class="d-flex grey lighten-3">
                  <div class="d-flex px-3 title font-weight-regular align-center" 
                    style="height: 48px; width: 100%"
                  ></div>
                  <v-divider vertical></v-divider>
                </div>
                <v-divider></v-divider>
                <div class="d-flex">
                  <mindmap
                    v-model="mmdata"
                    :height="500"
                    :gps="options.gps.value"
                    :fitView="options.fitView.value"
                    :draggable="options.draggable.value"
                    :keyboard="options.keyboard.value"
                    :showNodeAdd="options.showNodeAdd.value"
                    :contextMenu="options.contextMenu.value"
                    :nodeClick="options.nodeClick.value"
                    :zoomable="options.zoomable.value"
                    :xSpacing="xSpacing"
                    :ySpacing="ySpacing"
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
    </v-content>
  </v-app>
</template>

<script>
import dataLearn from '../public/learn.json'
import mindmap from './components/MindMap'

export default {
  components: {
    mindmap
  },
  data: () => ({
    showSource: false,
    onboarding: 0,
    length: 3,
    mmdata: dataLearn,
    items: [
      { title: 'template' },
      { title: 'script' }
    ],
    options: {
      gps: { value: true },
      fitView: { value: true },
      keyboard: { value: true },
      draggable: { value: true },
      showNodeAdd: { value: true },
      contextMenu: { value: true },
      nodeClick: { value: true },
      zoomable: { value: true },
    },
    xSpacing: 80,
    ySpacing: 20,
  }),
  mounted() {
  }
}
</script>

<style>

</style>