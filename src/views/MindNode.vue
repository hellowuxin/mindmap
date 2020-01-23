<template>
  <div class="wrapper">
    <outline 
      v-model="mindnode_data"
      @selectedOutNode="getSelectedNode"
    ></outline>
    <mindmap
      v-model="mindnode_data"
    ></mindmap>
    <svg class="tip">
      <g id="hotkey"></g>
      <g id="hidden"></g>
    </svg>
  </div>
</template>

<script>
// 移除键盘监听，通过鼠标操作思维导图
import JSONData from '../JSONData'
import * as d3 from 'd3'
import outline from '../components/Outline'
import mindmap from '../components/MindMap'

export default {
  components: {
    outline,
    mindmap,
  },
  props: {
    value: Array,
  },
  data: () => ({
    mindnode_data: null,
    selectedNode: null,
    hidden_g: Object,
    hotkey_g: Object,
  }),
  methods: {
    getSelectedNode(d) {
      this.selectedNode = d;
    },
    drawHotkey() {
      const { hotkey_g } = this;
      hotkey_g.append('text').text('选中状态下：').attr('transform', 'translate(0, 20)');
      hotkey_g.append('text').text('Tab添加子节点').attr('transform', 'translate(20, 40)');
      hotkey_g.append('text').text('Enter添加弟弟节点').attr('transform', 'translate(20, 60)');
      hotkey_g.append('text').text('Backspace/delete删除节点').attr('transform', 'translate(20, 80)');
      hotkey_g.append('text').text('单击编辑节点').attr('transform', 'translate(20, 100)');
    },
    depthTraverse(d, func) { // 深度遍历，func每个元素
      func(d);
      if (d.children) {
        for (let index = 0; index < d.children.length; index += 1) {
          const dChild = d.children[index];
          this.depthTraverse(dChild, func);
        }
      }
    },
    drawHiddenText(d) { // 取得textWidth
      const text = this.hidden_g.append('text').text(d.name).nodes()[0];
      d.textWidth = text.getBBox().width;
    },
    listenKeyDown(event) {
      const { mindnode_data, mindmap_g } = this;
      const { drawHiddenText } = this;
      const sele = d3.select('#selectedMindnode');
      if (!sele.nodes()[0]) {
        return;
      }
      const newJSON = { name: '新建节点', children: [] };
      const keyName = event.key;
      if (keyName === 'Tab') { // 添加子节点
        event.preventDefault();
        sele.each((d) => {
          drawHiddenText(newJSON);
          mindnode_data.add(d.data, newJSON);
        });
      } else if (keyName === 'Enter') { // 添加弟弟节点
        event.preventDefault();
        sele.each((d, i, n) => {
          drawHiddenText(newJSON);
          if (n[i].parentNode.isSameNode(mindmap_g.nodes()[0])) { // 根节点enter时，等效tab
            mindnode_data.add(d.data, newJSON);
          } else {
            mindnode_data.insert(d.data, newJSON, 1);
          }
        });
      } else if (keyName === 'Backspace') { // 删除节点
        event.preventDefault();
        sele.each((d) => {
          mindnode_data.del(d.data);
        });
      }
    },
    init() {
      const { mindnode_data } = this;
      const { drawHiddenText, listenKeyDown, depthTraverse } = this;

      document.addEventListener('keydown', listenKeyDown);
      depthTraverse(mindnode_data.data[0], drawHiddenText);
    }
  },
  mounted() {
    // 初始化
    this.mindnode_data = new JSONData(this.value);
    this.hotkey_g = d3.select('g#hotkey');
    this.hidden_g = d3.select('g#hidden');
    
    this.drawHotkey();
    this.init();
  }
}
</script>

<style lang="scss">
.wrapper {
  display: flex;
  margin: 8px;
  p {
    margin: 0;
  }
}

$fontColor: rgb(76, 85, 102);

body {
  color: $fontColor;
  font-family: sans-serif;
}

.wrapper {
  display: flex;
  margin: 8px;
}

svg {
  font-size: 14px;
}

.tip {
  background-color: rgb(238, 238, 243);
  height: 120px;
  width: 200px;

  text {
    fill: $fontColor;
  }

  #hidden {
    visibility: hidden;
  }
}

foreignObject {
  padding: 5px;
}

</style>