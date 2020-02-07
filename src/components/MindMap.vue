<template>
  <svg class="mindmap">
    <g id="mindmapRoot"></g>
    <g id="dummy"></g>
  </svg>
</template>

<script>
import * as d3 from 'd3'

export default {
  props: {
    value: Object,
  },
  data: () => ({
    mindmap_svg: Object,
    mindmap_g: Object,
    dummy_g: Object,
    mindmapSvgZoom: Function,
    easePolyInOut: d3.transition().duration(1000).ease(d3.easePolyInOut),
  }),
  watch: {
    value: {
      handler(newVal) {
        this.depthTraverse(newVal.data[0], this.getTextWidth);
        this.drawMindnode(newVal);
      },
      deep: true,// watch for nested data
    },
  },
  methods: {
    depthTraverse(d, func) { // 深度遍历，func每个元素
      func(d);
      if (d.children) {
        for (let index = 0; index < d.children.length; index += 1) {
          const dChild = d.children[index];
          this.depthTraverse(dChild, func);
        }
      }
    },
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
    drawMindnode(dJSON) {
      const { mindmap_g, easePolyInOut } = this;
      const { updateNodeName } = this;

      let root = null;
      const link = d3.linkHorizontal().x((d) => d[0]).y((d) => d[1]);
      function rectTriggerOver() {
        // // eslint-disable-next-line 
        // console.log(1);
      }
      function rectTriggerOut() {
        // // eslint-disable-next-line 
        // console.log(2);
      }
      function draggedNodeRenew(draggedNode, targetX, targetY, dura) {
        const tran = d3.transition().duration(dura).ease(d3.easePoly);
        d3.select(draggedNode).transition(tran).attr('transform', `translate(${targetY},${targetX})`);
        // 更新draggedNode与父节点的path
        d3.select(draggedNode).each((d) => {
          d3.select(`path#path_${d.data.id}`).transition(tran).attr('d', `${link({
            source: [-targetY + (d.parent ? d.parent.data.textWidth : 0), -targetX],
            target: [0, 0],
          })}L${d.data.textWidth},0`);
        });
      }
      function draggedNodeChildrenRenew(d, px, py) {
        d.px = px;
        d.py = py;
        if (d.children) {
          for (let index = 0; index < d.children.length; index += 1) {
            const dChild = d.children[index];
            draggedNodeChildrenRenew(dChild, px, py);
          }
        }
      }
      function dragback(subject, draggedNode) {
        draggedNodeChildrenRenew(subject, 0, 0);
        draggedNodeRenew(draggedNode, subject.dx, subject.dy, 1000);
      }
      function clicked() {
        d3.event.stopPropagation();// 阻止捕获和冒泡阶段中当前事件的进一步传播。
        let sele = document.getElementById('selectedMindnode');
        const edit = document.getElementById('editing');
        const clickedNode = this;
        if (clickedNode.isSameNode(edit)) { // 正在编辑
          return;
        }
        if (clickedNode.isSameNode(sele)) { // 进入编辑状态
          sele.setAttribute('id', 'editing');
          d3.select(sele).select('p').attr('contenteditable', true);
          document.querySelector('#editing p').focus();
          document.execCommand('selectAll', false, null);
        } else { // 选中
          // 选中新的selectedMindnode
          if (sele) {
            sele.removeAttribute('id');
          }
          sele = d3.select(clickedNode);
          sele.attr('id', 'selectedMindnode');
        }
      }
      function dragged() {
        const draggedNode = this;
        // 选中
        const sele = document.getElementById('selectedMindnode');
        if (sele && !sele.isSameNode(draggedNode)) {
          sele.removeAttribute('id');
        }
        // 拖拽
        const { subject } = d3.event;
        const py = d3.event.x - subject.x;
        const px = d3.event.y - subject.y;
        draggedNodeChildrenRenew(subject, px, py);
        // 相对subject.parent的坐标
        const targetY = subject.dy + py;
        const targetX = subject.dx + px;
        draggedNodeRenew(draggedNode, targetX, targetY, 0);
        // 重叠触发矩形边框
        const gSelection = mindmap_g.selectAll('g').filter((d, i, n) => !draggedNode.isSameNode(n[i]) && !draggedNode.parentNode.isSameNode(n[i]));
        gSelection.each((d, i, n) => {
          const gNode = n[i];
          const gRect = gNode.getElementsByTagName('rect')[0];
          const rect = { // 各个gRect相对subject.parent的坐标，以及gRect的宽高
            y: parseInt(gRect.getAttribute('x'), 10) + d.y + (d.py ? d.py : 0) - (subject.parent ? subject.parent.y : 0),
            x: parseInt(gRect.getAttribute('y'), 10) + d.x + (d.px ? d.px : 0) - (subject.parent ? subject.parent.x : 0),
            width: parseInt(gRect.getAttribute('width'), 10),
            height: parseInt(gRect.getAttribute('height'), 10),
          };
          if ((targetY > rect.y) && (targetY < rect.y + rect.width)
          && (targetX > rect.x) && (targetX < rect.x + rect.height)) {
            gNode.setAttribute('id', 'newParentNode');
          } else if (gNode.getAttribute('id') === 'newParentNode') {
            gNode.removeAttribute('id');
          }
        });
      }
      function dragended() {
        const { subject } = d3.event;
        const draggedNode = this;
        let draggedParentNode = draggedNode.parentNode;
        if (draggedParentNode.isEqualNode(mindmap_g.nodes()[0])) { // 拖拽的是根节点时复原
          dragback(subject, draggedNode);
          return;
        }
        const newParentNode = document.getElementById('newParentNode');
        if (newParentNode) { // 建立新的父子关系
          newParentNode.removeAttribute('id');
          d3.select(draggedNode).each((draggedD) => {
            d3.select(newParentNode).each((newParentD) => {
              // 处理数据
              dJSON.del(draggedD.data);
              dJSON.add(newParentD.data, draggedD.data);
              draggedNode.parentNode.removeChild(draggedNode);
              // 绘制图形
              chart(dJSON);
            });
          });
          return;
        }
        if (Math.abs(subject.px) < root.nodeHeight) { // 平移距离不足以调换兄弟节点顺序时复原
          dragback(subject, draggedNode);
          return;
        }
        // 调换兄弟节点顺序
        draggedParentNode = d3.select(draggedParentNode);
        draggedParentNode.each((d) => {
          const draggedBrotherNodes = draggedParentNode.selectAll(`g.depth_${d.depth + 1}`).filter((a, i, n) => !draggedNode.isSameNode(n[i]));
          if (!draggedBrotherNodes.nodes()[0]) { // 无兄弟节点时复原
            dragback(subject, draggedNode);
            return;
          }
          const a = { x0: Infinity, x1: -Infinity };
          draggedBrotherNodes.each((b, i, n) => {
            if (b.x > subject.x && b.x > a.x1 && b.x < (subject.x + subject.px)) { // 新哥哥节点
              a.x1 = b.x;
              a.b1 = b.data;
              a.n1 = n[i];
            }
            if (b.x < subject.x && b.x < a.x0 && b.x > (subject.x + subject.px)) { // 新弟弟节点
              a.x0 = b.x;
              a.b0 = b.data;
              a.n0 = n[i];
            }
          });
          if (a.b0 || a.b1) { // 存在新兄弟节点时调换节点顺序
            dJSON.del(subject.data);
            if (a.b0) { // 插入在兄弟节点前面
              dJSON.insert(a.b0, subject.data);
              draggedNode.parentNode.insertBefore(draggedNode, a.n0);
            } else if (a.b1) { // 插入在兄弟节点后面
              dJSON.insert(a.b1, subject.data, 1);
              draggedNode.parentNode.insertBefore(draggedNode, a.n1.nextSibling);
            }
            chart(dJSON);
          } else {
            dragback(subject, draggedNode);
          }
        });
      }
      function appendNode(enter) {
        const gNode = enter.append('g');
        gNode.attr('class', (d) => `depth_${d.depth}`)
          .attr('transform', (d) => `translate(${d.dy},${d.dx})`);
        const foreign = gNode.append('foreignObject')
          .attr('width', (d) => d.data.textWidth + 11)
          .attr('height', 30)
          .attr('transform', `translate(${-5},${-27})`);
        const foreignP = foreign.append('xhtml:p')
          .attr('contenteditable', false)
          .text((d) => d.data.name);
        foreignP.on('blur', updateNodeName);
        const rect = gNode.append('rect').attr('class', (d) => `depth_${d.depth} textRect`)
          .attr('y', -17 - 4)
          .attr('x', -4)
          .attr('width', (d) => d.data.textWidth + 8)
          .attr('height', 16 + 8)
          .attr('rx', 3)
          .attr('ry', 3)
          .lower();
        gNode.append('rect').attr('class', (d) => `depth_${d.depth} rectTrigger`)
          .attr('y', -17 - 8)
          .attr('x', -8)
          .attr('width', (d) => d.data.textWidth + 16)
          .attr('height', 16 + 16)
          .attr('opacity', 0)
          .on("mouseover", rectTriggerOver)
          .on("mouseout", rectTriggerOut);
        const rectBtn = gNode.append('rect').attr('class', (d) => `depth_${d.depth} rectButton`)
          .attr('y', -9)
          .attr('x', (d) => d.data.textWidth + 8)
          .attr('width', 16)
          .attr('height', 16);
        
        const enterData = enter.data();
        if (enterData.length) {
          if (enterData[0].data.id !== '0') {
            gNode.append('path')
              .attr('id', (d) => `path_${d.data.id}`)
              .attr('class', (d) => `depth_${d.depth}`)
              .lower()
              .attr('stroke', (d) => d.data.color)
              .attr('d', (d) => `${link({
                source: [
                  (d.parent ? d.parent.y + d.parent.data.textWidth : 0) - d.y,
                  (d.parent ? d.parent.x : 0) - d.x,
                ],
                target: [0, 0],
              })}L${d.data.textWidth},0`);
          } else if (enterData[0].data.id === '0') { // 根节点
            foreign.attr('transform', `translate(${-10},${-15})`);
            rect.attr('y', -9 - 4).attr('x', -5 - 4);
          }

          gNode.each((d, i) => {
            const dd = d.children;

            if (dd) {
              const gChildren = gNode.filter((a, index) => {
                return i === index
              }).selectAll(`g${dd[0] ? `.depth_${dd[0].depth}` : ''}`)
                .data(dd)
                .join(
                  (enter) => appendNode(enter),
                  (update) => updateNode(update),
                  (exit) => exitNode(exit)
                );
              gChildren.on('click', clicked);
              if (!dd[0] || dd[0].depth !== 0) { // 非根节点才可以拖拽
                gChildren.call(d3.drag().on('drag', dragged).on('end', dragended));
              }
            }
          });
        }

        rectBtn.raise();
        return gNode;
      }
      function updateNode(update) {
        update.attr('class', (d) => `depth_${d.depth}`)
          .transition(easePolyInOut)
          .attr('transform', (d) => `translate(${d.dy},${d.dx})`);
        update.each((d, i, n) => {
          const node = d3.select(n[i]);
          node.select('foreignObject').attr('width', d.data.textWidth + 11);
          node.select('p').text(d.data.name);
          node.select('rect.textRect').attr('class', `depth_${d.depth} textRect`)
            .attr('width', d.data.textWidth + 8);
          node.select('rect.rectTrigger').attr('class', `depth_${d.depth} rectTrigger`)
            .attr('width', (d) => d.data.textWidth + 16)
          node.select('path')
            .attr('id', `path_${d.data.id}`)
            .attr('class', `depth_${d.depth}`)
            .attr('stroke', d.data.color)
            .transition(easePolyInOut)
            .attr('d', `${link({
              source: [
                (d.parent ? d.parent.y + d.parent.data.textWidth : 0) - d.y,
                (d.parent ? d.parent.x : 0) - d.x,
              ],
              target: [0, 0],
            })}L${d.data.textWidth},0`);
          
          node.each((d, i) => {
            const dd = d.children;
            
            if (dd) {
              const gChildren = node.filter((a, index) => {
                return i === index
              }).selectAll(`g${dd[0] ? `.depth_${dd[0].depth}` : ''}`)
                .data(dd)
                .join(
                  (enter) => appendNode(enter),
                  (update) => updateNode(update),
                  (exit) => exitNode(exit)
                );
              gChildren.on('click', clicked);
              if (!dd[0] || dd[0].depth !== 0) { // 非根节点才可以拖拽
                gChildren.call(d3.drag().on('drag', dragged).on('end', dragended));
              }
            }
          });
          
          node.selectAll('rect.rectButton')
            .filter((d, i, n) => n[i].parentNode === node.node())
            .attr('class', `depth_${d.depth} rectButton`)
            .attr('x', d.data.textWidth + 8)
            .raise();
        });
        return update;
      }
      function exitNode(exit) {
        exit.remove();
      }
      function gNodeNest(d, gParent) {
        const gChildren = gParent.selectAll(`g${d[0] ? `.depth_${d[0].depth}` : ''}`)
          .data(d)
          .join(
            (enter) => appendNode(enter),
            (update) => updateNode(update),
            (exit) => exitNode(exit)
          );
        gChildren.on('click', clicked);
        if (!d[0] || d[0].depth !== 0) { // 非根节点才可以拖拽
          gChildren.call(d3.drag().on('drag', dragged).on('end', dragended));
        }
      }
      function renewY(r, textWidth) {
        r.y += textWidth;
        if (r.children) {
          for (let index = 0; index < r.children.length; index += 1) {
            const rChild = r.children[index];
            renewY(rChild, textWidth + r.data.textWidth);
          }
        }
      }
      function chart(d) {
        const r = d3.hierarchy(d.data[0]);// 根据指定的分层数据构造根节点
        r.nodeHeight = 35;
        r.nodeWidth = 100;// r.height与叶子节点的最大距离
        // nodeSize设置了节点的大小（高宽)
        // 高指两个叶子节点的纵向距离，宽指两个节点的横向距离
        root = d3.tree().nodeSize([r.nodeHeight, r.nodeWidth])(r);
        let x0 = Infinity;
        let x1 = -x0;
        renewY(root, 0);
        root.each((a) => {
          if (a.x > x1) x1 = a.x;// 求得最大，即最低点
          if (a.x < x0) x0 = a.x;// 求得最小，即最高点
        });
        root.each((a) => {
          // 处理偏移量确保图像完全显示
          a.x -= (x0 - 30);
          a.y += 15;
          // 相对偏移
          a.dx = a.x - (a.parent ? a.parent.x : 0);
          a.dy = a.y - (a.parent ? a.parent.y : 0);

          if (!a.children) {
            a.children = [];
          }
        });
        gNodeNest([root], mindmap_g);
      }
      chart(dJSON);
    },
    getTextWidth(t) {
      const { dummy_g } = this;
      let textWidth = 0;

      dummy_g
        .selectAll('.dummyText')
        .data([t.name])
        .enter()
        .append("text")
        .text((d) => d)
        .each(function() {
          const thisWidth = this.getComputedTextLength();
          textWidth = thisWidth;
          this.remove() // remove them just after displaying them
        })
        
      t.textWidth = textWidth;
    }
  },
  mounted() {
    this.mindmap_svg = d3.select('svg.mindmap');
    this.mindmap_g = d3.select('g#mindmapRoot');
    this.mindmapSvgZoom = d3.zoom().scaleExtent([0.1, 8]).on('zoom', () => {
      const { transform } = d3.event;
      this.mindmap_g.attr('transform', transform);
    });
    this.mindmap_svg.call(this.mindmapSvgZoom).on('dblclick.zoom', null);

    this.dummy_g = d3.select('g#dummy');
  }
}
</script>

<style lang="scss">
.mindmap {
  background-color: rgb(238, 238, 243);
  flex: auto;
  height: 650px;
  margin-right: 8px;

  rect.textRect:not(.depth_0) {
    fill: blue;
    fill-opacity: 0;
    stroke: blue;
    stroke-opacity: 0;
    stroke-width: 2;
  }

  rect.textRect.depth_0 {
    fill: white;
    stroke: rgb(190, 198, 243);
    stroke-opacity: 0;
    stroke-width: 2;
  }

  path {
    fill: none;
    stroke-linecap: round;
    stroke-width: 4;
  }

  #selectedMindnode > rect.textRect:not(.depth_0) {
    fill-opacity: 1;
    opacity: 0.2;
    stroke-opacity: 1;
  }

  #selectedMindnode > rect.textRect.depth_0 {
    stroke-opacity: 1;
  }

  #newParentNode > rect.textRect {
    stroke-opacity: 0.2;
  }
}
</style>