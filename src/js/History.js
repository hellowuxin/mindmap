class History {
  constructor(maxSnapshots = 20) {
    this.maxSnapshots = maxSnapshots
    this.snapshots = []
    this.cursor = -1
  }

  get canUndo() { return this.cursor > 0 }
  get canClear() { return this.snapshots.length }
  get canRedo() { return this.snapshots.length > this.cursor + 1 }

  record(snapshot) { // 记录数据快照
    while (this.cursor < this.snapshots.length - 1) { // 去除旧分支
      this.snapshots.pop()
    }
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
}

export default History