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

  del(s, d = this.data) { // 删除s
    for (let index = 0; d && index < d.length; index += 1) {
      const dChild = d[index];
      if (isEqualJSON(dChild, s)) {
        d.splice(index, 1);
        return true;
      }
      if (dChild.children) {
        if (this.del(s, dChild.children)) {
          return true;
        }
      }
    }
    return false;
  }

  add(dParent, d, data = this.data) { // dParent添加子节点d
    for (let index = 0; index < data.length; index += 1) {
      const dataChild = data[index];
      if (isEqualJSON(dataChild, dParent)) {
        if (!dataChild.children) {
          dataChild.children = [];
        }
        if (dataChild.id === '0') { // 根节点
          d.color = colorScale(colorNumber);
          colorNumber += 1;
        } else {
          d.color = dataChild.color; // 继承父节点的color
        }
        inheritColor(d, d.color);
        d.id = `${dataChild.id}${dataChild.children.length}`;
        dataChild.children.push(d);
        return true;
      }
      if (dataChild.children) {
        if (this.add(dParent, d, dataChild.children)) {
          return true;
        }
      }
    }
    return false;
  }

  exchange(a, b, d = this.data) { // 同一父节点下的a,b调换
    for (let index = 0; index < d.length; index += 1) {
      const dChildA = d[index];
      if (isEqualJSON(dChildA, a)) {
        for (let i = 0; i < d.length; i += 1) {
          const dChildB = d[i];
          if (isEqualJSON(dChildB, b)) {
            d[index] = dChildB;
            d[i] = dChildA;
          }
        }
        return true;
      }
      if (dChildA.children) {
        if (this.exchange(a, b, dChildA.children)) {
          return true;
        }
      }
    }
    return false;
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
        d.id = children[position + i].id;
        for (let index = position + i; index < children.length; index++) {
          const child = children[index];
          const id = child.id.split('');
          id[id.length-1] = (parseInt(id[id.length-1], 10) + 1).toString();
          child.id = id.join('');
          if (child.children.length > 0) {
            this._addId(child.id, child.children);
          }
        }
        if (parent.color) {
          d.color = parent.color; 
        } else {
          colorNumber += 1;
          d.color = colorScale(colorNumber);
        }
        children.splice(position + i, 0, d);
      } else {
        this.add(parent, d);
      }
    }
  }
}

export default JSONData;
