<img src="./public/mindmap.jpg" width="300"/>

# Mindmap Vue Component

![npm](https://img.shields.io/npm/v/@hellowuxin/mindmap)

> A mind map Vue component inspired by [MindNode](https://mindnode.com), based on d3.js  
> The functions currently implemented include editing, dragging, zooming, undoing, and context menu ...

[中文说明](./README.md)

Online demo：<https://mindnode.5xin.xyz/>

## Install

```sh
npm install @hellowuxin/mindmap
```

```js
// In your vue file
import mindmap from '@hellowuxin/mindmap'
```

## API

| Name        | Type   | Default   | Description                                    |
| ---         | ---    | ---       | ---                                            |
| v-model     | Array  | undefined | Set up mindmap data                            |
| width       | Number | 100%      | Set component width                            |
| height      | Number | undefined | Set component height                           |
| xSpacing    | Number | 80        | Set node horizontal spacing                    |
| ySpacing    | Number | 20        | Set node vertical spacing                      |
| strokeWidth | Number | 4         | Set the width of the line                      |
| draggable   | Boolean| true      | Set whether node is draggable                  |
| gps         | Boolean| true      | Whether to show center button                  |
| fitView     | Boolean| true      | Whether to show zoom button                    |
| showNodeAdd | Boolean| true      | Whether to show add-node button                |
| keyboard    | Boolean| true      | Whether to respond to keyboard event           |
| contextMenu | Boolean| true      | Whether to respond to contextMenu event        |
| nodeClick   | Boolean| true      | Set whether the node can be clicked and edited |
| zoomable    | Boolean| true      | Whether it can be zoomed or dragged            |
| showUndo    | Boolean| true      | Whether to show the undo/redo button           |
| download    | Boolean| true      | Whether to show the download button            |

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

## Keyboard Event

<kbd>⇥ tab</kbd>、<kbd>⏎ enter</kbd>、<kbd>⌫ backspace</kbd>、<kbd>⌘ cmd</kbd>+<kbd>z</kbd>、<kbd>⌘ cmd</kbd>+<kbd>y</kbd>

## Todo

- [ ] Export multiple formats
- [ ] Set node width and height
- [ ] Multiple root nodes
- [ ] Collapse node
- [ ] ...
