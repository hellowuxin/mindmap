import html2canvas from 'html2canvas'

function toPng(node: HTMLElement, name: string, width: number, height: number, type: string = 'png') {
  html2canvas(node, {
    width: width,
    height: height,
  }).then(canvas => {
    const dataImg = new Image()
    dataImg.src = canvas.toDataURL('image/' + type)
    const alink = document.createElement('a')
    alink.href = dataImg.src
    alink.download = name
    alink.click()
  })
}
export default toPng
