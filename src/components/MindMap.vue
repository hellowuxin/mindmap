<template>
  <div id="mindmap" :style="mmStyle">
    <svg>
      <g id="content"></g>
      <g id="dummy"></g>
    </svg>
    <div 
      id="menu"
      tabindex="0"
      v-show="showMenu"
      :style="{ top: menuY+'px', left: menuX+'px' }"
      @blur="showMenu = false"
    >
      <div 
        class="menu-item"
        v-for="(item, index) in items"
        :key="index"
        @click="clickMenu(item)"
      >
        <div>{{ item.title }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import JSONData from '../JSONData'

export default {
  name: 'mindmap',
  props: {
    value: { // 源数据
      type: Array,
      required: true
    },
    width: Number,
    height: Number,
    draggble: { // 是否可拖拽
      type: Boolean,
      default: true
    },
  },
  model: { // 双向绑定
    prop: 'value',
    event: 'change'
  },
  computed: {
    mmStyle() {
      return {
        width: this.width ? `${this.width}px` : '100%',
        height: this.height ? `${this.height}px` : '100%',
      }
    }
  },
  data: () => ({
    mmdata: Object,// 思维导图数据
    root: '',
    showMenu: false,
    menuX: 0,
    menuY: 0,
    items: [
      { title: '删除节点', command: 0 },
    ],
    mindmap_svg: Object,
    mindmap_g: Object,
    dummy_g: Object,
    mindmapSvgZoom: Function,
    easePolyInOut: d3.transition().duration(1000).ease(d3.easePolyInOut),
    link: d3.linkHorizontal().x((d) => d[0]).y((d) => d[1])
  }),
  watch: {
    mmdata: {
      handler(newVal) {
        this.depthTraverse(newVal.data[0], this.getTextWidth);
        this.draw();
        if (this.draggble) { this.makeDraggable() }
        this.$emit('change', this.mmdata.getPuredata())
      },
      deep: true,// watch for nested data
    }
  },
  methods: {
    listenKeyDown(event) {
      const { mmdata } = this;
      const sele = d3.select('#selectedMindnode');
      if (!sele.nodes()[0]) {
        return;
      }
      const newJSON = { name: '新建节点', children: [] };
      const keyName = event.key;
      if (keyName === 'Tab') { // 添加子节点
        event.preventDefault();
        sele.each((d) => {
          mmdata.add(d.data, newJSON);
        });
      } else if (keyName === 'Enter') { // 添加弟弟节点
        event.preventDefault();
        sele.each((d, i, n) => {
          const mindmap_g = d3.select('g#content');
          if (n[i].parentNode.isSameNode(mindmap_g.nodes()[0])) { // 根节点enter时，等效tab
            mmdata.add(d.data, newJSON);
          } else {
            mmdata.insert(d.data, newJSON, 1);
          }
        });
      } else if (keyName === 'Backspace') { // 删除节点
        event.preventDefault();
        sele.each((d) => {
          mmdata.del(d.data);
        });
      }
    },
    clickMenu(item) {
      this.showMenu = false;
      if (item.command === 0) { // 删除节点
        const sele = d3.select('g#selectedMindnode');
        sele.each((d) => {
          this.mmdata.del(d.data);
        })
      }
    },
    showContextMenu(e) {
      this.menuX = e.layerX;
      this.menuY = e.layerY;
      this.showMenu = true;
      setTimeout(function() { document.getElementById("menu").focus() }, 300);
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
    updateNodeName() { // 文本编辑完成时
      const editP = document.querySelector('#editing > foreignObject > div');
      window.getSelection().removeAllRanges();// 清除选中
      const editText = editP.textContent;
      d3.select('g#editing').each((d, i, n) => {
        n[i].removeAttribute('id');
        editP.setAttribute('contenteditable', false);
        d.data.name = editText;
      });
    },
    gBtnClick(d, i, n) { // 添加子节点
      d3.event.stopPropagation();// 阻止捕获和冒泡阶段中当前事件的进一步传播。
      d3.select(n[i].parentNode).each((d) => {
        const newJSON = { name: '新建节点', children: [] };
        this.mmdata.add(d.data, newJSON);
      })
    },
    rectTriggerOut(d, i, n) {
      let gBtn = null;
      if (n[i].className.baseVal.includes('gButton')) {
        gBtn = d3.select(n[i]);
        gBtn.style('opacity', 0);
      } else {
        const collection = n[i].parentNode.children;
        gBtn = d3.select(collection[collection.length - 2]);
        gBtn.style('opacity', 0);
      }
    },
    rectTriggerOver(d, i, n) {
      let gBtn = null;
      if (n[i].className.baseVal.includes('gButton')) {
        gBtn = d3.select(n[i]);
        gBtn.style('opacity', 1);
      } else {
        const collection = n[i].parentNode.children;
        gBtn = d3.select(collection[collection.length - 2]);
        gBtn.style('opacity', 0.5);
      }
    },
    draggedNodeRenew(draggedNode, targetX, targetY, dura) {
      const { link } = this;
      const tran = d3.transition().duration(dura).ease(d3.easePoly);
      d3.select(draggedNode).transition(tran).attr('transform', `translate(${targetY},${targetX})`);
      // 更新draggedNode与父节点的path
      d3.select(draggedNode).each((d) => {
        d3.select(`path#path_${d.data.id}`).transition(tran).attr('d', `${link({
          source: [-targetY + (d.parent ? d.parent.data.textWidth : 0), -targetX],
          target: [0, 0],
        })}L${d.data.textWidth},0`);
      });
    },
    draggedNodeChildrenRenew(d, px, py) {
      const { draggedNodeChildrenRenew } = this;
      d.px = px;
      d.py = py;
      if (d.children) {
        for (let index = 0; index < d.children.length; index += 1) {
          const dChild = d.children[index];
          draggedNodeChildrenRenew(dChild, px, py);
        }
      }
    },
    selectMindnode(clickedNode, sele) {
      // 选中新的selectedMindnode
      if (sele) { sele.removeAttribute('id') }
      sele = d3.select(clickedNode);
      sele.attr('id', 'selectedMindnode');
    },
    click(d, i, n) {
      const { selectMindnode } = this;
      d3.event.stopPropagation();// 阻止捕获和冒泡阶段中当前事件的进一步传播。
      let sele = document.getElementById('selectedMindnode');
      const edit = document.getElementById('editing');
      const clickedNode = n[i].parentNode;
      if (edit) { // 正在编辑
      } else if (clickedNode.isSameNode(sele)) { // 进入编辑状态
        sele.setAttribute('id', 'editing');
        const collection = clickedNode.children;
        d3.select(collection[collection.length - 1])
          .select('div')
          .attr('contenteditable', true);
        document.querySelector('#editing > foreignObject > div').focus();
      } else { // 选中
        selectMindnode(clickedNode, sele);
      }
    },
    rightClick(d, i, n) {
      const { showContextMenu, selectMindnode } = this;
      d3.event.preventDefault();
      d3.event.stopPropagation();// 阻止捕获和冒泡阶段中当前事件的进一步传播。
      let sele = document.getElementById('selectedMindnode');
      const edit = document.getElementById('editing');
      const clickedNode = n[i].parentNode;
      if (clickedNode.isSameNode(edit)) { // 正在编辑
        return;
      }
      if (!clickedNode.isSameNode(sele)) { // 选中
        selectMindnode(clickedNode, sele);
      }
      showContextMenu(d3.event);
    },
    dragged(d, i, n) {
      const { draggedNodeChildrenRenew, draggedNodeRenew, mindmap_g } = this;
      const draggedNode = n[i];
      // 选中
      const sele = document.getElementById('selectedMindnode');
      if (sele && !sele.isSameNode(draggedNode)) {
        sele.removeAttribute('id');
      }
      // 拖拽
      // subject是被拖拽的点
      const { subject } = d3.event;
      // 鼠标相对subject原本位置的位移
      const py = d3.event.x - subject.x;
      const px = d3.event.y - subject.y;
      draggedNodeChildrenRenew(subject, px, py);
      // 鼠标相对subject.parent位置的坐标
      const targetY = subject.dy + py;
      const targetX = subject.dx + px;
      draggedNodeRenew(draggedNode, targetX, targetY, 0);
      // 重叠触发矩形边框
      const gOthers = mindmap_g.selectAll('g.node')
        .filter((d, i, n) => !draggedNode.isSameNode(n[i]) && !draggedNode.parentNode.isSameNode(n[i]));
      gOthers.each((d, i, n) => {
        const gNode = n[i];
        const gRect = gNode.getElementsByTagName('foreignObject')[0];
        const rect = { // 其他gRect相对subject.parent的坐标，以及gRect的宽高
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
    },
    dragback(subject, draggedNode) {
      const { draggedNodeChildrenRenew, draggedNodeRenew } = this;
      draggedNodeChildrenRenew(subject, 0, 0);
      draggedNodeRenew(draggedNode, subject.dx, subject.dy, 1000);
    },
    dragended(d, i, n) {
      const { mindmap_g, dragback, mmdata, draw, root } = this;
      const { subject } = d3.event;
      const draggedNode = n[i];
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
            mmdata.del(draggedD.data);
            mmdata.add(newParentD.data, draggedD.data);
            draggedNode.parentNode.removeChild(draggedNode);// 必要，使动画看起来更流畅
            // 绘制图形
            draw();
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
          mmdata.del(subject.data);
          if (a.b0) { // 插入在兄弟节点前面
            mmdata.insert(a.b0, subject.data);
            draggedNode.parentNode.insertBefore(draggedNode, a.n0);
          } else if (a.b1) { // 插入在兄弟节点后面
            mmdata.insert(a.b1, subject.data, 1);
            draggedNode.parentNode.insertBefore(draggedNode, a.n1.nextSibling);
          }
          draw();
        } else {
          dragback(subject, draggedNode);
        }
      });
    },
    appendNode(enter) {
      const { 
        appendNode, 
        updateNode, 
        exitNode, 
        updateNodeName,
        rectTriggerOut, 
        rectTriggerOver, 
        click, 
        rightClick, 
        gBtnClick, 
        link,
      } = this;

      const gNode = enter.append('g');
      gNode.attr('class', (d) => `depth_${d.depth} node`)
        .attr('transform', (d) => `translate(${d.dy},${d.dx})`);
      const foreign = gNode.append('foreignObject')
        .attr('x', -5)
        .attr('y', -27)
        .on('mouseover', rectTriggerOver)
        .on('mouseout', rectTriggerOut)
        .on('click', click)
        .on('contextmenu', rightClick);
      const foreignDiv = foreign.append('xhtml:div')
        .attr('contenteditable', false)
        .text((d) => d.data.name);
      foreignDiv.on('blur', updateNodeName);
      foreignDiv.each((d, i, n) => {
        const observer = new ResizeObserver((l) => {
          foreign.filter((d, index) => i === index)
            .attr('width', l[0].contentRect.width + 12)
            .attr('height', l[0].contentRect.height + 12);
        });
        observer.observe(n[i]);
      })
      
      const gBtn = gNode.append('g').attr('class', 'gButton')
        .attr('transform', (d) => `translate(${d.data.textWidth + 8},${-12})`)
        .on('mouseover', rectTriggerOver)
        .on('mouseout', rectTriggerOut)
        .on('click', gBtnClick);
      gBtn.append('rect')
        .attr('width', 24)
        .attr('height', 24)
        .attr('rx', 3)
        .attr('ry', 3);
      gBtn.append('path')
        .attr('d', 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z');
      
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
          foreign.attr('x', -10).attr('y', -15);
        }

        gNode.each((d, i, n) => {
          const dd = d.children;
          if (dd) {
            d3.select(n[i]).selectAll(`g${dd[0] ? `.depth_${dd[0].depth}.node` : ''}`)
              .data(dd)
              .join(
                (enter) => appendNode(enter),
                (update) => updateNode(update),
                (exit) => exitNode(exit)
              );
          }
        });
      }

      gBtn.raise();
      foreign.raise();
      return gNode;
    },
    updateNode(update) {
      const { 
        easePolyInOut, 
        link, 
        appendNode, 
        updateNode, 
        exitNode 
      } = this;

      update.attr('class', (d) => `depth_${d.depth} node`)
        .transition(easePolyInOut)
        .attr('transform', (d) => `translate(${d.dy},${d.dx})`);
      update.each((d, i, n) => {
        const node = d3.select(n[i]);
        const foreign = node.selectAll('foreignObject')
          .filter((d, i, n) => n[i].parentNode === node.node())
          .attr('width', d.data.textWidth + 11);
        node.select('div').text(d.data.name);
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
        
        node.each((d, i, n) => {
          const dd = d.children;
          if (dd) {
            d3.select(n[i]).selectAll(`g${dd[0] ? `.depth_${dd[0].depth}.node` : ''}`)
              .data(dd)
              .join(
                (enter) => appendNode(enter),
                (update) => updateNode(update),
                (exit) => exitNode(exit)
              );
          }
        });
        
        node.selectAll('g.gButton')
          .filter((d, i, n) => n[i].parentNode === node.node())
          .attr('transform', `translate(${d.data.textWidth + 8},${-12})`)
          .raise();
        foreign.raise();
      });
      return update;
    },
    exitNode(exit) {
      exit.filter((d, i, n) => {
        if (n[i].classList[0] === 'gButton') {
          return false;
        }
        return true;
      }).remove();
    },
    draw() { // 生成svg
      const { 
        mindmap_g, 
        appendNode, 
        updateNode, 
        exitNode,
        tree
      } = this;

      tree();
      const d = [ this.root ];

      mindmap_g.selectAll(`g${d[0] ? `.depth_${d[0].depth}.node` : ''}`)
        .data(d)
        .join(
          (enter) => appendNode(enter),
          (update) => updateNode(update),
          (exit) => exitNode(exit)
        );
    },
    renewY(r, textWidth) {
      r.y += textWidth;
      if (r.children) {
        for (let index = 0; index < r.children.length; index += 1) {
          const rChild = r.children[index];
          this.renewY(rChild, textWidth + r.data.textWidth);
        }
      }
    },
    tree() { // 数据处理
      const { mmdata, renewY } = this;

      const r = d3.hierarchy(mmdata.data[0]);// 根据指定的分层数据构造根节点
      r.nodeHeight = 35;
      r.nodeWidth = 100;// r.height与叶子节点的最大距离
      // nodeSize设置了节点的大小（高宽)
      // 高指两个叶子节点的纵向距离，宽指两个节点的横向距离
      this.root = d3.tree().nodeSize([r.nodeHeight, r.nodeWidth])(r);

      let x0 = Infinity;
      let x1 = -x0;
      renewY(this.root, 0);
      this.root.each((a) => {
        if (a.x > x1) x1 = a.x;// 求得最大，即最低点
        if (a.x < x0) x0 = a.x;// 求得最小，即最高点
      });
      this.root.each((a) => {
        // 处理偏移量确保图像完全显示
        a.x -= (x0 - 30);
        a.y += 15;
        // 相对偏移
        a.dx = a.x - (a.parent ? a.parent.x : 0);
        a.dy = a.y - (a.parent ? a.parent.y : 0);

        if (!a.children) { a.children = [] }
      });
    },
    getTextWidth(t) {
      const { dummy_g } = this;
      let textWidth = 0;
      dummy_g.selectAll('.dummyText')
        .data([t.name])
        .enter()
        .append("text")
        .text((d) => d)
        .each((d, i, n) => {
          textWidth = n[i].getComputedTextLength();
          n[i].remove() // remove them just after displaying them
        })
        
      t.textWidth = textWidth;
    },
    makeDraggable() {
      const {
        mindmap_g,
        dragged,
        dragended,
      } = this;

      mindmap_g.selectAll('g.node')
        .filter((d) => { return d.depth !== 0 })// 非根节点才可以拖拽
        .call(d3.drag().on('drag', dragged).on('end', dragended));
    }
  },
  mounted() {
    this.mmdata = new JSONData(this.value);
    this.mindmap_svg = d3.select('div#mindmap svg');
    this.mindmap_g = d3.select('g#content');
    this.mindmapSvgZoom = d3.zoom().scaleExtent([0.1, 8]).on('zoom', () => {
      const { transform } = d3.event;
      this.mindmap_g.attr('transform', transform);
    });
    this.mindmap_svg.call(this.mindmapSvgZoom).on('dblclick.zoom', null);

    this.dummy_g = d3.select('g#dummy');

    document.addEventListener('keydown', this.listenKeyDown);
  }
}
</script>

<style lang="scss">
div#mindmap {
  font-size: 14px;
  position: relative;
  display: flex;

  div.rightClickTrigger {
    position: absolute; 
    width: 100%; 
    height: 100%
  }

  svg {
    flex: auto;

    foreignObject {
      border-radius: 5px;
      border-width: 5px;
      border-color: transparent;
      border-style: solid;
      div {
        text-align: left;
        border: 1px solid transparent;
        width: max-content;
        &:focus {
          border-color: rgb(154, 154, 154);
          outline: none;
        }
      }
    }

    g.gButton {
      opacity: 0;
      > {
        path {
          fill: blue;
        }
        rect {
          fill: white;
          stroke: grey;
          stroke-width: 0.5;
        }
      }
    }

    path {
      fill: none;
      stroke-linecap: round;
      stroke-width: 4;
    }

    #selectedMindnode > foreignObject {
      background-color: rgba($color: blue, $alpha: 0.2);
    }

    #newParentNode > foreignObject {
      border-color: rgba($color: blue, $alpha: 0.2);
    }

    #editing > foreignObject > div {
      background-color: white;
    }
  }

  #menu {
    position: absolute;
    border-radius: 4px;
    box-shadow: 0px 5px 5px -3px rgba(0, 0, 0, 0.2), 
      0px 8px 10px 1px rgba(0, 0, 0, 0.14),
      0px 3px 14px 2px rgba(0, 0, 0, 0.12);
    background-color: #FAFAFA;
    padding: 4px 0;

    &:focus {
      outline: none;
    }

    .menu-item {
      position: relative;
      padding: 4px 8px;
      cursor: pointer;

      &::before {
        background-color: black;
        bottom: 0;
        content: "";
        left: 0;
        opacity: 0;
        pointer-events: none;
        position: absolute;
        right: 0;
        top: 0;
        transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
      }

      &:hover::before {
        opacity: 0.09;
      }
    }
  }
}
</style>