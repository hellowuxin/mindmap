/* eslint-env jest */
import History from '../History'

const history = new History()

test('添加第一个历史记录：{ value: 0 }', () => {
  history.record({ value: 0 })
  expect(history.cursor).toBe(0)
  expect(history.canUndo).toBe(false)
  expect(history.canClear).toBe(true)
  expect(history.canRedo).toBe(false)
})