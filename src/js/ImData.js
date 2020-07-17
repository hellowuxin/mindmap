import * as d3ScaleChromatic from 'd3-scale-chromatic'
import * as d3Scale from 'd3-scale'
import { immerable, produce } from "immer"

let colorNumber = 0
const colorScale = d3Scale.scaleOrdinal(d3ScaleChromatic.schemePaired)// 颜色列表

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

function _initSize(fn, d) {
  d.size = fn(d.name)
  const { children } = d
  for (let i = 0; i < children?.length; i += 1) {
    _initSize(fn, children[i])
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

class ImData {
  [immerable] = true
  
  constructor(d) {
    this.name = d.name
    const { children } = d
    if (children) {
      this.children = JSON.parse(JSON.stringify(children))
      initColor(this.children)
    }
    this.initId()
    return produce(this, (draftState) => draftState)
  }

  getSource(id) {
    return _getSource(this.findId(id))
  }

  initId(id = '0', d = this) { // 初始化唯一标识：待优化
    d.id = id
    const { children } = d
    for (let i = 0; i < children?.length; i += 1) {
      this.initId(`${id}-${i}`, children[i])
    }
  }

  initSize(fn, id = '0') {
    return produce(this, (draftState) => {
      _initSize(fn, draftState.findId(id))
    })
  }

  findId(id) {
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
        const parent = draftState.findId(id)
        parent.name = name
      })
    }
  }

  resize(id, size) {
    if (id.length > 0) {
      return produce(this, (draftState) => {
        const parent = draftState.findId(id)
        parent.size = size
      })
    }
  }

  del(id) { // 删除指定id的数据
    if (id.length > 2) {
      return produce(this, (draftState) => {
        let parent = draftState.findId(id.slice(0, -2))
        parent.children.splice(~~id[id.length-1], 1)
        draftState.initId(parent.id, parent)
      })
    }
  }

  add(id, child) { // 添加子节点
    if (id.length > 0) {
      return produce(this, (draftState) => {
        const parent = draftState.findId(id)
        parent.children ? parent.children.push(child) : parent.children = [child]
        child.color = parent.color || colorScale(colorNumber += 1)
        inheritColor(child, child.color)
        draftState.initId(`${parent.id}-${parent.children.length-1}`, child)
      })
    }
  }

  insert(id, d, i = 0) { // 把d插入到id的前面(i=0)或者后面(i=1)
    if (id.length > 2) {
      return produce(this, (draftState) => {
        const parent = draftState.findId(id.slice(0, -2))
        parent.children.splice(~~id[id.length-1] + i, 0, d)
        d.color = parent.color || colorScale(colorNumber += 1)
        inheritColor(d, d.color)
        draftState.initId(parent.id, parent)
      })
    }
  }

  move(delId, insertId, i=0) { // 同层级的移动
    if (delId.length > 2 && insertId.length > 2) {
      return produce(this, (draftState) => {
        const parent = draftState.findId(delId.slice(0, -2))
        const delIndex = ~~delId[delId.length-1]
        let insertIndex = ~~insertId[insertId.length-1]
        delIndex < insertIndex ? insertIndex -= 1 : null
        parent.children.splice(
          insertIndex + i, 0, parent.children.splice(delIndex, 1)[0]
        )

        draftState.initId(parent.id, parent)
      })
    }
  }

  reparent(parentId, delId) {
    if (delId.length > 2 && parentId.length > 0 && parentId !== delId) {
      return produce(this, (draftState) => {
        const np = draftState.findId(parentId)
        const delParent = draftState.findId(delId.slice(0, -2))
        const del = delParent.children[~~delId[delId.length-1]]

        delParent.children.splice(~~delId[delId.length-1], 1)
        np.children ? np.children.push(del) : np.children = [del]

        const d = parentId.length >= delId.length ? delParent : np
        parentId === '0' 
          ? inheritColor(del, del.color = colorScale(colorNumber += 1)) 
          : inheritColor(np, np.color)

        draftState.initId(d.id, d)
      })
    }
  }
}

export default ImData
