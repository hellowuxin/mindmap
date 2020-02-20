<template>
  <div id="mindmap" :style="mmStyle">
    <svg tabindex="0">
      <g id="test"></g>
      <g id="content"></g>
    </svg>
    <div id="dummy"></div>
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
const flextree = require('d3-flextree').flextree;
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
    draggable: { // 是否可拖拽
      type: Boolean,
      default: true
    },
    xSpacing: {
      type: Number,
      default: 80,
    },
    ySpacing: {
      type: Number, 
      default: 20
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
    link: d3.linkHorizontal().x((d) => d[0]).y((d) => d[1]),
    zoom: d3.zoom(),
  }),
  watch: {
    mmdata: {
      handler(newVal) {
        this.updateMindmap(newVal.data[0]);
        
        this.scale();

        // this.test();
        if (this.draggable) { this.makeDrag() }
        this.$emit('change', this.mmdata.getPuredata())
      },
      deep: true,// watch for nested data
    },
    draggable: function(val) {
      if (!val) { this.cancelDrag() } 
      else { this.makeDrag(); }
    },
    xSpacing: function() {
      this.updateMindmap();
    },
    ySpacing: function() {
      this.updateMindmap();
    }
  },
  methods: {
    scale() { // 适应窗口
      const { mindmap_g } = this;
      d3.transition().end().then(() => {
        const rect = mindmap_g.node().getBBox();
        const multipleX = this.width / (rect.width + rect.x);
        const multipleY = this.height / (rect.height + rect.y);
        const multiple = Math.min(multipleX, multipleY);
        this.mindmap_svg.transition(this.easePolyInOut)
          .call(this.zoom.scaleBy, multiple, [0, 0]);
      });
    },
    updateMindmap(d = this.mmdata.data[0]) {
      this.depthTraverse(d, this.getTextSize);
      this.draw();
    },
    clearSelection() {
      if(document.selection && document.selection.empty) {
          document.selection.empty();
      } else if(window.getSelection) {
          var sel = window.getSelection();
          sel.removeAllRanges();
      }
    },
    svgKeyDown() {
      const { mmdata } = this;
      const sele = d3.select('#selectedMindnode');
      if (!sele.nodes()[0]) {
        return;
      }
      const newJSON = { name: '新建节点', children: [] };
      const keyName = d3.event.key;
      if (keyName === 'Tab') { // 添加子节点
        d3.event.preventDefault();
        sele.each((d) => {
          mmdata.add(d.data, newJSON);
        });
      } else if (keyName === 'Enter') { // 添加弟弟节点
        d3.event.preventDefault();
        sele.each((d, i, n) => {
          const mindmap_g = d3.select('g#content');
          if (n[i].parentNode.isSameNode(mindmap_g.nodes()[0])) { // 根节点enter时，等效tab
            mmdata.add(d.data, newJSON);
          } else {
            mmdata.insert(d.data, newJSON, 1);
          }
        });
      } else if (keyName === 'Backspace') { // 删除节点
        d3.event.preventDefault();
        sele.each((d) => {
          mmdata.del(d.data);
        });
      }
    },
    divKeyDown() {
      if (d3.event.key === 'Enter') {
        // d3.event.preventDefault();
        // document.execCommand('insertHTML', false, '<br>');
      }   
    },
    showContextMenu() {
      const svgPosition = this.mindmap_svg.node().getBoundingClientRect();
      this.menuX = d3.event.pageX - svgPosition.x - window.scrollX;
      this.menuY = d3.event.pageY - svgPosition.y - window.scrollY;
      this.showMenu = true;
      this.clearSelection();
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
      const editText = editP.innerText;
      d3.select('g#editing').each((d, i, n) => {
        n[i].removeAttribute('id');
        editP.setAttribute('contenteditable', false);
        d.data.name = editText;
      });
    },
    selectMindnode(clickedNode, sele) {
      // 选中新的selectedMindnode
      if (sele) { sele.removeAttribute('id') }
      sele = d3.select(clickedNode);
      sele.attr('id', 'selectedMindnode');
    },
    // 点击
    click(d, i, n) {
      const { selectMindnode } = this;
      d3.event.stopPropagation();// 阻止捕获和冒泡阶段中当前事件的进一步传播。
      let sele = document.getElementById('selectedMindnode');
      const edit = document.getElementById('editing');
      const clickedNode = n[i].parentNode;
      if (edit) { // 正在编辑
      } else if (clickedNode.isSameNode(sele)) { // 进入编辑状态
        sele.setAttribute('id', 'editing');

        d3.select(clickedNode).selectAll('foreignObject')
          .filter((a, b, c) => c[b].parentNode === clickedNode)
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
      showContextMenu();
    },
    gBtnClick(a, i, n) { // 添加子节点
      const { mmdata } = this;
      d3.event.preventDefault();
      d3.event.stopPropagation();// 阻止捕获和冒泡阶段中当前事件的进一步传播。
      d3.select(n[i].parentNode).each((d) => {
        const newJSON = { name: '新建节点', children: [] };
        mmdata.add(d.data, newJSON);
      })
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
    // 悬浮
    rectTriggerOut(d, i, n) {
      let gBtn = null;
      if (n[i].className.baseVal.includes('gButton')) {
        gBtn = d3.select(n[i]);
        gBtn.style('opacity', 0);
      } else {
        d3.selectAll('g.gButton')
          .filter((a, b, c) => c[b].parentNode === n[i].parentNode)
          .style('opacity', 0);
      }
    },
    rectTriggerOver(d, i, n) {
      let gBtn = null;
      if (n[i].className.baseVal.includes('gButton')) {
        gBtn = d3.select(n[i]);
        gBtn.style('opacity', 1);
      } else {
        d3.selectAll('g.gButton')
          .filter((a, b, c) => c[b].parentNode === n[i].parentNode)
          .style('opacity', 0.5);
      }
    },
    // 拖拽
    makeDrag() {
      const {
        mindmap_g,
        dragged,
        dragended,
      } = this;

      mindmap_g.selectAll('g.node')
        .filter((d) => { return d.depth !== 0 })// 非根节点才可以拖拽
        .call(d3.drag().on('drag', dragged).on('end', dragended));
    },
    cancelDrag() {
      this.mindmap_g.selectAll('g.node').call(d3.drag().on('drag', null).on('end', null));
    },
    draggedNodeRenew(draggedNode, targetX, targetY, dura = 0) {
      const { link, xSpacing } = this;
      const tran = d3.transition().duration(dura).ease(d3.easePoly);
      d3.select(draggedNode).transition(tran).attr('transform', `translate(${targetY},${targetX})`);
      // 更新draggedNode与父节点的path
      d3.select(draggedNode).each((d) => {
        d3.select(`path#path_${d.data.id}`).transition(tran).attr('d', `${link({
          source: [
            -targetY + (d.parent ? d.parent.data.size[1] : 0) - xSpacing, 
            -targetX + (d.parent ? d.parent.data.size[0]/2 : 0)
          ],
          target: [0, d.data.size[0]/2],
        })}L${d.data.size[1] - xSpacing},${d.data.size[0]/2}`);
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
    dragged(a, i, n) { // 拖拽中【待完善】
      const { draggedNodeChildrenRenew, draggedNodeRenew, mindmap_g, xSpacing } = this;
      const draggedNode = n[i];
      const draggedNodeRect = draggedNode.getElementsByTagName('foreignObject')[0];
      // 选中
      const sele = document.getElementById('selectedMindnode');
      if (sele && !sele.isSameNode(draggedNode)) {
        sele.removeAttribute('id');
      }
      // 拖拽
      // 相对a原本位置的偏移
      const py = d3.event.x - a.x;// x轴偏移的量
      const px = d3.event.y - a.y;// y轴偏移的量
      draggedNodeChildrenRenew(a, px, py);
      // 相对a.parent位置的坐标
      let targetY = a.dy + py;// x轴坐标
      let targetX = a.dx + px;// y轴坐标
      draggedNodeRenew(draggedNode, targetX, targetY);
      // foreignObject偏移
      targetY += parseInt(draggedNodeRect.getAttribute('x'), 10);
      targetX += parseInt(draggedNodeRect.getAttribute('y'), 10);

      // 计算others相对a.parent位置的坐标
      mindmap_g.selectAll('g.node')
        .filter((d, i, n) => !draggedNode.isSameNode(n[i]) && !draggedNode.parentNode.isSameNode(n[i]))
        .each((d, i, n) => {
          const gNode = n[i];
          const gRect = gNode.getElementsByTagName('foreignObject')[0];
          const rect = { // 其他gRect相对a.parent的坐标，以及gRect的宽高
            y: parseInt(gRect.getAttribute('x'), 10) // foreignObject的x轴偏移
              + d.y + (d.py ? d.py : 0) - (a.parent ? a.parent.y : 0),
            x: parseInt(gRect.getAttribute('y'), 10) // foreignObject的y轴偏移
              + d.x + (d.px ? d.px : 0) - (a.parent ? a.parent.x : 0),
            width: d.size[1] - xSpacing,
            height: d.size[0],
          };
          // 重叠触发矩形边框
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
    // 绘制
    gClass(d) {
      return `depth_${d.depth} node`
    },
    gTransform(d) {
      return `translate(${d.dy},${d.dx})`
    },
    foreignY(d) {
      return -d.data.size[0]/2 - 7;
    },
    gBtnTransform(d) {
      return `translate(${d.data.size[1] + 8 - this.xSpacing},${d.data.size[0]/2 - 12})`
    },
    pathId(d) {
      return `path_${d.data.id}`
    },
    pathClass(d) {
      return `depth_${d.depth}`
    },
    pathColor(d) {
      return d.data.color
    },
    path(d) {
      return `${
        this.link({
          source: [
            (d.parent ? d.parent.y + d.parent.data.size[1] : 0) - d.y - this.xSpacing,
            (d.parent ? d.parent.x + d.parent.data.size[0]/2: 0) - d.x,
          ],
          target: [0, d.data.size[0]/2],
          })
        }L${d.data.size[1] - this.xSpacing},${d.data.size[0]/2}`
    },
    nest(d, i, n) {
      const dd = d.children;
      if (dd) {
        d3.select(n[i]).selectAll(`g${dd[0] ? `.depth_${dd[0].depth}.node` : ''}`)
          .data(dd)
          .join(
            (enter) => this.appendNode(enter),
            (update) => this.updateNode(update),
            (exit) => this.exitNode(exit)
          );
      }
    },
    appendNode(enter) {
      const { 
        gClass,
        gTransform,
        updateNodeName,
        rectTriggerOut, 
        rectTriggerOver, 
        click, 
        rightClick, 
        gBtnClick,
        divKeyDown,
        foreignY,
        gBtnTransform,
        pathId,
        pathClass,
        pathColor,
        path,
        nest,
      } = this;

      const gNode = enter.append('g');
      gNode.attr('class', gClass)
        .attr('transform', gTransform);
      const foreign = gNode.append('foreignObject')
        .attr('x', -5)
        .attr('y', foreignY)
        .on('mouseover', rectTriggerOver)
        .on('mouseout', rectTriggerOut)
        .on('click', click)
        .on('contextmenu', rightClick);
      const foreignDiv = foreign.append('xhtml:div')
        .attr('contenteditable', false)
        .text((d) => d.data.name);
      foreignDiv.on('blur', updateNodeName)
        .on('keydown', divKeyDown);
      foreignDiv.each((d, i, n) => {
        const observer = new ResizeObserver((l) => {
          foreign.filter((d, index) => i === index)
            .attr('width', l[0].contentRect.width + 12)
            .attr('height', l[0].contentRect.height + 12);
        });
        observer.observe(n[i]);
      })
      
      const gBtn = gNode.append('g').attr('class', 'gButton')
        .attr('transform', gBtnTransform)
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
            .attr('id', pathId)
            .attr('class', pathClass)
            .lower()
            .attr('stroke', pathColor)
            .attr('d', path);
        } else if (enterData[0].data.id === '0') { // 根节点
          foreign.attr('x', -12).attr('y', (d) => foreignY(d)+d.size[0]/2);
        }

        gNode.each(nest);
      }

      gBtn.raise();
      foreign.raise();
      return gNode;
    },
    updateNode(update) {
      const { 
        gClass,
        gTransform,
        easePolyInOut,
        xSpacing,
        foreignY,
        gBtnTransform,
        pathId,
        pathClass,
        pathColor,
        path,
        nest
      } = this;

      update.interrupt().selectAll('*').interrupt();
      update.attr('class', gClass)
        .transition(easePolyInOut)
        .attr('transform', gTransform);
      update.each((d, i, n) => {
        const node = d3.select(n[i]);
        const foreign = node.selectAll('foreignObject')
          .filter((d, i, n) => (d.data.id !== '0') && (n[i].parentNode === node.node()))
          .attr('y', foreignY)
          .attr('width', d.data.size[1] + 11 - xSpacing);
        foreign.select('div').text(d.data.name);
        node.select('path')
          .attr('id', pathId(d))
          .attr('class', pathClass(d))
          .attr('stroke', pathColor(d))
          .transition(easePolyInOut)
          .attr('d', path(d));
        
        node.each(nest);
        
        node.selectAll('g.gButton')
          .filter((d, i, n) => n[i].parentNode === node.node())
          .attr('transform', gBtnTransform(d))
          .raise();
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
    tree() { // 数据处理
      // x纵轴 y横轴
      const { mmdata, ySpacing } = this;
      const layout = flextree({spacing: ySpacing});
      const tree = layout.hierarchy(mmdata.data[0]);
      layout(tree);

      this.root = tree;

      let x0 = Infinity;
      let x1 = -x0;
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
    getTextSize(t) {
      const { dummy_g, xSpacing } = this;
      let textWidth = 0;
      let textHeight = 0;
      dummy_g.selectAll('.dummyText')
        .data([t.name])
        .enter()
        .append("div")
        .text((d) => d)
        .each((d, i, n) => {
          textWidth = n[i].offsetWidth;
          textHeight = n[i].offsetHeight;
          n[i].remove() // remove them just after displaying them
        })
      t.size = [textHeight, textWidth + xSpacing]
    },
    test() {
      const node = d3.select('g#test')
        .selectAll("g")
        .data(this.root.descendants())
        .join("g")
        .attr("transform", d => `translate(${d.y},${d.x})`);

      node.append("rect")
        .attr("fill", "#999")
        .attr("width", d => d.size[1])
        .attr("height", d => d.size[0]);
    },
  },
  mounted() {
    this.mmdata = new JSONData(this.value);
    this.mindmap_svg = d3.select('div#mindmap svg');
    this.mindmap_g = d3.select('g#content');
    this.dummy_g = d3.select('div#dummy');

    this.mindmap_svg.on('keydown', this.svgKeyDown);
    // zoom
    this.mindmapSvgZoom = this.zoom
      .scaleExtent([0.1, 8])
      .on('zoom', () => {
        this.mindmap_g.attr('transform', d3.event.transform);
      });
    this.mindmap_svg.call(this.mindmapSvgZoom).on('dblclick.zoom', null);
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

  div#dummy {
    div {
      white-space:pre-wrap;
      width: max-content;
    }
  }

  svg {
    flex: auto;
    outline: none;

    foreignObject {
      cursor: default;
      border-radius: 5px;
      border-width: 5px;
      border-color: transparent;
      border-style: solid;
      div {
        text-align: left;
        border: 1px solid transparent;
        width: max-content;
        white-space:pre-wrap;
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