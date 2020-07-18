import * as d3ScaleChromatic from 'd3-scale-chromatic'
import * as d3Scale from 'd3-scale'
import { immerable, produce } from "immer"

let colorNumber = 0
const colorScale = d3Scale.scaleOrdinal(d3ScaleChromatic.schemePaired) // 颜色列表

function initColor(children, c) { // 初始化颜色
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    child.color = c || colorScale(colorNumber+=1)
    child.children ? initColor(child.children, child.color) : null
  }
}

function inheritColor(d, c) { // 继承颜色
  const { children } = d
  if (children) {
    for (let i = 0; i < children.length; i += 1) {
      const dChild = children[i]
      dChild.color = c
      inheritColor(dChild, c)
    }
  }
}

function initSize(d) {
  d.size = size(d.name)
  const { children } = d
  for (let i = 0; i < children?.length; i += 1) {
    initSize(children[i])
  }
}

function _getSource(d) {
  const nd = { name: d.name }
  const { children } = d
  if (children) {
    nd.children = new Array(children.length)
    for (let i = 0; i < children.length; i++) {
      nd.children[i] = _getSource(children[i])
    }
  }
  return nd
}

function initId(d, id='0') { // 初始化唯一标识：待优化
  d.id = id
  const { children } = d
  for (let i = 0; i < children?.length; i += 1) {
    initId(children[i], `${id}-${i}`)
  }
}

let size // 生成size的函数

class ImData {
  [immerable] = true
  
  constructor(d, fn) {
    size = fn
    this.name = d.name
    const { children } = d
    if (children) {
      this.children = JSON.parse(JSON.stringify(children)) // 无副作用
      initColor(this.children)
    }
    initId(this)
    initSize(this)
    return produce(this, () => {})
  }

  getSource(id = '0') {
    return _getSource(this.find(id))
  }

  resize(id = '0') { // 更新size
    return produce(this, (draftState) => {
      initSize(draftState.find(id))
    })
  }

  find(id) { // 根据id找到数据
    const array = id.split('-').map(n => ~~n)
    let data = this
    for (let i = 1; i < array.length; i++) {
      data = data.children[array[i]]
    }
    return data
  }

  rename(id, name) { // 修改名称
    if (id.length > 0) {
      return produce(this, (draftState) => {
        const d = draftState.find(id)
        d.name = name
        d.size = size(name)
      })
    }
  }

  del(id) { // 删除指定id的数据
    if (id.length > 2) {
      return produce(this, (draftState) => {
        const parent = draftState.find(id.slice(0, -2))
        parent.children.splice(~~id[id.length-1], 1)
        initId(parent, parent.id)
      })
    }
  }

  add(id, child) { // 添加新的子节点
    if (id.length > 0) {
      return produce(this, (draftState) => {
        const parent = draftState.find(id)
        parent.children ? parent.children.push(child) : parent.children = [child]
        child.color = parent.color || colorScale(colorNumber += 1)
        inheritColor(child, child.color)
        initId(child, `${parent.id}-${parent.children.length-1}`)
        initSize(child)
      })
    }
  }

  insert(id, d, i = 0) { // 插入新的节点在前（或在后）
    if (id.length > 2) {
      return produce(this, (draftState) => {
        const parent = draftState.find(id.slice(0, -2))
        parent.children.splice(~~id[id.length-1] + i, 0, d)
        d.color = parent.color || colorScale(colorNumber += 1)
        inheritColor(d, d.color)
        initId(parent, parent.id)
        initSize(d)
      })
    }
  }

  move(delId, insertId, i=0) { // 节点在同层移动
    if (delId.length > 2 && insertId.length > 2) {
      return produce(this, (draftState) => {
        const parent = draftState.find(delId.slice(0, -2))
        const delIndex = ~~delId[delId.length-1]
        let insertIndex = ~~insertId[insertId.length-1]
        delIndex < insertIndex ? insertIndex -= 1 : null // 删除时可能会改变插入的序号
        parent.children.splice(
          insertIndex + i, 0, parent.children.splice(delIndex, 1)[0]
        )
        initId(parent, parent.id)
      })
    }
  }

  reparent(parentId, delId) { // 节点移动到其他层
    if (delId.length > 2 && parentId.length > 0 && parentId !== delId) {
      return produce(this, (draftState) => {
        const np = draftState.find(parentId)
        const delParent = draftState.find(delId.slice(0, -2))
        const del = delParent.children[~~delId[delId.length-1]]

        delParent.children.splice(~~delId[delId.length-1], 1)
        np.children ? np.children.push(del) : np.children = [del]

        parentId === '0' 
          ? inheritColor(del, del.color = colorScale(colorNumber += 1)) 
          : inheritColor(np, np.color)

        const d = parentId.length >= delId.length ? delParent : np
        initId(d, d.id)
      })
    }
  }
}

export default ImData
