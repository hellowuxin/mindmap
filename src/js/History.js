// const fakeUUID = () => `${+new Date()}${Math.random()}`

class History {
  constructor(maxSnapshots = 20) {
    this.maxSnapshots = maxSnapshots
    this.snapshots = []
    this.cursor = -1
  }

  get canUndo() {
    return this.cursor > 0
  }

  get canClear() {
    return this.snapshots.length
  }

  get canRedo() {
    return this.snapshots.length > this.cursor + 1
  }

  record(snapshot) { // 记录数据快照
    // if (this.checkRepeat(snapshot)) { return false }
    while (this.cursor < this.snapshots.length - 1) { // 去除旧分支
      this.snapshots.pop()
    }

    // 生成唯一的 id，确保在列表渲染时不会重用 DOM
    // 这样生成的动画更好的表现新旧历史记录的替换
    // snapshot.uuid = fakeUUID()
    const snapshot1 = JSON.parse(JSON.stringify(snapshot))// 深拷贝
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

  // checkRepeat(snapshot) {
  //   const next = snapshot
  //   let prev
  //   if (this.cursor >= 0) {
  //     prev = this.snapshots[this.cursor]
  //   } else {
  //     prev = ''
  //   }
  //   // 如果更复杂的对象建议使用 deep equal 库
  //   if (typeof prev !== 'object' || typeof next !== 'object') {
  //     return false
  //   }
  //   let diffFound = false;
  //   ['x', 'y', 'w', 'h', 'r'].find(k => {
  //     diffFound = prev[k] !== next[k]
  //     return diffFound
  //   })
  //   return !diffFound
  // }
}

export default History