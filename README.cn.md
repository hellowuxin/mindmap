<img src="./public/mindmap.jpg" width="300"/>

# 思维导图VUE组件

![npm](https://img.shields.io/npm/v/@hellowuxin/mindmap)

> 一个由[MindNode](https://mindnode.com)启发的思维导图Vue组件，基于d3.js实现  
> 目前实现的功能有基本的编辑、拖移、缩放、撤销、上下文菜单...

[English Readme](./README.md)

在线演示：<https://mindnode.5xin.xyz/>

## 安装

```sh
npm install @hellowuxin/mindmap
```

```js
// 在你的vue文件中引入思维导图组件
import mindmap from '@hellowuxin/mindmap'
```

## API

| Name        | Type   | Default   | Description          |
| ---         | ---    | ---       | ---                  |
| v-model     | Array  | undefined | 设置思维导图数据        |
| width       | Number | 100%      | 设置组件宽度           |
| height      | Number | undefined | 设置组件高度           |
| xSpacing    | Number | 80        | 设置节点横向间隔        |
| ySpacing    | Number | 20        | 设置节点纵向间隔        |
| strokeWidth | Number | 4         | 设置连线的宽度          |
| draggable   | Boolean| true      | 设置节点是否可拖拽      |
| gps         | Boolean| true      | 是否显示居中按钮        |
| fitView     | Boolean| true      | 是否显示缩放按钮        |
| showNodeAdd | Boolean| true      | 是否显示添加节点按钮     |
| keyboard    | Boolean| true      | 是否响应键盘事件        |
| contextMenu | Boolean| true      | 是否响应右键菜单        |
| nodeClick   | Boolean| true      | 设置节点是否可点击、编辑 |
| zoomable    | Boolean| true      | 是否可缩放、拖移        |
| showUndo    | Boolean| true      | 是否显示撤销重做按钮     |
| download    | Boolean| true      | 是否显示下载按钮        |

## 样例

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

## 键盘事件

<kbd>⇥ tab</kbd>、<kbd>⏎ enter</kbd>、<kbd>⌫ backspace</kbd>、<kbd>⌘ cmd</kbd>+<kbd>z</kbd>、<kbd>⌘ cmd</kbd>+<kbd>y</kbd>

## 交互逻辑（待完成）

**鼠标**：space+左键移动、右键菜单、ctrl+滚轮缩放、左键选中
**触控板**：双指滚动移动、双指菜单、双指捏合缩放、单指选中、

## 待解决

- [ ] 导出多种格式
- [ ] 设置节点的宽高
- [ ] 节点折叠
- [ ] 多个根节点
- [ ] ...
