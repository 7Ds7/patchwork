const nest = require('depnest')
var { clipboard, shell } = require('electron')
var { h, computed, map, send } = require('mutant')

exports.gives = nest('message.html.decorate')
exports.needs = nest({
  'sheet.display': 'first',
  'intl.sync.i18n': 'first'
})

exports.create = (api) => {
  const i18n = api.intl.sync.i18n
  return nest('message.html.decorate', function (element, { msg }) {
    // accessed from lib/context-menu-and-spellcheck
    element.msg = msg
    constructMenu(element);
    return element
  })

  function constructMenu (elm) {
    var menu_wrapper = elm.querySelector('.js-message-menu-wrapper')
    var menu_trigger = h('a.message-menu-trigger', {href: '#', 'ev-click': send(showMenu, elm) }, ['⋮⋮'])
    var menu = h('div.message-menu', {'ev-mouseleave': function() {hideMenu(elm)} }, [
        h('a', {
          href:'#',
          'ev-click': send (copyMessageID, elm)
        },'Copy Message ID' ),
        h('a', {
          href:'#',
          'ev-click': send (copyMessageText, elm)
        },'Copy Message Text' ),
        h('a', {
          href:'#',
          'ev-click': send (openExternalLink, elm)
        },'Open External Link' ),
        h('a', {
          href:'#',
          'ev-click': send (viewMessageSource, elm)
        },'View Source' )
      ])

    if ( menu_wrapper ) {
      menu_wrapper.appendChild(menu_trigger)
      menu_wrapper.appendChild(menu)
    }
  }

  function copyMessageID (elm) {
    clipboard.writeText(elm.msg.key)
    hideMenu(elm)
  }

  function copyMessageText (elm) {
    clipboard.writeText(elm.msg.value.content.text)
    hideMenu(elm)
  }

  function openExternalLink (elm) {
    const key = elm.msg.key
    const gateway = 'https://viewer.scuttlebot.io'
    const url = `${gateway}/${encodeURIComponent(key)}`
    shell.openExternal(url)
    hideMenu(elm)
  }

  function viewMessageSource (elm) {
    api.sheet.display(close => {

      return {
        content: h('div', {
          style: {
            padding: '20px'
          }
        }, [
          h('h2', {
            style: {
              'font-weight': 'normal'
            }
          }, 'Message Source'),
          h('pre', {
            style: {
              'white-space': 'pre-wrap',
              'word-wrap': 'break-word'
            },
            'contentEditable': true
          }, JSON.stringify(elm.msg, null, 2) )
        ]),
        footer: [
          h('button -close', {
            'ev-click': close
          }, i18n('Close'))
        ]
      }
    })
    hideMenu(elm)

  }

  function showMenu(elm) {
    var cmenu = elm.querySelector('.message-menu')
    var all_menus = document.querySelectorAll('.message-menu.show')
    all_menus.forEach( (e,i) => {
      e.classList.remove('show')
    })
    if ( !cmenu.classList.contains('show') ) {
      cmenu.classList.add('show');
    }
  }

  function hideMenu(elm) {
    var cmenu = elm.querySelector('.message-menu');
    if ( cmenu.classList.contains('show') ) {
      cmenu.classList.remove('show');
    }
  }

}
