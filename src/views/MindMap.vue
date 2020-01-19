<template>
  <div class="wrapper">
    <svg class="outline"></svg>
    <svg class="mindmap">
      <g id="mindnode"></g>
    </svg>
    <svg class="tip">
      <g id="hotkey"></g>
      <g id="hidden"></g>
    </svg>
  </div>
</template>

<script>
import DataJSON from '../dataJSON'
import dataLearn from '../../public/learn.json'
import * as d3 from 'd3'

export default {
  data: () => ({
    svgMindMap: Object,
    svgOutline: Object,
    gMindnode: Object,
    gOutNode: Object,
    gOutPath: Object,
    gHidden: Object,
    gHotkey: Object,
    zoom: Function,
  }),
  methods: {
    drawHotkey() {
      const { gHotkey } = this;
      gHotkey.append('text').text('选中状态下：').attr('transform', 'translate(0, 20)');
      gHotkey.append('text').text('Tab添加子节点').attr('transform', 'translate(20, 40)');
      gHotkey.append('text').text('Enter添加弟弟节点').attr('transform', 'translate(20, 60)');
      gHotkey.append('text').text('Backspace/delete删除节点').attr('transform', 'translate(20, 80)');
      gHotkey.append('text').text('单击编辑节点').attr('transform', 'translate(20, 100)');
    },
    traverse(d, func) { // 深度遍历，func每个元素
      func(d);
      if (d.children) {
        for (let index = 0; index < d.children.length; index += 1) {
          const dChild = d.children[index];
          this.traverse(dChild, func);
        }
      }
    },
    zoomed() {
      const { transform } = d3.event;
      this.gMindnode.attr('transform', transform);
    },
    init() {
      let dataJSON = null;
      const transition = d3.transition().duration(1000).ease(d3.easePolyInOut);

      const { gMindnode, gOutNode, gOutPath, gHidden } = this;

      function seleOutNode(id) {
        const gList = gOutNode.selectAll('g');
        gList.filter((d) => d.data.id === id).attr('id', 'selectedOutnode');
        gList.filter((d) => d.data.id !== id).attr('id', '');
      }
      function seleMindNode(g, id) {
        const gList = g.selectAll('g');
        const sele = gList.filter((d) => d.data.id === id);
        if (sele) {
          sele.attr('id', 'selectedMindnode');
          return true;
        }
        const gNode = gList.nodes();
        for (let index = 0; index < gNode.length; index += 1) {
          const gChild = gNode[index];
          if (seleMindNode(gChild, id)) {
            return true;
          }
        }
        return false;
      }
      function drawHiddenText(d) { // 取得textWidth
        const text = gHidden.append('text').text(d.name).nodes()[0];
        d.textWidth = text.getBBox().width;
      }
      function drawOutline(dJSON) {
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
              seleMindNode(gMindnode, id);
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
          foreignP.on('blur', () => {
            const editP = document.querySelector('#editing p');
            window.getSelection().removeAllRanges();// 清除选中
            const editText = editP.textContent;
            d3.select('g#editing').each((d, i, n) => {
              n[i].removeAttribute('id');
              editP.setAttribute('contenteditable', false);
              if (d.data.name !== editText) {
                d.data.name = editText;
                drawHiddenText(d.data);
                drawOutline(dataJSON);// eslint-disable-line no-use-before-define
                drawMindnode(dataJSON);// eslint-disable-line no-use-before-define
              }
            });
          });
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
          gOutNode.selectAll('g')
            .data(rDescendants)
            .join(
              (enter) => appendNode(enter),
              (update) => updateNode(update),
            );
          gOutPath.selectAll('path')
            .data(r.links())
            .join(
              (enter) => appendPath(enter),
              (update) => updatePath(update),
            );
        }
        draw(d3.hierarchy(dJSON.data[0]));
      }
      function drawMindnode(dJSON) {
        let root = null;
        const link = d3.linkHorizontal().x((d) => d[0]).y((d) => d[1]);
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
            // checkEditTimer = setInterval(checkEditFocus, interval);
          } else { // 选中
            // 选中新的selectedMindnode
            if (sele) {
              sele.removeAttribute('id');
            }
            sele = d3.select(clickedNode);
            sele.attr('id', 'selectedMindnode');
            // 选中新的selectedOutnode
            sele.each((d) => {
              const { id } = d.data;
              seleOutNode(id);
            });
          }
        }
        function dragged() {
          const draggedNode = this;
          // 选中
          const sele = document.getElementById('selectedMindnode');
          if (sele && !sele.isSameNode(draggedNode)) {
            sele.removeAttribute('id');
          }
          d3.select(draggedNode).attr('id', 'selectedMindnode')
            .each((d) => {
              const { id } = d.data;
              seleOutNode(id);
            });
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
          const gSelection = gMindnode.selectAll('g').filter((d, i, n) => !draggedNode.isSameNode(n[i]) && !draggedNode.parentNode.isSameNode(n[i]));
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
          if (draggedParentNode.isEqualNode(gMindnode.nodes()[0])) { // 拖拽的是根节点时复原
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
                dJSON.addId();
                draggedNode.parentNode.removeChild(draggedNode);
                // 绘制图形
                chart(dJSON);// eslint-disable-line no-use-before-define
                drawOutline(dJSON);
                d3.select(draggedNode).each((d) => {
                  const { id } = d.data;
                  seleOutNode(id);
                  seleMindNode(gMindnode, id);
                });
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
              dJSON.addId();
              drawOutline(dJSON);
              chart(dJSON);// eslint-disable-line no-use-before-define
              d3.select(draggedNode).each((p) => seleOutNode(p.data.id));
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
          foreignP.on('blur', () => {
            const editP = document.querySelector('#editing p');
            window.getSelection().removeAllRanges();// 清除选中
            const editText = editP.textContent;
            d3.select('g#editing').each((d, i, n) => {
              n[i].removeAttribute('id');
              editP.setAttribute('contenteditable', false);
              if (d.data.name !== editText) {
                d.data.name = editText;
                drawHiddenText(d.data);
                drawOutline(dataJSON);// eslint-disable-line no-use-before-define
                drawMindnode(dataJSON);// eslint-disable-line no-use-before-define
              }
            });
          });
          const rect = gNode.append('rect')
            .attr('class', (d) => `depth_${d.depth}`)
            .attr('y', -17 - 4)
            .attr('x', -4)
            .attr('width', (d) => d.data.textWidth + 8)
            .attr('height', 16 + 8)
            .attr('rx', 3)
            .attr('ry', 3)
            .lower();

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
          }

          return gNode;
        }
        function updateNode(update) {
          update.attr('class', (d) => `depth_${d.depth}`)
            .transition(transition)
            .attr('transform', (d) => `translate(${d.dy},${d.dx})`);
          update.each((d, i, n) => {
            const node = d3.select(n[i]);
            node.select('foreignObject').attr('width', d.data.textWidth + 11);
            node.select('p').text(d.data.name);
            node.select('rect')
              .attr('class', `depth_${d.depth}`)
              .attr('width', d.data.textWidth + 8);
            node.select('path')
              .attr('id', `path_${d.data.id}`)
              .attr('class', `depth_${d.depth}`)
              .attr('stroke', d.data.color)
              .transition(transition)
              .attr('d', `${link({
                source: [
                  (d.parent ? d.parent.y + d.parent.data.textWidth : 0) - d.y,
                  (d.parent ? d.parent.x : 0) - d.x,
                ],
                target: [0, 0],
              })}L${d.data.textWidth},0`);
          });
          return update;
        }
        function gNodeNest(d, gParent) {
          const gNode = gParent.selectAll(`g${d[0] ? `.depth_${d[0].depth}` : ''}`)
            .data(d)
            .join(
              (enter) => appendNode(enter),
              (update) => updateNode(update),
            );
          gNode.on('click', clicked);
          if (!d[0] || d[0].depth !== 0) { // 非根节点才可以拖拽
            gNode.call(d3.drag().on('drag', dragged).on('end', dragended));
          }
          // 生成嵌套节点
          for (let index = 0; index < d.length; index += 1) {
            let dChildren = d[index].children;
            if (!dChildren) {
              dChildren = [];
            }
            gNodeNest(dChildren, gNode.filter((a, i) => i === index));
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
          });
          gNodeNest([root], gMindnode);
        }
        chart(dJSON);
      }
      function keyboardSvg(newJSON, sele) {
        dataJSON.addId();
        if (newJSON) {
          drawHiddenText(newJSON);
        }
        drawMindnode(dataJSON);
        drawOutline(dataJSON);
        if (sele) {
          seleOutNode(newJSON.id);
          sele.attr('id', '');
          seleMindNode(gMindnode, newJSON.id);
          d3.select('#selectedMindnode')
            .attr('id', 'editing')
            .select('p')
            .attr('contenteditable', true);
          document.querySelector('#editing p').focus();
          document.execCommand('selectAll', false);
        }
      }
      // 监听键盘
      document.addEventListener('keydown', (event) => {
        const sele = d3.select('#selectedMindnode');
        if (!sele.nodes()[0]) {
          return;
        }
        const newJSON = { name: '新建节点' };
        const keyName = event.key;
        if (keyName === 'Tab') { // 添加子节点
          event.preventDefault();
          sele.each((d) => {
            dataJSON.add(d.data, newJSON);
            keyboardSvg(newJSON, sele);
          });
        } else if (keyName === 'Enter') { // 添加弟弟节点
          event.preventDefault();
          sele.each((d, i, n) => {
            if (n[i].parentNode.isSameNode(gMindnode.nodes()[0])) { // 根节点enter时，等效tab
              dataJSON.add(d.data, newJSON);
            } else {
              dataJSON.insert(d.data, newJSON, 1);
            }
            keyboardSvg(newJSON, sele);
          });
        } else if (keyName === 'Backspace') { // 删除节点
          event.preventDefault();
          sele.each((d) => {
            dataJSON.del(d.data);
            keyboardSvg();
          });
        }
      });
      dataJSON = new DataJSON([dataLearn]);
      dataJSON.addId();
      this.traverse(dataJSON.data[0], drawHiddenText);
      drawMindnode(dataJSON);
      drawOutline(dataJSON);
    }
  },
  mounted() {
    // 初始化
    this.gHotkey = d3.select('g#hotkey');
    this.svgMindMap = d3.select('svg.mindmap');
    this.svgOutline = d3.select('svg.outline');
    this.gMindnode = d3.select('g#mindnode');
    this.zoom = d3.zoom().scaleExtent([0.1, 8]).on('zoom', this.zoomed);
    this.gOutNode = this.svgOutline.append('g');
    this.gOutPath = this.svgOutline.append('g').attr('class', 'outpath');
    this.gHidden = d3.select('g#hidden');

    this.svgMindMap.call(this.zoom).on('dblclick.zoom', null);
    this.drawHotkey();
    this.init();
  }
}
</script>

<style>
.wrapper {
  display: flex;
  margin: 8px;
}

svg {
  font-size: 14px;
}

.mindmap {
  background-color: #eeeef3;
  flex: auto;
  height: 650px;
  margin-right: 8px;
}

.mindmap rect:not(.depth_0) {
  fill: blue;
  fill-opacity: 0;
  stroke: blue;
  stroke-opacity: 0;
  stroke-width: 2;
}

.mindmap rect.depth_0 {
  fill: white;
  stroke: #bec6f3;
  stroke-opacity: 0;
  stroke-width: 2;
}

.mindmap path {
  fill: none;
  stroke-linecap: round;
  stroke-width: 4;
}

.mindmap #selectedMindnode > rect:not(.depth_0) {
  fill-opacity: 1;
  opacity: 0.2;
  stroke-opacity: 1;
}

.mindmap #selectedMindnode > rect.depth_0 {
  stroke-opacity: 1;
}

.mindmap #newParentNode > rect {
  stroke-opacity: 0.2;
}

.outline {
  height: 650px;
  margin-right: 8px;
  width: 200px;
}

.outline rect {
  fill: #eeeef3;
}

.outline .outpath {
  transform: translate(14px, 15px);
}

.outline .outpath path {
  fill: none;
  stroke-linecap: round;
  stroke-width: 1.5;
}

.outline #selectedOutnode > rect {
  fill: #ccd3fd;
}

.tip {
  background-color: #eeeef3;
  height: 120px;
  width: 200px;
}

.tip text {
  fill: #4c5566;
}

.tip #hidden {
  visibility: hidden;
}

/* stylelint-disable-next-line */
foreignObject {
  padding: 5px;
}

/*# sourceMappingURL=mindmap.css.map */

</style>