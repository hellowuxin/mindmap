<template>
  <svg class="outline"></svg>
</template>

<script>
import * as d3 from 'd3'

export default {
  props: {
    value: Object,
  },
  data: () => ({
    outline_svg: Object,
    outline_g_node: Object,
    outline_g_path: Object,
  }),
  watch: {
    value: {
        handler() {
          // eslint-disable-next-line
          console.log(1)
          this.drawOutline(this.value);
        },
        deep: true,// watch for nested data
    }
  },
  methods: {
    emit(event, params) {
      this.$emit(event, params);
    },
    updateNodeName() { // 文本编辑完成时
      const editP = document.querySelector('#editing p');
      window.getSelection().removeAllRanges();// 清除选中
      const editText = editP.textContent;
      d3.select('g#editing').each((d, i, n) => {
        n[i].removeAttribute('id');
        editP.setAttribute('contenteditable', false);
        d.data.name = editText;
      });
    },
    drawOutline(dJSON) {
      const { outline_g_node, outline_g_path } = this;
      const { updateNodeName, emit } = this;

      const nodeSize = { width: 200, height: 30 };
      function shapePath(d) {
        const x0 = d.source.x;
        const y0 = d.source.y;
        const x1 = d.target.x;
        const y1 = d.target.y;
        return `M${y0},${x0}V${x1 - 4}Q${y0} ${x1} ${y1} ${x1}`;
      }
      function clicked() {
        d3.event.stopPropagation();// 阻止捕获和冒泡阶段中当前事件的进一步传播。
        let sele = document.getElementById('selectedOutnode');
        const edit = document.getElementById('editing');
        const clickedNode = this;
        if (clickedNode.isSameNode(edit)) { // 正在编辑
          return;
        }
        if (clickedNode.isSameNode(sele)) { // 进入编辑状态
          sele.setAttribute('id', 'editing');
          d3.select(sele).select('p').attr('contenteditable', true);
          document.querySelector('#editing p').focus();
          document.execCommand('selectAll', false);
        } else { // 选中
          // 选中新的selectedOutnode
          if (sele) {
            sele.removeAttribute('id');
          }
          sele = d3.select(clickedNode);
          sele.attr('id', 'selectedOutnode');
          // 选中新的selectedMindnode
          sele.each((d) => {
            const { id } = d.data;
            const seleMind = d3.select('g#selectedMindnode');
            if (seleMind.nodes()[0]) {
              seleMind.attr('id', '');
            }
            emit('selectedNode', id);
          });
        }
      }
      function appendNode(enter) {
        const gEnter = enter.append('g')
          .attr('class', 'outnode')
          .attr('transform', (d) => `translate(0,${d.x})`)
          .on('click', clicked);
        gEnter.append('rect')
          .attr('width', nodeSize.width)
          .attr('height', nodeSize.height);
        const gap = 21;
        const foreign = gEnter.append('foreignObject')
          .attr('width', (d) => (nodeSize.width - d.y - gap))
          .attr('height', nodeSize.height)
          .attr('transform', (d) => `translate(${d.y + gap},${0})`);
        const foreignP = foreign.append('xhtml:p')
          .attr('contenteditable', false)
          .text((d) => d.data.name);
        // 编辑完成时
        foreignP.on('blur', updateNodeName);
      }
      function updateNode(update) {
        update.attr('transform', (d) => `translate(0,${d.x})`);
        update.select('p').text((d) => d.data.name);
      }
      function appendPath(enter) {
        enter.append('path').attr('d', shapePath)
          .attr('stroke', (d) => (d.target.data.color));
      }
      function updatePath(update) {
        update.attr('d', shapePath).attr('stroke', (d) => (d.target.data.color));
      }
      function draw(r) {
        let index = 0;
        r.eachBefore((n) => { // 深度优先遍历
          n.x = index * (nodeSize.height + 1);
          n.y = n.depth * 8;
          index += 1;
        });
        const rDescendants = r.descendants();
        outline_g_node.selectAll('g')
          .data(rDescendants)
          .join(
            (enter) => appendNode(enter),
            (update) => updateNode(update),
          );
        outline_g_path.selectAll('path')
          .data(r.links())
          .join(
            (enter) => appendPath(enter),
            (update) => updatePath(update),
          );
      }
      if (dJSON) {
        draw(d3.hierarchy(dJSON.data[0]));
      }
    },
  },
  mounted() {
    this.outline_svg = d3.select('svg.outline');
    this.outline_g_node = this.outline_svg.append('g').attr('class', 'outnodes');
    this.outline_g_path = this.outline_svg.append('g').attr('class', 'outpath');
  }
}
</script>

<style lang="scss">
.outline {
  height: 650px;
  margin-right: 8px;
  width: 200px;

  rect {
    fill: rgb(238, 238, 243);
  }

  .outpath {
    transform: translate(14px, 15px);

    path {
      fill: none;
      stroke-linecap: round;
      stroke-width: 1.5;
    }
  }

  #selectedOutnode > rect {
    fill: rgb(204, 211, 253);
  }
}
</style>