var h = require('mutant/h')
var nest = require('depnest')

exports.gives = nest('sheet.display')

exports.create = function () {
  return nest('sheet.display', function (handler) {
    var {content, footer, classList} = handler(done)

    var container = h('div', {className: 'Sheet', classList}, [
      h('section', [content]),
      h('footer', [footer])
    ])

    document.body.appendChild(container)

    function done () {
      document.body.removeChild(container)
    }
  })
}
