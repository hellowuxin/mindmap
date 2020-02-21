<img src="./public/mindmap.jpg" width="300"/>

# Mindmap Vue Component

![npm](https://img.shields.io/npm/v/@hellowuxin/mindmap)

Make a mindmap component similar to [MindNode](https://mindnode.com)

[中文说明](./README.cn.md)

## Function

Support keyboard and mouse

- Drag
- Zoom
- Add, delete and edit node
- ...

## Usage

- tab - Add child node
- enter - Add siblings
- delete - Delete node
- right click - Open contextMenu
- click twice - Edit node content
- ...

Online demo：<https://blog.5xin.xyz/mycomponents/mindmap>

## Install

```sh
npm install @hellowuxin/mindmap
```

```js
// In your vue file
import mindmap from '@hellowuxin/mindmap'
```

## API

| Name      | Type   | Default   | Description                         |
| ---       | ---    | ---       | ---                                 |
| v-model   | Array  | undefined | Set up mindmap data                 |
| width     | Number | 100%      | Set component width                 |
| height    | Number | 100%      | Set component height                |
| xSpacing  | Number | 80        | Set node horizontal spacing         |
| ySpacing  | Number | 20        | Set node vertical spacing           |
| draggable | Boolean| true      | Set whether the node is draggable   |
| gps       | Boolean| true      | Whether to show the retrieve button |

## Example

```html
<template>
  <div id="app">
    <mindmap
      v-model="data"
    ></mindmap>
  </div>
</template>

<script>
import mindmap from '@hellowuxin/mindmap'

export default {
  name: 'App',
  components: {
    mindmap
  },
  data: () => ({
    data: [{
      "name":"如何学习D3",
      "children":
      [
        {
          "name":"预备知识",
          "children":
          [
            {"name":"HTML & CSS", "children": []},
            {"name":"JavaScript", "children": []}
        },
        {
          "name":"安装",
          "children": []
        },
        ...
      ]
    }]
  })
}
</script>
```

## Todo

- [ ] Set node width and height
- [ ] Multiple root nodes
- [ ] ...
