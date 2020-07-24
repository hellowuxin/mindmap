import * as d3ScaleChromatic from 'd3-scale-chromatic'
import * as d3Scale from 'd3-scale'

const colorScale = d3Scale.scaleOrdinal(d3ScaleChromatic.schemePaired) // 颜色列表
let colorNumber = 0
let size // 生成size的函数
let gKey = 0

function initColor(d, c) { // 初始化颜色
  let color = undefined
  if (d.id !== '0') {
    color = c || colorScale(colorNumber += 1)
    d.color = color 
  }
  const { children, _children } = d
  for (let i = 0; i < children?.length; i += 1) {
    initColor(children[i], color)
  }
  for (let i = 0; i < _children?.length; i += 1) {
    initColor(_children[i], color)
  }
}

function initSize(d) { // 初始化size
  d.size = size(d.name)
  const { children, _children } = d
  for (let i = 0; i < children?.length; i += 1) {
    initSize(children[i])
  }
  for (let i = 0; i < _children?.length; i += 1) {
    initSize(_children[i])
  }
}

function _getSource(d) { // 返回源数据
  const nd = { name: d.name }
  const { children, _children } = d
  const length1 = children?.length || 0
  const length2 = _children?.length || 0

  nd.children = new Array(length1)
  for (let i = 0; i < length1; i++) {
    nd.children[i] = _getSource(children[i])
  }

  nd._children = new Array(length2)
  for (let i = 0; i < length2; i++) {
    nd._children[i] = _getSource(_children[i])
  }
  return nd
}

function initId(d, id='0') { // 初始化唯一标识：待优化
  d.id = id
  d.gKey = d.gKey || (gKey += 1)
  const { children, _children } = d
  const length1 = children?.length
  const length2 = _children?.length
  if (length1 && length2) {
    throw(`[Mindmap warn]: Error in data: data.children and data._children cannot contain data at the same time`)
  } else {
    for (let i = 0; i < length1; i += 1) {
      initId(children[i], `${id}-${i}`)
    }
    for (let i = 0; i < length2; i += 1) {
      initId(_children[i], `${id}-${i}`)
    }
  }
}

class ImData {
  constructor(d, fn) {
    size = fn
    this.data = JSON.parse(JSON.stringify(d))
    initId(this.data)
    initColor(this.data)
    initSize(this.data)
  }

  getSource(id = '0') {
    return _getSource(this.find(id))
  }

  resize(id = '0') { // 更新size
    initSize(this.find(id))
  }

  find(id) { // 根据id找到数据
    const array = id.split('-').map(n => ~~n)
    let data = this.data
    for (let i = 1; i < array.length; i++) {
      data = data.children[array[i]]
    }
    return data
  }

  rename(id, name) { // 修改名称
    if (id.length > 0) {
      const d = this.find(id)
      d.name = name
      d.size = size(name)
    }
  }

  collapse(id) { // 折叠
    const d = this.find(id)
    d._children = d.children
    d.children = []
  }

  expand(id) { // 展开
    const d = this.find(id)
    d.children = d._children
    d._children = []
  }

  del(id) { // 删除指定id的数据
    if (id.length > 2) {
      const idArr = id.split('-')
      const delIndex = ~~idArr.pop()
      const pId = idArr.join('-')
      const parent = this.find(pId)
      parent.children.splice(delIndex, 1)
      initId(parent, parent.id)
    }
  }

  add(id, child) { // 添加新的子节点
    if (id.length > 0) {
      const parent = this.find(id)
      if (parent._children?.length > 0) { // 判断是否折叠，如果折叠，展开
        parent.children = parent._children
        parent._children = []
      }
      parent.children ? parent.children.push(child) : parent.children = [child]
      initColor(child, parent.color || colorScale(colorNumber += 1))
      initId(child, `${parent.id}-${parent.children.length-1}`)
      initSize(child)
      return child
    }
  }

  insert(id, d, i = 0) { // 插入新的节点在前（或在后）
    if (id.length > 2) {
      const idArr = id.split('-')
      const bId = ~~idArr.pop()
      const pId = idArr.join('-')
      const parent = this.find(pId)
      parent.children.splice(bId + i, 0, d)
      initColor(d, parent.color || colorScale(colorNumber += 1))
      initId(parent, parent.id)
      initSize(d)
      return d
    }
  }

  move(delId, insertId, i=0) { // 节点在同层移动
    if (delId.length > 2 && insertId.length > 2) {
      const idArr = delId.split('-')
      const delIndex = ~~idArr.pop()
      const pId = idArr.join('-')
      const parent = this.find(pId)
      let insertIndex = ~~insertId.split('-').pop()

      delIndex < insertIndex ? insertIndex -= 1 : null // 删除时可能会改变插入的序号
      parent.children.splice(
        insertIndex + i, 0, parent.children.splice(delIndex, 1)[0]
      )
      initId(parent, parent.id)
    }
  }

  reparent(parentId, delId) { // 节点移动到其他层
    if (delId.length > 2 && parentId.length > 0 && parentId !== delId) {
      const np = this.find(parentId)
      const idArr = delId.split('-')
      const delIndex = ~~idArr.pop()
      const delParentId = idArr.join('-')
      const delParent = this.find(delParentId)

      const del = delParent.children.splice(delIndex, 1)[0] // 删除
      np.children?.length > 0 ? np.children.push(del) 
        : (np._children?.length > 0 ? np._children.push(del) : np.children = [del])

      initColor(del, parentId === '0' ? colorScale(colorNumber += 1) : np.color) 

      initId(np, np.id)
      initId(delParent, delParent.id)
    }
  }
}

export default ImData
