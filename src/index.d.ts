declare module 'd3-flextree'

interface Data {
  name: string
  children?: Array<Data>
  _children?: Array<Data>
}

interface Mdata {
  name: string
  id?: string
  color?: string
  gKey?: number
  size?: number[]
  children?: Array<Mdata>
  _children?: Array<Mdata>
}