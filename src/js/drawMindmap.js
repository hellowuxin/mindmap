import * as d3 from 'd3'

const easePolyInOut = d3.transition().duration(1000).ease(d3.easePolyInOut);

function drawMindnode(dJSON) {
  const { mindmap_g } = this;
  const { updateNodeName, showContextMenu } = this;

  let root = null;
  const link = d3.linkHorizontal().x((d) => d[0]).y((d) => d[1]);
  function gBtnClick(d, i, n) { // 添加子节点
    d3.event.stopPropagation();// 阻止捕获和冒泡阶段中当前事件的进一步传播。
    d3.select(n[i].parentNode).each((d) => {
      const newJSON = { name: '新建节点', children: [] };
      dJSON.add(d.data, newJSON);
    })
  }
  function rectTriggerOver(d, i, n) {
    let gBtn = null;
    if (n[i].className.baseVal.includes('gButton')) {
      gBtn = d3.select(n[i]);
      gBtn.style('opacity', 1);
    } else {
      const collection = n[i].parentNode.children;
      gBtn = d3.select(collection[collection.length - 1]);
      gBtn.style('opacity', 0.5);
    }
  }
  function rectTriggerOut(d, i, n) {
    let gBtn = null;
    if (n[i].className.baseVal.includes('gButton')) {
      gBtn = d3.select(n[i]);
      gBtn.style('opacity', 0);
    } else {
      const collection = n[i].parentNode.children;
      gBtn = d3.select(collection[collection.length - 1]);
      gBtn.style('opacity', 0);
    }
  }
  function draggedNodeRenew(draggedNode, targetX, targetY, dura) {
    const tran = d3.transition().duration(dura).ease(d3.easePoly);
    d3.select(draggedNode).transition(tran).attr('transform', `translate(${targetY},${targetX})`);
    // 更新draggedNode与父节点的path
    d3.select(draggedNode).each((d) => {
      d3.select(`path#path_${d.data.id}`).transition(tran).attr('d', `${link({
        source: [-targetY + (d.parent ? d.parent.data.textWidth : 0), -targetX],
        target: [0, 0],
      })}L${d.data.textWidth},0`);
    });
  }
  function draggedNodeChildrenRenew(d, px, py) {
    d.px = px;
    d.py = py;
    if (d.children) {
      for (let index = 0; index < d.children.length; index += 1) {
        const dChild = d.children[index];
        draggedNodeChildrenRenew(dChild, px, py);
      }
    }
  }
  function dragback(subject, draggedNode) {
    draggedNodeChildrenRenew(subject, 0, 0);
    draggedNodeRenew(draggedNode, subject.dx, subject.dy, 1000);
  }
  function selectMindnode(clickedNode, sele) {
    // 选中新的selectedMindnode
    if (sele) { sele.removeAttribute('id') }
    sele = d3.select(clickedNode);
    sele.attr('id', 'selectedMindnode');
  }
  function click(d, i, n) {
    d3.event.stopPropagation();// 阻止捕获和冒泡阶段中当前事件的进一步传播。
    let sele = document.getElementById('selectedMindnode');
    const edit = document.getElementById('editing');
    const clickedNode = n[i].parentNode;
    if (edit) { // 正在编辑
    } else if (clickedNode.isSameNode(sele)) { // 进入编辑状态
      sele.setAttribute('id', 'editing');
      d3.select(sele).select('div').attr('contenteditable', true);
      document.querySelector('#editing div').focus();
    } else { // 选中
      selectMindnode(clickedNode, sele);
    }
  }
  function rightClick(d, i, n) {
    d3.event.preventDefault();
    d3.event.stopPropagation();// 阻止捕获和冒泡阶段中当前事件的进一步传播。
    let sele = document.getElementById('selectedMindnode');
    const edit = document.getElementById('editing');
    const clickedNode = n[i].parentNode;
    if (clickedNode.isSameNode(edit)) { // 正在编辑
      return;
    }
    if (!clickedNode.isSameNode(sele)) { // 选中
      selectMindnode(clickedNode, sele);
    }
    showContextMenu(d3.event);
  }
  function dragged(d, i, n) {
    const draggedNode = n[i];
    // 选中
    const sele = document.getElementById('selectedMindnode');
    if (sele && !sele.isSameNode(draggedNode)) {
      sele.removeAttribute('id');
    }
    // 拖拽
    const { subject } = d3.event;
    const py = d3.event.x - subject.x;
    const px = d3.event.y - subject.y;
    draggedNodeChildrenRenew(subject, px, py);
    // 相对subject.parent的坐标
    const targetY = subject.dy + py;
    const targetX = subject.dx + px;
    draggedNodeRenew(draggedNode, targetX, targetY, 0);
    // 重叠触发矩形边框
    const gSelection = mindmap_g.selectAll('g').filter((d, i, n) => !draggedNode.isSameNode(n[i]) && !draggedNode.parentNode.isSameNode(n[i]));
    gSelection.each((d, i, n) => {
      const gNode = n[i];
      const gRect = gNode.getElementsByTagName('rect')[0];
      const rect = { // 各个gRect相对subject.parent的坐标，以及gRect的宽高
        y: parseInt(gRect.getAttribute('x'), 10) + d.y + (d.py ? d.py : 0) - (subject.parent ? subject.parent.y : 0),
        x: parseInt(gRect.getAttribute('y'), 10) + d.x + (d.px ? d.px : 0) - (subject.parent ? subject.parent.x : 0),
        width: parseInt(gRect.getAttribute('width'), 10),
        height: parseInt(gRect.getAttribute('height'), 10),
      };
      if ((targetY > rect.y) && (targetY < rect.y + rect.width)
      && (targetX > rect.x) && (targetX < rect.x + rect.height)) {
        gNode.setAttribute('id', 'newParentNode');
      } else if (gNode.getAttribute('id') === 'newParentNode') {
        gNode.removeAttribute('id');
      }
    });
  }
  function dragended(d, i, n) {
    const { subject } = d3.event;
    const draggedNode = n[i];
    let draggedParentNode = draggedNode.parentNode;
    if (draggedParentNode.isEqualNode(mindmap_g.nodes()[0])) { // 拖拽的是根节点时复原
      dragback(subject, draggedNode);
      return;
    }
    const newParentNode = document.getElementById('newParentNode');
    if (newParentNode) { // 建立新的父子关系
      newParentNode.removeAttribute('id');
      d3.select(draggedNode).each((draggedD) => {
        d3.select(newParentNode).each((newParentD) => {
          // 处理数据
          dJSON.del(draggedD.data);
          dJSON.add(newParentD.data, draggedD.data);
          draggedNode.parentNode.removeChild(draggedNode);// 必要，使动画看起来更流畅
          // 绘制图形
          chart(dJSON);
        });
      });
      return;
    }
    if (Math.abs(subject.px) < root.nodeHeight) { // 平移距离不足以调换兄弟节点顺序时复原
      dragback(subject, draggedNode);
      return;
    }
    // 调换兄弟节点顺序
    draggedParentNode = d3.select(draggedParentNode);
    draggedParentNode.each((d) => {
      const draggedBrotherNodes = draggedParentNode.selectAll(`g.depth_${d.depth + 1}`).filter((a, i, n) => !draggedNode.isSameNode(n[i]));
      if (!draggedBrotherNodes.nodes()[0]) { // 无兄弟节点时复原
        dragback(subject, draggedNode);
        return;
      }
      const a = { x0: Infinity, x1: -Infinity };
      draggedBrotherNodes.each((b, i, n) => {
        if (b.x > subject.x && b.x > a.x1 && b.x < (subject.x + subject.px)) { // 新哥哥节点
          a.x1 = b.x;
          a.b1 = b.data;
          a.n1 = n[i];
        }
        if (b.x < subject.x && b.x < a.x0 && b.x > (subject.x + subject.px)) { // 新弟弟节点
          a.x0 = b.x;
          a.b0 = b.data;
          a.n0 = n[i];
        }
      });
      if (a.b0 || a.b1) { // 存在新兄弟节点时调换节点顺序
        dJSON.del(subject.data);
        if (a.b0) { // 插入在兄弟节点前面
          dJSON.insert(a.b0, subject.data);
          draggedNode.parentNode.insertBefore(draggedNode, a.n0);
        } else if (a.b1) { // 插入在兄弟节点后面
          dJSON.insert(a.b1, subject.data, 1);
          draggedNode.parentNode.insertBefore(draggedNode, a.n1.nextSibling);
        }
        chart(dJSON);
      } else {
        dragback(subject, draggedNode);
      }
    });
  }
  function appendNode(enter) {
    const gNode = enter.append('g');
    gNode.attr('class', (d) => `depth_${d.depth}`)
      .attr('transform', (d) => `translate(${d.dy},${d.dx})`);
    const foreign = gNode.append('foreignObject')
      .attr('width', (d) => d.data.textWidth + 11)
      .attr('height', 30)
      .attr('transform', `translate(${-5},${-27})`);
    const foreignP = foreign.append('xhtml:div')
      .attr('contenteditable', false)
      .text((d) => d.data.name);
    foreignP.on('blur', updateNodeName);
    const rect = gNode.append('rect').attr('class', (d) => `depth_${d.depth} textRect`)
      .attr('y', -17 - 4)
      .attr('x', -4)
      .attr('width', (d) => d.data.textWidth + 8)
      .attr('height', 16 + 8)
      .attr('rx', 3)
      .attr('ry', 3)
      .lower();
    const rectTrigger = gNode.append('rect').attr('class', (d) => `depth_${d.depth} rectTrigger`)
      .attr('y', -17 - 8)
      .attr('x', -8)
      .attr('width', (d) => d.data.textWidth + 16)
      .attr('height', 16 + 16)
      .attr('opacity', 0)
      .on('mouseover', rectTriggerOver)
      .on('mouseout', rectTriggerOut)
      .on('click', click)
      .on('contextmenu', rightClick);
    
    const gBtn = gNode.append('g').attr('class', 'gButton')
      .attr('transform', (d) => `translate(${d.data.textWidth + 8},${-12})`)
      .on('mouseover', rectTriggerOver)
      .on('mouseout', rectTriggerOut)
      .on('click', gBtnClick);
    gBtn.append('rect')
      .attr('width', 24)
      .attr('height', 24)
      .attr('rx', 3)
      .attr('ry', 3);
    gBtn.append('path')
      .attr('d', 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z');
    
    const enterData = enter.data();
    if (enterData.length) {
      if (enterData[0].data.id !== '0') {
        gNode.append('path')
          .attr('id', (d) => `path_${d.data.id}`)
          .attr('class', (d) => `depth_${d.depth}`)
          .lower()
          .attr('stroke', (d) => d.data.color)
          .attr('d', (d) => `${link({
            source: [
              (d.parent ? d.parent.y + d.parent.data.textWidth : 0) - d.y,
              (d.parent ? d.parent.x : 0) - d.x,
            ],
            target: [0, 0],
          })}L${d.data.textWidth},0`);
      } else if (enterData[0].data.id === '0') { // 根节点
        foreign.attr('transform', `translate(${-10},${-15})`);
        rect.attr('y', -9 - 4).attr('x', -5 - 4);
        rectTrigger.attr('y', -9 - 8).attr('x', -5 - 8);
      }

      gNode.each((d, i) => {
        const dd = d.children;

        if (dd) {
          const gChildren = gNode.filter((a, index) => {
            return i === index
          }).selectAll(`g${dd[0] ? `.depth_${dd[0].depth}` : ''}`)
            .data(dd)
            .join(
              (enter) => appendNode(enter),
              (update) => updateNode(update),
              (exit) => exitNode(exit)
            );
          if (!dd[0] || dd[0].depth !== 0) { // 非根节点才可以拖拽
            gChildren.call(d3.drag().on('drag', dragged).on('end', dragended));
          }
        }
      });
    }

    gBtn.raise();
    return gNode;
  }
  function updateNode(update) {
    update.attr('class', (d) => `depth_${d.depth}`)
      .transition(easePolyInOut)
      .attr('transform', (d) => `translate(${d.dy},${d.dx})`);
    update.each((d, i, n) => {
      const node = d3.select(n[i]);
      node.select('foreignObject').attr('width', d.data.textWidth + 11);
      node.select('div').text(d.data.name);
      node.select('rect.textRect').attr('class', `depth_${d.depth} textRect`)
        .attr('width', d.data.textWidth + 8);
      node.select('rect.rectTrigger').attr('class', `depth_${d.depth} rectTrigger`)
        .attr('width', (d) => d.data.textWidth + 16)
      node.select('path')
        .attr('id', `path_${d.data.id}`)
        .attr('class', `depth_${d.depth}`)
        .attr('stroke', d.data.color)
        .transition(easePolyInOut)
        .attr('d', `${link({
          source: [
            (d.parent ? d.parent.y + d.parent.data.textWidth : 0) - d.y,
            (d.parent ? d.parent.x : 0) - d.x,
          ],
          target: [0, 0],
        })}L${d.data.textWidth},0`);
      
      node.each((d, i) => {
        const dd = d.children;
        
        if (dd) {
          const gChildren = node.filter((a, index) => {
            return i === index
          }).selectAll(`g${dd[0] ? `.depth_${dd[0].depth}` : ''}`)
            .data(dd)
            .join(
              (enter) => appendNode(enter),
              (update) => updateNode(update),
              (exit) => exitNode(exit)
            );
          if (!dd[0] || dd[0].depth !== 0) { // 非根节点才可以拖拽
            gChildren.call(d3.drag().on('drag', dragged).on('end', dragended));
          }
        }
      });
      
      node.selectAll('g.gButton')
        .filter((d, i, n) => n[i].parentNode === node.node())
        .attr('transform', `translate(${d.data.textWidth + 8},${-12})`)
        .raise();
    });
    return update;
  }
  function exitNode(exit) {
    exit.filter((d, i, n) => {
      if (n[i].classList[0] === 'gButton') {
        return false;
      }
      return true;
    }).remove();
  }
  function gNodeNest(d, gParent) { // 生成svg
    const gChildren = gParent.selectAll(`g${d[0] ? `.depth_${d[0].depth}` : ''}`)
      .data(d)
      .join(
        (enter) => appendNode(enter),
        (update) => updateNode(update),
        (exit) => exitNode(exit)
      );
    if (!d[0] || d[0].depth !== 0) { // 非根节点才可以拖拽
      gChildren.call(d3.drag().on('drag', dragged).on('end', dragended));
    }
  }
  function renewY(r, textWidth) {
    r.y += textWidth;
    if (r.children) {
      for (let index = 0; index < r.children.length; index += 1) {
        const rChild = r.children[index];
        renewY(rChild, textWidth + r.data.textWidth);
      }
    }
  }
  function chart(d) { // 数据处理
    const r = d3.hierarchy(d.data[0]);// 根据指定的分层数据构造根节点
    r.nodeHeight = 35;
    r.nodeWidth = 100;// r.height与叶子节点的最大距离
    // nodeSize设置了节点的大小（高宽)
    // 高指两个叶子节点的纵向距离，宽指两个节点的横向距离
    root = d3.tree().nodeSize([r.nodeHeight, r.nodeWidth])(r);
    let x0 = Infinity;
    let x1 = -x0;
    renewY(root, 0);
    root.each((a) => {
      if (a.x > x1) x1 = a.x;// 求得最大，即最低点
      if (a.x < x0) x0 = a.x;// 求得最小，即最高点
    });
    root.each((a) => {
      // 处理偏移量确保图像完全显示
      a.x -= (x0 - 30);
      a.y += 15;
      // 相对偏移
      a.dx = a.x - (a.parent ? a.parent.x : 0);
      a.dy = a.y - (a.parent ? a.parent.y : 0);

      if (!a.children) {
        a.children = [];
      }
    });
    gNodeNest([root], mindmap_g);
  }
  chart(dJSON);
}

export default drawMindnode;