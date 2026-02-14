/** [功能] 创建元素 */
export function createElement(option) {
  const { type = 'div', text = '', css = '', cNames = [], attrs = [], value = '', name = '' } = option

  const el = document.createElement(type)
  el.innerText = text
  el.style.cssText = css
  if (el.value) el.value = value
  if (el.name) el.name = name
  cNames.forEach((cName) => el.classList.add(cName))
  attrs.forEach((attr) => el.setAttribute(attr.name, attr.value))

  return el
}
