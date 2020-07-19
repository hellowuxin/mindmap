function deepTraverse(d, m, md, flag) {
  for (let index = 0; index < d?.length; index += 1) {
    const dChild = d[index]
    if (m.length > 3 && m[0] === '#') { // #### 替换成 -
      md += `- ${dChild.name}\n`
      md = deepTraverse(dChild.children, `  -`, md, '  ')
    } else {
      md += `${m} ${dChild.name}\n`
      md = deepTraverse(dChild.children, `${flag}${m}`, md, flag)
    }
  }
  return md
}

function toMarkdown(data) {
  const d = Array.isArray(data) ? data : [data]
  return deepTraverse(d, '#', '', '#')
}

export default toMarkdown