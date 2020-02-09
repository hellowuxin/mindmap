// MoorSwitch 是对应组件的名字，要记得在 moor-switch.vue 文件中还是 name 属性哦
import mindmap from './components/MindMap';

mindmap.install = Vue => Vue.component(mindmap.name, mindmap);

export default mindmap;