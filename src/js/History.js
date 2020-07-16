function deepCopy(target) { // 深拷贝
  let copyed_objs = [] // 此数组解决了循环引用和相同引用的问题，它存放已经递归到的目标对象 

  function _deepCopy(target) {
    if ((typeof target !== 'object') || !target) { return target }

    for(let i = 0; i < copyed_objs.length; i++){
      if(copyed_objs[i].target === target){
        return copyed_objs[i].copyTarget
      }
    }

    let obj = Array.isArray(target) ? [] : {}
    copyed_objs.push({ target: target, copyTarget: obj })
    Object.keys(target).forEach((key) => {
      obj[key] = _deepCopy(target[key])
    })

    return obj
  }

  return _deepCopy(target)
}

class History {
  constructor(maxSnapshots = 20) {
    this.maxSnapshots = maxSnapshots
    this.snapshots = []
    this.cursor = -1
  }

  get canUndo() { return this.cursor > 0 }
  get canClear() { return this.snapshots.length >= 0 }
  get canRedo() { return this.snapshots.length > this.cursor + 1 }

  record(snapshot) { // 记录数据快照
    while (this.cursor < this.snapshots.length - 1) { // 去除旧分支
      this.snapshots.pop()
    }
    const snapshot1 = deepCopy(snapshot)// 深拷贝
    this.snapshots.push(snapshot1)
    // 确保历史记录条数限制
    if (this.snapshots.length > this.maxSnapshots) { this.snapshots.shift() }
    this.cursor = this.snapshots.length - 1
  }

  undo() {
    if (this.canUndo) {
      this.cursor -= 1
      return this.snapshots[this.cursor]
    }
    return null
  }

  redo() {
    if (this.canRedo) {
      this.cursor += 1
      return this.snapshots[this.cursor]
    }
    return null
  }

  move(cursor) {
    if (this.snapshots.length > cursor) {
      this.cursor = cursor
      return this.snapshots[this.cursor]
    }
  }

  clear() {
    this.cursor = -1
    this.snapshots = []
  }
}

export default History