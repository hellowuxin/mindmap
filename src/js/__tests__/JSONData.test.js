/* eslint-env jest */
import JSONData from '../JSONData'
import learndata from '../../../public/learn.json'

let d = new JSONData(learndata)

describe('JSONData类的测试', () => {
  it('初始化', () => {
    expect(d.data[0].children[2].children[0].id).toBe('0-2-0')
  })

  let a = d.data[0].children[2].children[0]
  it('添加子节点', () => {
    d.add(a, { name: '测试1' })
    let b = a.children[a.children.length-1]
    expect(b.id).toBe('0-2-0-0')
    expect(b.name).toBe('测试1')
  })

  it('添加兄弟节点', () => {
    d.insert(a, { name: '测试2' }, 1)
    let b = d.data[0].children[2].children[1]
    expect(b.id).toBe('0-2-1')
    expect(b.name).toBe('测试2')
  })
})