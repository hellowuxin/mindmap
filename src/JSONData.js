import * as d3 from 'd3';
let colorNumber = 0;
const colorScale = d3.scaleOrdinal(d3.schemePaired);// 颜色列表
function isEqualJSON(a, b) { // 判断a，b是否完全一致
  // 局限性：
  // 如果对象里属性的位置发生变化，转换来的字符串就不相等
  // 但实际我们只需要看他们的内容是否一致，与顺序没有关系，所以这种方法有局限性。
  const aStr = JSON.stringify(a);
  const bStr = JSON.stringify(b);
  if (aStr === bStr) {
    return true;
  }
  return false;
}
function breadthTraverse(d, c) { // 广度遍历
  if (d.children) {
    for (let index = 0; index < d.children.length; index += 1) {
      const dChild = d.children[index];
      if (!c) {
        dChild.color = colorScale(colorNumber);
        colorNumber += 1;
      } else {
        dChild.color = c;
      }
    }
    for (let index = 0; index < d.children.length; index += 1) {
      const dChild = d.children[index];
      breadthTraverse(dChild, dChild.color);
    }
  }
}
function inheritColor(d, c) { // 赋予新颜色，并更新子节点的颜色
  if (d.children) {
    for (let index = 0; index < d.children.length; index += 1) {
      const dChild = d.children[index];
      dChild.color = c;
      inheritColor(dChild, c);
    }
  }
}
class JSONData {
  constructor(d) { // d为数组
    this.data = JSON.parse(JSON.stringify(d));// 深拷贝对象
    breadthTraverse(this.data[0]);
    this._addId();
  }

  _addId(id = '', d = this.data) { // 添加唯一标识
    for (let index = 0; index < d.length; index += 1) {
      const dChild = d[index];
      dChild.id = `${id}${index}`;
      if (dChild.children) {
        this._addId(`${id}${index}`, dChild.children);
      }
    }
  }

  getPuredata(d = JSON.parse(JSON.stringify(this.data))) {
    for (let index = 0; index < d.length; index += 1) {
      const dd = d[index];
      const keys = Object.keys(dd);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (k !== 'name' && k !== 'children') {
          delete dd[k];
        }
      }
      if (dd.children) {
        this.getPuredata(dd.children);
      }
    }
    return d;
  }

  del(s) { // 删除s
    const parent = this.getParent(s);
    if (parent) {
      const children = parent.children;
      let position = 0;

      for (let index = 0; index < children.length; index++) {
        const child = children[index];
        if (isEqualJSON(child, s)) {
          position = index;
        }
      }
      children.splice(position, 1);
      this._addId(parent.id, parent.children);
    }
  }

  getItself(d, data = this.data) {
    let dSelf = data;
    const id = d.id.split('').map(s => parseInt(s, 10));
    if (id.length > 0) {
      for (let index = 0; index < id.length - 1; index++) {
        const number = id[index];
        dSelf = dSelf[number].children;
      }
      dSelf = dSelf[id[id.length - 1]];
      return dSelf; 
    }
    return false;
  }

  add(dParent, d) { // dParent添加子节点d
    const parent = this.getItself(dParent);
    if (parent.id === '0') { // 根节点
      if (!d.color) {
        d.color = colorScale(colorNumber);
        colorNumber += 1;
      }
    } else {
      d.color = parent.color; // 继承父节点的color
    }
    inheritColor(d, d.color);
    d.id = `${parent.id}${parent.children.length}`;
    parent.children.push(d);
    this._addId(`${d.id}`, d.children);
  }

  getParent(d, data = this.data) {
    let dParent = data;
    const id = d.id.split('').map(s => parseInt(s, 10));
    id.pop();
    if (id.length > 0) {
      for (let index = 0; index < id.length - 1; index++) {
        const number = id[index];
        dParent = dParent[number].children;
      }
      dParent = dParent[id[id.length - 1]];
      return dParent; 
    }
    return false;
  }

  insert(dPosition, d, i = 0) { // 把d插入到dPosition的前面(i=0)或者后面(i=1)
    const parent = this.getParent(dPosition);
    if (parent) {
      const children = parent.children;
      let position = 0;

      for (let index = 0; index < children.length; index++) {
        const child = children[index];
        if (isEqualJSON(child, dPosition)) {
          position = index;
        }
      }
      if ((position+i) < children.length) { // 更新id
        if (parent.id === '0') { // 根节点
          if (!d.color) {
            d.color = colorScale(colorNumber);
            colorNumber += 1;
          }
        } else {
          d.color = parent.color; // 继承父节点的color
        }
        children.splice(position + i, 0, d);
        this._addId(parent.id, children)
      } else {
        this.add(parent, d);
      }
    }
  }
}

export default JSONData;
