# 思维导图组件-mindmap

尝试将思维导图组件化并发布到npm

## 背景-Background

## 安装-Install

```sh
npm install @hellowuxin/mindmap
```

```js
// 在你的vue文件中引入思维导图组件
import mindmap from '@hellowuxin/mindmap'
```

## 使用方法-Usage

| Name    | Type   | Default   | Description    |
| ---     | ---    | ---       | ---            |
| v-model | Array  | undefined | 设置思维导图数据  |
| width   | Number | 700       | 设置组件宽度     |
| height  | Number | 700       | 设置组件高度     |

## 样例-Example

![思维导图](./public/mindmap.png)

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
