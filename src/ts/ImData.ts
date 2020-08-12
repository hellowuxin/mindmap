import * as d3ScaleChromatic from 'd3-scale-chromatic'
import * as d3Scale from 'd3-scale'

const colorScale = d3Scale.scaleOrdinal(d3ScaleChromatic.schemePaired) // 颜色列表
let colorNumber = 0
let size: Function // 生成size的函数
let gKey = 0

function initColor(d: Mdata, c?: string) { // 初始化颜色
  let color
  if (d.id !== '0') {
    color = c || colorScale(`${colorNumber += 1}`)
    d.color = color
  }
  const { children, _children } = d
  if (children) {
    for (let i = 0; i < children.length; i += 1) {
      initColor(children[i], color)
    }
  }
  if (_children) {
    for (let i = 0; i < _children.length; i += 1) {
      initColor(_children[i], color)
    }
  }
}

function initSize(d: Mdata) { // 初始化size
  d.size = size(d.name, d.id === '0')
  const { children, _children } = d
  if (children) {
    for (let i = 0; i < children.length; i += 1) {
      initSize(children[i])
    }
  }
  if (_children) {
    for (let i = 0; i < _children.length; i += 1) {
      initSize(_children[i])
    }
  }
}

function _getSource(d: Mdata) { // 返回源数据
  const { children, _children } = d
  const nd: Data = { name: d.name }
  nd.left = d.left
  if (children) {
    const { length } = children
    nd.children = new Array(length)
    for (let i = 0; i < length; i++) {
      nd.children[i] = _getSource(children[i])
    }
  }
  if (_children) {
    const { length } = _children
    nd._children = new Array(length)
    for (let i = 0; i < length; i++) {
      nd._children[i] = _getSource(_children[i])
    }
  }
  return nd
}

function initId(d: Mdata, id = '0') { // 初始化唯一标识：待优化
  d.id = id
  d.gKey = d.gKey || (gKey += 1)
  const { children, _children } = d

  if (children?.length && _children?.length) {
    console.error('[Mindmap warn]: Error in data: data.children and data._children cannot contain data at the same time')
  } else {
    if (children) {
      for (let i = 0; i < children.length;) {
        if (children[i].id === 'del') {
          children.splice(i, 1)
        } else {
          initId(children[i], `${id}-${i}`)
          i += 1
        }
      }
    }
    if (_children) {
      for (let i = 0; i < _children.length;) {
        if (_children[i].id === 'del') {
          _children.splice(i, 1)
        } else {
          initId(_children[i], `${id}-${i}`)
          i += 1
        }
      }
    }
  }
}

function initLeft(d: Mdata, left = false) {
  d.left = left
  const { children, _children } = d
  if (children) {
    for (let i = 0; i < children.length; i += 1) {
      initLeft(children[i], d.left)
    }
  }
  if (_children) {
    for (let i = 0; i < _children.length; i += 1) {
      initLeft(_children[i], d.left)
    }
  }
}

class ImData {
  data: Mdata
  constructor(d: Data, fn: Function) {
    size = fn
    this.data = JSON.parse(JSON.stringify(d))
    initId(this.data)
    initColor(this.data)
    initSize(this.data)

    this.data.left = false
    const { children, _children } = this.data
    if (children) {
      for (let i = 0; i < children.length; i += 1) {
        initLeft(children[i], children[i].left)
      }
    }
    if (_children) {
      for (let i = 0; i < _children.length; i += 1) {
        initLeft(_children[i], _children[i].left)
      }
    }
  }

  getSource(id = '0') {
    return _getSource(this.find(id))
  }

  resize(id = '0') { // 更新size
    initSize(this.find(id))
  }

  find(id: string) { // 根据id找到数据
    const array = id.split('-').map(n => ~~n)
    let data = this.data
    for (let i = 1; i < array.length; i++) {
      if (data.children) {
        data = data.children[array[i]]
      } else {
        console.error('[Mindmap warn]: Error in id: No data matching id')
      }
    }
    return data
  }

  rename(id: string, name: string) { // 修改名称
    if (id.length > 0) {
      const d = this.find(id)
      d.name = name
      d.size = size(name, d.id === '0')
      return d
    }
  }

  collapse(id: string | string[]) { // 折叠
    const arr = Array.isArray(id) ? id : [id]
    for (let i = 0; i < arr.length; i++) {
      const idChild = arr[i]
      const d = this.find(idChild)
      if (d && (!d._children || d._children.length === 0)) {
        d._children = d.children
        d.children = []
      }
    }
  }

  expand(id: string | string[]) { // 展开
    const arr = Array.isArray(id) ? id : [id]
    for (let i = 0; i < arr.length; i++) {
      const idChild = arr[i]
      const d = this.find(idChild)
      if (d && (!d.children || d.children.length === 0)) {
        d.children = d._children
        d._children = []
      }
    }
  }

  del(id: string | string[]) { // 删除指定id的数据
    const arr = Array.isArray(id) ? id : [id]
    let p
    for (let i = 0; i < arr.length; i++) {
      const idChild = arr[i]
      const idArr = idChild.split('-')
      if (idArr.length > 2) { // 有parent
        const delIndex = idArr.pop()
        if (delIndex) {
          const parent = this.find(idArr.join('-'))
          if (parent.children) {
            parent.children[~~delIndex].id = 'del' // 更新id时删除
          }
          if (p === undefined) {
            p = parent
          } else if (p.id.split('-').length > parent.id.split('-').length) {
            p = parent
          }
        }
      }
    }
    if (p) {
      initId(p, p.id)
    }
  }

  add(id: string, child: Data) { // 添加新的子节点
    if (id.length > 0) {
      const parent = this.find(id)
      if ((parent._children?.length || 0) > 0) { // 判断是否折叠，如果折叠，展开
        parent.children = parent._children
        parent._children = []
      }
      const c: Mdata = JSON.parse(JSON.stringify(child))
      parent.children ? parent.children.push(c) : parent.children = [c]
      initColor(c, parent.color || colorScale(`${colorNumber += 1}`))
      initId(c, `${parent.id}-${parent.children.length - 1}`)
      c.left = parent.left
      initSize(c)
      return c
    }
  }

  insert(id: string, d: Data, i = 0) { // 插入新的节点在前（或在后）
    if (id.length > 2) {
      const idArr = id.split('-')
      const bId = idArr.pop()
      if (bId) {
        const pId = idArr.join('-')
        const parent = this.find(pId)
        const c: Mdata = JSON.parse(JSON.stringify(d))
        parent.children?.splice(~~bId + i, 0, c)
        initColor(c, parent.color || colorScale(`${colorNumber += 1}`))
        initId(parent, parent.id)
        c.left = parent.left
        initSize(c)
        return c
      }
    }
  }

  move(delId: string, insertId?: string, i = 0) { // 节点在同层移动
    if (delId.length > 2) {
      if (!insertId) { // 左右转换
        const del = this.find(delId)
        initLeft(del, !del.left)
      } else if (insertId.length > 2) {
        const insert = this.find(insertId)
        const idArr = delId.split('-')
        const delIndexS = idArr.pop()
        const pId = idArr.join('-')
        const parent = this.find(pId)
        const insertIndexS = insertId.split('-').pop()

        if (delIndexS && insertIndexS && parent.children) {
          const delIndex = ~~delIndexS
          let insertIndex = ~~insertIndexS
          // 删除时可能会改变插入的序号
          if (delIndex < insertIndex) {
            insertIndex -= 1
          }
          const del = parent.children.splice(delIndex, 1)[0]
          if (del.left !== insert.left) { // 左右转换
            initLeft(del, insert.left)
          }
          parent.children.splice(insertIndex + i, 0, del)
          initId(parent, parent.id)
        }
      }
    }
  }

  reparent(parentId: string, delId: string) { // 节点移动到其他层
    if (delId.length > 2 && parentId.length > 0 && parentId !== delId) {
      const np = this.find(parentId)
      const idArr = delId.split('-')
      const delIndex = idArr.pop()
      if (delIndex) {
        const delParentId = idArr.join('-')
        const delParent = this.find(delParentId)

        const del = delParent.children?.splice(~~delIndex, 1)[0] // 删除
        if (del) {
          (np.children?.length || 0) > 0 ? np.children?.push(del)
            : ((np._children?.length || 0) > 0 ? np._children?.push(del) : np.children = [del])

          initColor(del, parentId === '0' ? colorScale(`${colorNumber += 1}`) : np.color)
          initLeft(del, parentId === '0' ? del.left : np.left)
          initId(np, np.id)
          initId(delParent, delParent.id)
        }
      }
    }
  }
}

export default ImData
