/* eslint-env jest */
import * as d3ScaleChromatic from 'd3-scale-chromatic'
import * as d3Scale from 'd3-scale'
import ImData from '../ImData'
import learndata from '../../../public/learn.json'

const colorScale = d3Scale.scaleOrdinal(
  d3ScaleChromatic.schemePaired.keys(), 
  d3ScaleChromatic.schemePaired
)
const raw = learndata[0]
let im = new ImData(raw)

describe('Json类的测试', () => {
  const aId = '0-2-0'

  it('初始化', () => {
    let a = im.children[2].children[0]
    expect(a.id).toBe(aId)
    expect(a.color).toBe(colorScale(2))
    expect(a.children).toBe(undefined)
  })

  it('添加子节点', () => {
    im = im.add(aId, { name: '测试1' })
    let b = im.children[2].children[0].children[0]
    expect(b.id).toBe('0-2-0-0')
    expect(b.name).toBe('测试1')
    expect(b.color).toBe(colorScale(2))
  })

  it('添加兄弟节点', () => {
    im = im.insert(aId, { name: '测试2' }, 1)
    let b = im.children[2].children[1]
    expect(b.id).toBe('0-2-1')
    expect(b.name).toBe('测试2')
    expect(b.color).toBe(colorScale(2))
  })

  it('删除节点', () => {
    im = im.del(aId)
    let b = im.children[2].children[0]
    expect(b.id).toBe('0-2-0')
    expect(b.name).toBe('测试2')
    expect(b.color).toBe(colorScale(2))
  })

  it('修改节点名字', () => {
    im = im.rename('0-2-0', 'wuxin')
    let b = im.children[2].children[0]
    expect(b.name).toBe('wuxin')
  })
})