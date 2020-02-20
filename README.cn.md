<img src="./public/mindmap.jpg" width="300"/>

# 思维导图VUE组件

![npm](https://img.shields.io/npm/v/@hellowuxin/mindmap)

目标是实现一个跟[MindNode](https://mindnode.com)近似的网页思维导图组件

[English Readme](./README.md)

## 功能

支持键盘和鼠标

- 拖移
- 缩放
- 节点的增删改
- ...

## 使用

- Tab - 添加子节点
- Enter - 添加兄弟节点
- delete - 删除节点
- 右键 - 菜单
- 单击两次 - 编辑节点内容
- ...

在线演示：<https://mindnode.5xin.xyz>

## 安装

```sh
npm install @hellowuxin/mindmap
```

```js
// 在你的vue文件中引入思维导图组件
import mindmap from '@hellowuxin/mindmap'
```

## API

| Name      | Type   | Default   | Description      |
| ---       | ---    | ---       | ---              |
| v-model   | Array  | undefined | 设置思维导图数据    |
| draggable | Boolean| true      | 设置节点是否可拖拽  |
| width     | Number | 100%      | 设置组件宽度       |
| height    | Number | 100%      | 设置组件高度       |
| xSpacing  | Number | 80        | 设置节点横向间隔    |
| ySpacing  | Number | 20        | 设置节点纵向间隔    |

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

## 待解决

- [ ] 设置节点的宽高
- [ ] 多个根节点
- [ ] ...
