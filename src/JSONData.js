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
        d.id = `${dataChild.id}${dataChild.children.length}`
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

  insert(dPosition, d, i = 0, data = this.data) { // 把d插入到dPosition的前面(i=0)或者后面(i=1)
    for (let index = 0; index < data.length; index += 1) {
      const dataChild = data[index];
      if (isEqualJSON(dataChild, dPosition)) {
        if (dPosition.id.substring(0, 1) === '0' && dPosition.id.length === 2) { // 根节点的直接子节点
          colorNumber += 1;
          d.color = colorScale(colorNumber);
        } else {
          d.color = dPosition.color;
        }
        inheritColor(d, d.color);
        data.splice(index + i, 0, d);
        return true;
      }
      if (dataChild.children) {
        if (this.insert(dPosition, d, i, dataChild.children)) {
          return true;
        }
      }
    }
    return false;
  }
}

export default JSONData;
