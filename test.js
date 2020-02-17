import d3flextree from 'd3-flextree'
const layout = d3flextree.flextree()
const tree = layout.hierarchy({
  size: [1, 1],
  children: [
    { size: [2, 4] },
    { size: [3, 1],
      children: [
        { size: [4, 1] },
      ],
    },
  ],
});
layout(tree);
// eslint-disable-next-line 
console.log(tree);