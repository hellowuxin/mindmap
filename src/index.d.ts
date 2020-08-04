declare module 'd3-flextree'

interface Data {
  name: string
  children?: Array<Data>
  _children?: Array<Data>
  left?: boolean
}

interface Mdata {
  name: string
  id: string
  color: string
  gKey: number
  size: number[]
  children?: Array<Mdata>
  _children?: Array<Mdata>
  left?: boolean
}

interface FlexNode {
  children: FlexNode[]
  data: Mdata
  depth: number
  dx: number
  dy: number
  height: number
  length: number
  parent: FlexNode | null
  x: number
  y: number
  each: Function
  size: number[]
  px: number
  py: number
}