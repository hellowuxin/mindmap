<template>
  <div ref="mindmap" id="mindmap" :style="mmStyle">
    <svg ref="svg" tabindex="0" :class="svgClass">
      <g ref="content" id="content" ></g>
      <rect v-show="showSelectedBox" id="selectedBox" width='24' height='24'></rect>
    </svg>
    <div ref="dummy" id="dummy"></div>
    <div ref="menu"
      id="menu"
      tabindex="0"
      v-show="showContextMenu"
      :style="{ top: contextMenuY+'px', left: contextMenuX+'px' }"
      @blur="showContextMenu = false"
    >
      <div 
        :class="`menu-item ${item.disabled ? 'disabled' : ''}`"
        v-for="(item, index) in contextMenuItems"
        :key="index"
        @click="item.disabled ? null : clickMenu(item.name)"
      >
        <div>{{ item.title }}</div>
      </div>
    </div>
    <div class="buttonList right-bottom">
      <button v-show="gps" class="icon" ref="gps" type="button" @click="makeCenter()">
        <i class="gps"></i>
      </button>
      <button v-show="fitView" class="icon" ref="fitView" type="button" @click="fitContent()">
        <i class="fitView"></i>
      </button>
      <button v-show="download" class="icon" ref="download" type="button" @click="showPopUps=true">
        <i class="download"></i>
      </button>
    </div>
    <div class="buttonList top-right">
      <button v-show="showUndo" class="icon" :class="{disabled: !canUndo}" ref="undo" 
        type="button" @click="undo()"
      >
        <i class="undo"></i>
      </button>
      <button v-show="showUndo" class="icon" :class="{disabled: !canRedo}" ref="redo" 
        type="button" @click="redo()"
      >
        <i class="redo"></i>
      </button>
    </div>
    <div class="pop-ups" v-show="showPopUps">
      <div class="layer"></div>
      <div class="content">
        <div class="exportTo">
          <div class="optionList">
            <div 
              :class="`option ${index===selectedOption ? 'select' : ''} ${opt.disabled ? 'disabled' : ''}`" 
              v-for="(opt, index) in optionList"
              :key="index"
              @click="opt.disabled ? '' : selectedOption=index"
            >
              <div :class="`icon ${opt.color}`">
                <i :class="opt.icon"></i>
              </div>
              <div class="text">{{ opt.title }}</div>
            </div>
          </div>
          <div class="optionTip">{{ optionTip }}</div>
          <div class="action">
            <div class="spacer"></div>
            <button class="cancel" @click="showPopUps=false">取消</button>
            <button @click="exportTo(); showPopUps=false">导出</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Watch, Prop, Model } from 'vue-property-decorator'
import * as d3 from '../js/d3'
import { flextree } from 'd3-flextree'
import ImData from '../js/ImData'
import History from '../js/History'
import toMarkdown from '../js/toMarkdown'

let mmdata: ImData // 思维导图数据
@Component
export default class MindMap extends Vue {
  @Prop() width: number | undefined
  @Prop() height: number | undefined
  @Prop({ default: 80 }) xSpacing!: number
  @Prop({ default: 20 }) ySpacing!: number
  @Prop({ default: true }) draggable!: boolean
  @Prop({ default: true }) gps!: boolean
  @Prop({ default: true }) fitView!: boolean
  @Prop({ default: true }) download!: boolean
  @Prop({ default: true }) keyboard!: boolean
  @Prop({ default: true }) showNodeAdd!: boolean
  @Prop({ default: true }) contextMenu!: boolean
  @Prop({ default: true }) zoomable!: boolean
  @Prop({ default: true }) showUndo!: boolean
  @Prop({ default: 4 }) strokeWidth!: number
  @Model('change', { required: true }) value!: Array<Data>

  @Watch('keyboard')
  onKeyboardChanged(val: boolean) { this.makeKeyboard(val) }
  @Watch('showNodeAdd')
  onShowNodeAddChanged(val: boolean) { this.makeNodeAdd(val) }
  @Watch('draggable')
  onDraggableChanged(val: boolean) { this.makeDrag(val) }
  @Watch('contextMenu')
  onContextMenuChanged(val: boolean) { this.makeContextMenu(val) }
  @Watch('xSpacing')
  onXSpacingChanged() {
    mmdata.resize()
    this.updateMmdata()
    this.updateMindmap()
  }
  @Watch('ySpacing')
  onYSpacingChanged() { this.updateMindmap() }
  @Watch('zoomable')
  onZoomableChanged(val: boolean) { this.makeZoom(val) }

  $refs!: {
    mindmap: HTMLDivElement
    svg: SVGSVGElement
    content: Element
    dummy: HTMLDivElement
    menu: HTMLDivElement
  }

  dragFlag = false
  minTextWidth = 16
  minTextHeight = 21
  spaceKey = false
  toRecord = true // 判断是否需要记录mmdata的数据快照
  toUpdate = true // 判断是否需要更新mmdata
  dTop: any // mmdata中纵坐标最高的数据
  root: any // 包含位置信息的mmdata
  showContextMenu = false
  showPopUps = false
  showSelectedBox = false // 选中框
  contextMenuX = 0
  contextMenuY = 0
  contextMenuItems = [
    { title: '删除节点', name: 'delete', disabled: false },
    { title: '折叠节点', name: 'collapse', disabled: false },
    { title: '展开节点', name: 'expand', disabled: false },
  ]
  optionList = [
    { title: 'JSON', icon: 'code-json', tip: '创建一个JSON格式的文本文件', color: 'purpleOpt' },
    { title: '图像', icon: 'image', tip: '创建一个PNG格式的图像文件', color: 'greenOpt', disabled: true },
    { title: 'Markdown', icon: 'markdown', tip: '创建一个Markdown格式的文本文件', color: 'grassOpt' }
  ]
  selectedOption = 0
  mindmap_svg: any
  mindmap_g: any
  dummy: any
  mindmapSvgZoom!: Function
  easePolyInOut = d3.transition().duration(1000).ease(d3.easePolyInOut)
  link = d3.linkHorizontal().x((d) => d[0]).y((d) => d[1])
  zoom = d3.zoom()
  history = new History()
  
  get mmStyle() {
    return {
      width: this.width ? `${this.width}px` : '100%',
      height: this.height ? `${this.height}px` : '',
    }
  }
  get svgClass() { return `stroke-width-${this.strokeWidth} ${this.spaceKey && this.zoomable ? 'grab' : ''}` }
  get optionTip() { return this.optionList[this.selectedOption].tip }
  get canUndo() { return this.history.canUndo }
  get canRedo() { return this.history.canRedo }

  updateMmdata(val?: Mdata | null) { // 不可变数据
    if (val) { mmdata.data = JSON.parse(JSON.stringify(val)) }
    this.toRecord ? this.history.record(JSON.parse(JSON.stringify(mmdata.data))) : null
    this.updateMindmap()
    this.toUpdate = false
    this.$emit('change', [mmdata.getSource()])
  }
  init() {
    // 绑定元素
    this.mindmap_svg = d3.select(this.$refs.svg)
    this.mindmap_g = d3.select(this.$refs.content).style('opacity', 0)
    this.dummy = d3.select(this.$refs.dummy)
    // 绑定svg事件
    this.makeKeyboard(this.keyboard)
    this.mindmap_svg.on('contextmenu', () => { d3.event.preventDefault() })
    this.mindmapSvgZoom = this.zoom.on('zoom', () => { this.mindmap_g.attr('transform', d3.event.transform) })
      .filter(() => (
        (d3.event.ctrlKey && d3.event.type !== 'mousedown') 
        || (this.spaceKey && d3.event.type !== 'wheel')
      ) && !d3.event.button) // 开启双指捏合 // 空格键+左键可拖移
    this.makeZoom(this.zoomable)
  }
  initNodeEvent() { // 绑定节点事件
    this.makeDrag(this.draggable)
    this.makeNodeAdd(this.showNodeAdd)
    this.makeContextMenu(this.contextMenu)
  }
  // 事件
  makeKeyboard(val: boolean) { 
    this.mindmap_svg.on('keydown', val ? this.svgKeyDown : null).on('keyup', val ? this.svgKeyUp : null)
  }
  makeNodeAdd(val: boolean) {
    const fObject = this.mindmap_g.selectAll('foreignObject')
    const gBtn = this.mindmap_g.selectAll('.gButton')
    if (val) {
      const { mouseLeave, mouseEnter, gBtnClick } = this
      fObject.on('mouseenter', mouseEnter).on('mouseleave', mouseLeave)
      gBtn.on('mouseenter', mouseEnter).on('mouseleave', mouseLeave).on('click', gBtnClick)
    } else {
      fObject.on('mouseenter', null).on('mouseleave', null)
      gBtn.on('mouseenter', null).on('mouseleave', null).on('click', null)
    }
  }
  makeContextMenu(val: boolean) {
    this.mindmap_g.selectAll('foreignObject').on('contextmenu', val ? this.fObjectRightClick : null)
  }
  makeDrag(val: boolean) {
    const { mindmap_g, dragged, fObjMousedown, dragended } = this
    mindmap_g.selectAll('foreignObject').call(
      d3.drag().container((d, i, n: any) => n[i].parentNode.parentNode)
        .on('start', (val ? fObjMousedown : null) as any)
        .on('drag', (val ? dragged : null) as any)
        .on('end', (val ? dragended : null) as any)
    )
  }
  makeZoom(val: boolean) {
    if (val) {
      this.mindmap_svg.call(this.mindmapSvgZoom).on('dblclick.zoom', null)
        .on('wheel.zoom', () => {
          const { ctrlKey, deltaY, deltaX } = d3.event
          d3.event.preventDefault()
          const current: any = d3.zoomTransform(this.$refs.svg)
          if (ctrlKey) { // 缩放
            current.k = Math.max(current.k - deltaY * 0.01, 0.1)
            current.k = Math.min(current.k, 8)
          } else { // 移动
            current.y = current.y - deltaY
            current.x = current.x - deltaX
          }
          this.mindmap_g.attr('transform', current)
        })
    } else {
      this.mindmap_svg.on('.zoom', null)
    }
  }
  // button事件
  undo() {
    if (this.canUndo) {
      this.toRecord = false
      this.updateMmdata(this.history.undo())
    }
  }
  redo() {
    if (this.canRedo) {
      this.toRecord = false
      this.updateMmdata(this.history.redo())
    }
  }
  downloadFile(content: string, filename: string) {
    const eleLink = document.createElement('a');
    eleLink.download = filename;
    eleLink.style.display = 'none';
    // 字符内容转变成blob地址
    const blob = new Blob([content]);
    eleLink.href = URL.createObjectURL(blob);
    // 触发点击
    document.body.appendChild(eleLink);
    eleLink.click();
    // 然后移除
    document.body.removeChild(eleLink);
  }
  exportTo() { // 导出至
    const data = mmdata.getSource()
    let content = ''
    let filename = data.name
    switch (this.selectedOption) {
      case 0: // JSON
        content = JSON.stringify(data, null, 2)
        filename += '.json'
        break
      case 2: // Markdown
        content = toMarkdown(data)
        filename += '.md'
        break
      default:
        break
    }
    this.downloadFile(content, filename)
  }
  async makeCenter() { // 居中
    await d3.transition().end().then(() => {
      const div = this.$refs.mindmap
      const content = (this.$refs.content as SVGGElement).getBBox()
      const { k } = d3.zoomTransform(this.$refs.svg)

      const x = (
        -(div.offsetWidth - k*content.width)/(2*k) 
        - 5
      )
      const y = (
        -(div.offsetHeight - k*content.height)/(2*k) 
        - (-this.dTop.x - this.foreignY(this.dTop))
      )

      this.mindmap_svg.call(this.zoom.translateTo, x, y, [0, 0])
    })
  }
  async fitContent() { // 适应窗口大小
    await d3.transition().end().then(() => {
      const rect = (this.$refs.content as SVGGElement).getBBox()
      const div = this.$refs.mindmap
      const multipleX = div.offsetWidth / rect.width
      const multipleY = div.offsetHeight / rect.height
      const multiple = Math.min(multipleX, multipleY)
      
      this.mindmap_svg.transition(this.easePolyInOut).call(this.zoom.scaleTo, multiple)
    })
  }
  // 数据操作
  add(dParent: Mdata, d: Mdata) {
    this.toRecord = true
    dParent.id ? mmdata.add(dParent.id, d) : null
    this.updateMmdata()
    return d
  }
  insert(dPosition: Mdata, d: Mdata, i = 0) {
    this.toRecord = true
    dPosition.id ? mmdata.insert(dPosition.id, d, i) : null
    this.updateMmdata()
    return d
  }
  move(del: Mdata, insert: Mdata, i=0) {
    this.toRecord = true
    del.id && insert.id ? mmdata.move(del.id, insert.id, i) : null
    this.updateMmdata()
  }
  reparent(p: Mdata, d: Mdata) {
    this.toRecord = true
    p.id && d.id ? mmdata.reparent(p.id, d.id) : null
    this.updateMmdata()
  }
  del(s: Mdata) {
    this.toRecord = true
    s.id ? mmdata.del(s.id) : null
    this.updateMmdata()
  }
  updateName(d: Mdata, name: string) {
    if (d.name !== name) { // 有改变
      this.toRecord = true
      d.id ? mmdata.rename(d.id, name) : null
      this.updateMmdata()
    }
  }
  collapse(d: Mdata) {
    this.toRecord = true
    d.id ? mmdata.collapse(d.id) : null
    this.updateMmdata()
  }
  expand(d: Mdata) {
    this.toRecord = true
    d.id ? mmdata.expand(d.id) : null
    this.updateMmdata()
  }
  // 键盘
  svgKeyDown() {
    const event = d3.event
    const keyName = event.key
    // 针对导图的操作
    if (keyName === ' ' && !this.spaceKey) { this.spaceKey = true }
    if (event.metaKey) {
      if (keyName === 'z') { // 撤销
        d3.event.preventDefault()
        this.undo()
      } else if (keyName === 'y') { // 重做
        d3.event.preventDefault()
        this.redo()
      }
    } else { // 针对节点的操作
      const sele = d3.select('#selectedNode')
      if (sele.node()) {
        const seleData: any = sele.data()[0] // FlexNode
        const seleDepth = seleData.depth
        const im = seleData.data
        const pNode = (sele.node() as Element).parentNode as Element

        if (keyName === 'Tab') { // 添加子节点
          d3.event.preventDefault()
          this.editNew(
            this.add(im, { name: '' }),
            seleDepth+1,
            pNode
          )
        } else if (keyName === 'Enter') { // 添加弟弟节点
          d3.event.preventDefault()
          if (pNode === this.$refs.content) { // 根节点enter时，等效tab
            this.editNew(
              this.add(im, { name: '' }),
              seleDepth+1,
              pNode
            )
          } else {
            this.editNew(
              this.insert(im, { name: '' }, 1),
              seleDepth,
              pNode
            )
          }
        } else if (keyName === 'Backspace') { // 删除节点
          d3.event.preventDefault()
          this.del(im)
        }
      }
    } 
  }
  svgKeyUp() {
    // 针对导图的操作
    if (d3.event.key === ' ') { this.spaceKey = false }
  }
  divKeyDown() {
    if (d3.event.key === 'Enter') {
      // d3.event.preventDefault()
      // document.execCommand('insertHTML', false, '<br>')
    }   
  }
  // 节点操作
  updateNodeName() { // 文本编辑完成时
    const editP = document.querySelector('#editing > foreignObject > div') as HTMLDivElement
    window.getSelection()?.removeAllRanges() // 清除选中
    const editText = editP?.innerText || ''
    d3.select('g#editing').each((d: any, i, n) => {
      (n[i] as Element).removeAttribute('id')
      editP?.setAttribute('contenteditable', 'false')
      this.updateName(d.data, editText)
    })
    this.$refs.svg.focus()
  }
  removeSelectedId() { // 清除选中节点
    const sele = document.getElementById('selectedNode')
    if (sele) {
      sele.setAttribute('__click__', '0')
      sele.removeAttribute('id')
    }
  }
  selectNode(n: Element) { // 选中节点
    if (n.getAttribute('id') !== 'selectedNode') {
      this.removeSelectedId()
      n.setAttribute('id', 'selectedNode')
    }
  }
  editNode(n: Element) { // 编辑节点
    this.removeSelectedId()
    n.setAttribute('id', 'editing')
    const fObj = d3.select(n).selectAll('foreignObject').filter((a, b, c) => (c[b] as Element).parentNode === n)
    this.focusNode(fObj)
    fObj.select('div').attr('contenteditable', true)
    const fdiv = document.querySelector(`#editing > foreignObject > div`)
    fdiv ? window.getSelection()?.selectAllChildren(fdiv) : null
  }
  focusNode(fObj: any) { // 使节点处于可视区域
    const { k } = d3.zoomTransform(this.$refs.svg) // 放大缩小倍数
    const fObjPos = fObj.node().getBoundingClientRect()
    const svgPos = this.$refs.svg.getBoundingClientRect()

    const r = fObjPos.right - svgPos.right
    const b = fObjPos.bottom - svgPos.bottom
    const l = fObjPos.left - svgPos.left
    const t = fObjPos.top - svgPos.top
    const x = (r > 0 && r) || (l < 0 && l)
    const y = (b > 0 && b) || (t < 0 && t)
    
    // 保持节点可视
    if (x) { this.mindmap_svg.call(this.zoom.translateBy, -x/k, 0) }
    if (y) { this.mindmap_svg.call(this.zoom.translateBy, 0, -y/k) }
  }
  editNew(newD: Mdata, depth: number, pNode: Element) { // 聚焦新节点
    d3.transition().end().then(() => {
      const node: any = d3.select(pNode).selectAll(`g.node.depth_${depth}`)
        .filter((b: any) => b.data.id === newD.id) // b: FlexNode
        .node()

      this.editNode(node)
    }, (err) => {
      console.log(err)
    })
  }
  fdivMouseDown() {
    const flag = d3.event.target.getAttribute('contenteditable')
    if (flag === 'true') {
      d3.event.stopPropagation() // 防止触发drag、click
    }
  }
  fObjMousedown(d: any, i: any, n: any) {
    const edit = document.getElementById('editing')
    let flag = 0
    const clickedNode = n[i].parentNode as Element
    if (edit && edit !== clickedNode) {
      const f = (d3.selectAll('foreignObject').filter((d, i, n: any) => n[i]?.parentNode === edit).node() as Element)
        ?.firstElementChild as HTMLElement

      f.blur()
      flag = 1
    }
    if (!edit || flag) { // 未在编辑
      d3.event.sourceEvent.preventDefault()
      this.selectNode(clickedNode)
      const fObj = d3.select(n[i])
      const fdiv = n[i].firstElementChild as HTMLDivElement
      fdiv.contentEditable = 'true'
      
      setTimeout(() => {
        if (document.activeElement !== fdiv) {
          fdiv.contentEditable = 'false'
        } else { // 双击进入编辑状态
          this.removeSelectedId()
          clickedNode?.setAttribute('id', 'editing')
          this.focusNode(fObj)
        }
      }, 300)
    }
  }
  fObjectClick(d: Object, i: number, n: Element[]) { // 两次单击进入编辑状态
    const sele = document.getElementById('selectedNode')
    if (sele) {
      if (sele.getAttribute('__click__') === '1' 
      && n[i].parentNode === sele 
      && document.activeElement !== n[i].firstElementChild
      && !this.dragFlag ) {
        this.editNode(sele)
        sele.setAttribute('__click__', '0')
      } else {
        sele.setAttribute('__click__', '1')
      }
    }
  }
  fObjectRightClick(d: {data: Mdata}, i: number, n: Element[]) {
    const sele = document.getElementById('selectedNode')
    const edit = document.getElementById('editing')
    const clickedNode = n[i].parentNode as Element
    if (clickedNode !== edit) { // 非正在编辑
      if (clickedNode !== sele) { // 选中
        this.selectNode(clickedNode)
      }
      // 
      const { data } = d
      this.contextMenuItems[1].disabled = !data.children || data.children.length === 0
      this.contextMenuItems[2].disabled = !(data._children && data._children.length > 0)
      // 显示右键菜单
      const svgPos = this.$refs.svg.getBoundingClientRect()
      this.contextMenuX = d3.event.pageX - svgPos.left - window.pageXOffset
      this.contextMenuY = d3.event.pageY - svgPos.top - window.pageYOffset
      this.showContextMenu = true
      this.clearSelection()
      setTimeout(() => { this.$refs.menu.focus() }, 300)
    }
  }
  gBtnClick(a: Object, i: number, n: SVGElement[]) { // 添加子节点
    if (n[i].style.opacity === '1') {
      const d: any = d3.select(n[i].parentNode as Element).data()[0]
      const newD = this.add(d.data, { name: '' })
      this.mouseLeave(undefined, i, n)
      this.editNew(newD, d.depth+1, n[i].parentNode as Element)
    }
  }
  clickMenu(key: string) {
    this.showContextMenu = false
    const data = (d3.select('#selectedNode').data()[0] as any).data
    switch (key) {
      case 'delete': // 删除节点
        this.del(data)
        break
      case 'collapse': // 折叠节点
        this.collapse(data)
        break
      case 'expand':
        this.expand(data)
        break
      default:
        break
    }
    this.removeSelectedId()
  }
  // 悬浮事件
  mouseLeave(d: any, i: number, n: SVGElement[]) {
    if (n[i].className.baseVal.includes('gButton')) {
      d3.select(n[i]).style('opacity', 0)
    } else {
      d3.selectAll('g.gButton').filter((a, b, c) => (c[b] as Element).parentNode === n[i].parentNode).style('opacity', 0)
    }
  }
  mouseEnter(d: any, i: number, n: SVGElement[]) {
    const flag = d.data._children?.length > 0
    if (!flag) {
      if (n[i].className.baseVal.includes('gButton')) {
        d3.select(n[i]).style('opacity', 1)
      } else {
        d3.selectAll('g.gButton').filter((a, b, c) => (c[b] as Element).parentNode === n[i].parentNode).style('opacity', 0.5)
      }
    }
  }
  // 拖拽
  draggedNodeRenew(draggedNode: Element, px: number, py: number, dura = 0, d: any) {
    const { link, xSpacing } = this
    const targetY = d.dy + py // x轴坐标
    const targetX = d.dx + px // y轴坐标
    const tran = d3.transition().duration(dura).ease(d3.easePoly)
    d3.select(draggedNode).transition(tran as any).attr('transform', `translate(${targetY},${targetX})`)
    // 更新draggedNode与父节点的path
    d3.select(`path#path_${d.data.id}`).transition(tran as any).attr('d', `${link({
      source: [
        -targetY + (d.parent ? d.parent.data.size[1] : 0) - xSpacing, 
        -targetX + (d.parent ? d.parent.data.size[0]/2 : 0)
      ],
      target: [0, d.data.size[0]/2],
    })}L${d.data.size[1] - xSpacing},${d.data.size[0]/2}`)

    this.renewOffset(d, px, py)
  }
  renewOffset(d: any, px: number, py: number) { // 更新偏移量
    d.px = px
    d.py = py
    if (d.children) {
      for (let index = 0; index < d.children.length; index += 1) {
        const dChild = d.children[index]
        this.renewOffset(dChild, px, py)
      }
    }
  }
  dragged(a: any, i: number, n: Element[]) { // 拖拽中【待完善】
    this.dragFlag = true
    if (a.depth !== 0) {
      const { mindmap_g, xSpacing } = this
      const draggedNode = n[i].parentNode as Element
      const fObject = n[i]

      // 拖拽
      // 相对a原本位置的偏移
      const py = d3.event.x - a.x // x轴偏移的量
      const px = d3.event.y - a.y // y轴偏移的量
      this.draggedNodeRenew(draggedNode, px, py, undefined, a)
      // foreignObject偏移
      const targetY = a.dy + py + ~~(fObject.getAttribute('x') || 0) // x轴坐标
      const targetX = a.dx + px + ~~(fObject.getAttribute('y') || 0) // y轴坐标

      // 计算others相对a.parent位置的坐标
      mindmap_g.selectAll('g.node')
        .filter((d: any, i: number, n: Element[]) => draggedNode !== n[i] && draggedNode?.parentNode !== n[i])
        .each((d: any, i: number, n: Element[]) => {
          const gNode = n[i]
          const gRect = gNode.getElementsByTagName('foreignObject')[0]
          const rect = { // 其他gRect相对a.parent的坐标，以及gRect的宽高
            y: ~~(gRect.getAttribute('x') || 0) + d.y + (d.py || 0) - (a.parent.y || 0), // foreignObject的x轴偏移
            x: ~~(gRect.getAttribute('y') || 0) + d.x + (d.px || 0) - (a.parent.x || 0), // foreignObject的y轴偏移
            width: d.size[1] - xSpacing,
            height: d.size[0],
          }
          // 重叠触发矩形边框
          if ((targetY > rect.y) && (targetY < rect.y + rect.width)
          && (targetX > rect.x) && (targetX < rect.x + rect.height)) {
            gNode.setAttribute('id', 'newParentNode')
          } else if (gNode.getAttribute('id') === 'newParentNode') {
            gNode.removeAttribute('id')
          }
        })
    }   
  }
  dragback(d: any, draggedNode: Element) {
    this.draggedNodeRenew(draggedNode, 0, 0, 1000, d)
  }
  dragended(d: any, i: number, n: Element[]) {
    const { dragback, root, reparent, fObjectClick } = this
    const draggedNode = n[i].parentNode as Element
    const newParentNode = document.getElementById('newParentNode')
    if (newParentNode) { // 建立新的父子关系
      newParentNode.removeAttribute('id')
      const newParentD: any = d3.select(newParentNode).data()[0]
      reparent(newParentD.data, d.data)
    } else if (d.depth === 0 || (Math.abs(d.px) < root.nodeHeight)) { // 平移距离不足以调换兄弟节点顺序时复原
      dragback(d, draggedNode)
      fObjectClick(d, i, n)
    } else { // 调换兄弟节点顺序
      const draggedParentNode = d3.select(draggedNode.parentNode as Element)
      const dPdata: any = draggedParentNode.data()[0]
      const draggedBrotherNodes = draggedParentNode.selectAll(`g.depth_${dPdata.depth + 1}`).filter((a, i, n) => draggedNode !== n[i])
      if (!draggedBrotherNodes.nodes()[0]) { // 无兄弟节点时复原
        dragback(d, draggedNode)
        fObjectClick(d, i, n)
      } else {
        const a: any = { x0: Infinity, x1: -Infinity }
        draggedBrotherNodes.each((b: any, i, n) => {
          if (b.x > d.x && b.x > a.x1 && b.x < (d.x + d.px)) { // 新哥哥节点
            a.x1 = b.x
            a.b1 = b.data
            a.n1 = n[i]
          }
          if (b.x < d.x && b.x < a.x0 && b.x > (d.x + d.px)) { // 新弟弟节点
            a.x0 = b.x
            a.b0 = b.data
            a.n0 = n[i]
          }
        })
        if (a.b0 || a.b1) { // 存在新兄弟节点时调换节点顺序
          const sdata = d.data
          if (a.b0) { // 插入在兄弟节点前面
            this.move(sdata, a.b0)
            draggedNode.parentNode?.insertBefore(draggedNode, a.n0)
          } else if (a.b1) { // 插入在兄弟节点后面
            this.move(sdata, a.b1, 1)
            draggedNode.parentNode?.insertBefore(draggedNode, a.n1.nextSibling)
          }
        } else {
          dragback(d, draggedNode)
          fObjectClick(d, i, n)
        }
      }
    }
    this.dragFlag = false
  }
  // 绘制
  updateMindmap() {
    this.tree()
    this.getDTop()
    this.draw()
    this.initNodeEvent()
  }
  dKey(d: any) { return d.data.gKey }
  gClass(d: any) { return `depth_${d.depth} node` }
  gTransform(d: any) { return `translate(${d.dy},${d.dx})` }
  foreignY(d: any) { return -d.data.size[0]/2 - 5 }
  gBtnTransform(d: any) { return `translate(${d.data.size[1] + 8 - this.xSpacing},${d.data.size[0]/2 - 12})` }
  pathId(d: any) { return `path_${d.data.id}` }
  pathClass(d: any) { return `depth_${d.depth}` }
  pathColor(d: any) { return d.data.color || 'white' }
  gEllTransform(d: any) { return `translate(${d.data.size[1] + 8 - this.xSpacing},${d.data.size[0]/2})` }
  path(d: any) {
    return `${
      this.link({
        source: [
          (d.parent ? d.parent.y + d.parent.data.size[1] : 0) - d.y - this.xSpacing, // 横坐标
          (d.parent ? d.parent.x + d.parent.data.size[0]/2 : 0) - d.x,// 纵坐标
        ],
        target: [0, d.data.size[0]/2],
      })
    }L${d.data.size[1] - this.xSpacing},${d.data.size[0]/2}`
  }
  nest(d: any, i: number, n: Element[]) {
    const { dKey } = this
    const dd = d.children || []
    d3.select(n[i]).selectAll(`g${dd[0] ? `.depth_${dd[0].depth}.node` : ''}`)
      .data(dd, dKey)
      .join(
        (enter) => this.appendNode(enter),
        (update) => this.updateNode(update),
        (exit) => this.exitNode(exit)
      )
  }
  appendNode(enter: any) {
    const { expand, gEllTransform, gClass, gTransform, updateNodeName, divKeyDown, foreignY, gBtnTransform, pathId, pathClass, pathColor, path, nest, fdivMouseDown } = this
    const gNode = enter.append('g').attr('class', gClass).attr('transform', gTransform)

    const foreign = gNode.append('foreignObject').attr('x', -5).attr('y', foreignY)
    const foreignDiv = foreign.append('xhtml:div').attr('contenteditable', false).text((d: any) => d.data.name)
    foreignDiv.on('blur', updateNodeName).on('keydown', divKeyDown).on('mousedown', fdivMouseDown)
    foreignDiv.each((d: any, i: number, n: Element[]) => {
      const observer = new ResizeObserver((l: any) => {
        const t = l[0].target
        const b1 = getComputedStyle(t).borderTopWidth
        const b2 = getComputedStyle(t.parentNode).borderTopWidth
        const spacing = (parseInt(b1, 10) + parseInt(b2, 10)) || 0
        foreign.filter((d: any, index: number) => i === index)
          .attr('width', l[0].contentRect.width + spacing*2)// div和foreign border
          .attr('height', l[0].contentRect.height + spacing*2)
      })
      observer.observe(n[i])
    })
    
    const gBtn = gNode.append('g').attr('class', 'gButton').attr('transform', gBtnTransform)
      .style('visibility', (d: any) => !(d.data._children?.length > 0) ? 'visible' : 'hidden')
    gBtn.append('rect').attr('width', 24).attr('height', 24).attr('rx', 3).attr('ry', 3)
    gBtn.append('path').attr('d', 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z')

    const ell = gNode.append('g').attr('class', 'gEllipsis').attr('transform', gEllTransform)
      .classed('show', (d: any) => d.data._children?.length > 0)
      .style('visibility', (d: any) => d.data._children?.length > 0 ? 'visible' : 'hidden')
      .on('click', (d: any) => expand(d.data))
    ell.append('rect').attr('x', -3).attr('y', -6).attr('width', 20).attr('height', 14).style('opacity', 0)
    ell.append('rect').attr('x', -2).attr('y', -2).attr('width', 16).attr('height', 4)
      .attr('rx', 2).attr('ry', 2)
      .attr('stroke', pathColor).attr('fill', pathColor)
      .attr('class', 'btn')
    ell.append('circle').attr('cx', 2).attr('cy', 0).attr('r', 1)
    ell.append('circle').attr('cx', 6).attr('cy', 0).attr('r', 1)
    ell.append('circle').attr('cx', 10).attr('cy', 0).attr('r', 1)
    
    const enterData = enter.data()
    if (enterData.length) {
      if (enterData[0].data.id !== '0') {
        gNode.append('path').attr('id', pathId).attr('class', pathClass).lower().attr('stroke', pathColor)
          .attr('d', path)
      } else if (enterData[0].data.id === '0') { // 根节点
        foreign.attr('y', (d: any) => foreignY(d)+d.size[0]/2)
      }
      gNode.each(nest)
    }

    gBtn.raise()
    foreign.raise()
    return gNode
  }
  updateNode(update: any) {
    const { gEllTransform, gClass, gTransform, easePolyInOut, foreignY, gBtnTransform, pathId, pathClass, pathColor, path, nest } = this
    update.interrupt().selectAll('*').interrupt()
    update.attr('class', gClass).transition(easePolyInOut).attr('transform', gTransform)

    update.each((d: any, k: number, m: Element[]) => {
      const node = d3.select(m[k])
      const foreign = node.selectAll('foreignObject').filter((d, i, n) => (n[i] as Element).parentNode === m[k])
        .data([d]) // must rebind the children using selection.data to give them the new data.
        .attr('y', d.data.id !== '0' ? foreignY(d) : (foreignY(d) + d.size[0]/2))
      
      foreign.select('div').text(d.data.name)
      node.select('path').filter((d, i, n) => (n[i] as Element).parentNode === m[k]).attr('id', pathId(d))
        .attr('class', pathClass(d))
        .attr('stroke', pathColor(d))
        .transition(easePolyInOut as any)
        .attr('d', path(d))
      
      node.each(nest as any)
      
      const ellFlag = d.data._children?.length > 0

      node.selectAll('g.gButton').filter((d, i, n) => (n[i] as Element).parentNode === m[k]).data([d])
        .attr('transform', gBtnTransform)
        .style('visibility', !ellFlag ? 'visible' : 'hidden')
        .raise()

      const ell = node.selectAll('g.gEllipsis').filter((d, i, n) => (n[i] as Element).parentNode === m[k]).data([d])
        .attr('transform', gEllTransform)
        .classed('show', ellFlag)
        .style('visibility', ellFlag ? 'visible' : 'hidden')
      ell.select('rect.btn').attr('stroke', pathColor).attr('fill', pathColor)
    })
    return update
  }
  exitNode(exit: any) { 
    exit.filter((d: any, i: number, n: Element[]) => n[i].classList[1] == 'node').remove()
  }
  draw() { // 生成svg
    const { dKey, mindmap_g, appendNode, updateNode, exitNode } = this
    const d = [ this.root ]

    mindmap_g.selectAll(`g${d[0] ? `.depth_${d[0].depth}.node` : ''}`)
      .data(d, dKey)
      .join(
        (enter: any) => appendNode(enter),
        (update: any) => updateNode(update),
        (exit: any) => exitNode(exit)
      )
  }
  tree() { // 数据处理
    const { ySpacing } = this
    const layout = flextree({ spacing: ySpacing })
    const t = layout.hierarchy(mmdata.data)
    layout(t)

    this.root = t
    this.root.each((a: any) => { // x纵轴 y横轴 dx dy相对偏移
      a.dx = a.x - (a.parent ? a.parent.x : 0)
      a.dy = a.y - (a.parent ? a.parent.y : 0)
    })
  }
  getDTop() {
    let t = this.root
    while (t.children) { t = t.children[0] }
    this.dTop = t
  }
  getTextSize(text: string) {
    const { dummy, xSpacing, minTextWidth, minTextHeight } = this
    let textWidth = 0
    let textHeight = 0
    dummy.selectAll('.dummyText')
      .data([text])
      .enter()
      .append("div")
      .text((d: string) => d)
      .each((d: any, i: number, n: HTMLDivElement[]) => {
        textWidth = n[i].offsetWidth
        textHeight = n[i].offsetHeight
        n[i].remove() // remove them just after displaying them
      })
    textWidth = Math.max(minTextWidth, textWidth)
    textHeight = Math.max(minTextHeight, textHeight)
    return [textHeight, textWidth + xSpacing]
  }
  clearSelection() { // 清除右键触发的选中单词
    if(window.getSelection) {
      const sel = window.getSelection()
      sel?.removeAllRanges()
    }
  }
  addWatch() {
    this.$watch('value', (newVal) => {
      if (this.toUpdate) {
        mmdata = new ImData(newVal[0], this.getTextSize)
        this.updateMmdata()
      } else {
        this.toUpdate = true
      }
    }, { immediate: true, deep: true })
  }
  // 左键选中（待完成）
  async mounted() {
    this.init()
    // this.mindmap_svg.on('mousedown', () => { })
    // this.mindmap_svg.on('mousemove', () => { })
    this.addWatch()
    await this.makeCenter()
    await this.fitContent()
    this.mindmap_g.style('opacity', 1)
  }
}
</script>

<style lang="scss">
  @import '../css/MindMap.scss'
</style>