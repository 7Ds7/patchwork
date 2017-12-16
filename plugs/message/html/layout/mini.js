const { h, computed } = require('mutant')
var nest = require('depnest')
var ref = require('ssb-ref')

exports.needs = nest({
  'profile.html.person': 'first',
  'message.obs.backlinks': 'first',
  'message.obs.name': 'first',
  'contact.obs.following': 'first',
  'keys.sync.id': 'first',
  'message.html': {
    link: 'first',
    meta: 'map',
    action: 'map',
    timestamp: 'first',
    backlinks: 'first'
  },
  'about.html.image': 'first',
  'intl.sync.i18n': 'first'
})

exports.gives = nest('message.html.layout')

exports.create = function (api) {
  const i18n = api.intl.sync.i18n
  var yourFollows = null

  // to get sync follows
  setImmediate(() => {
    var yourId = api.keys.sync.id()
    yourFollows = api.contact.obs.following(yourId)
  })

  return nest('message.html.layout', layout)

  function layout (msg, {layout, previousId, priority, miniContent, content, includeReferences, includeForks = true}) {
    if (!(layout === 'mini')) return
    var classList = ['Message -mini']

    if (yourFollows && yourFollows().includes(msg.value.author)) {
      classList.push('-following')
    }

    var replyInfo = null

    if (msg.value.content.root) {
      classList.push('-reply')
      var branch = msg.value.content.branch
      if (branch) {
        if (!previousId || (previousId && last(branch) && previousId !== last(branch))) {
          replyInfo = h('span', ['in reply to ', api.message.html.link(last(branch))])
        }
      }
    } else if (msg.value.content.project) {
      replyInfo = h('span', ['on ', api.message.html.link(msg.value.content.project)])
    }

    if (priority === 2) {
      classList.push('-new')
    }

    return h('div', {
      classList
    }, [
      messageHeader(msg, {
        replyInfo, priority, miniContent
      }),
      h('section', [content]),
      computed(msg.key, (key) => {
        if (ref.isMsg(key)) {
          return h('footer', [
            h('div.actions', [
              api.message.html.action(msg)
            ])
          ])
        }
      }),
      api.message.html.backlinks(msg, {includeReferences, includeForks})
    ])

    // scoped

    function messageHeader (msg, {replyInfo, priority, miniContent}) {
      var yourId = api.keys.sync.id()
      var additionalMeta = []
      if (priority >= 2) {
        additionalMeta.push(h('span.flag -new', {title: 'New Message'}))
      }
      return h('header', [
        h('div.main', [
          h('a.avatar', {href: `${msg.value.author}`}, [
            api.about.html.image(msg.value.author)
          ]),
          h('div.main', [
            h('div.name', [
              api.profile.html.person(msg.value.author),
              msg.value.author === yourId ? [' ', h('span.you', {}, i18n('(you)'))] : null
            ]),
            h('div.meta', [
              miniContent, ' ',
              replyInfo
            ])
          ])
        ]),
        h('div.meta', [
          api.message.html.meta(msg),
          additionalMeta,
          h('strong', api.message.html.timestamp(msg))
        ]),
        h('div.message-menu-wrapper.js-message-menu-wrapper')
      ])
    }
  }
}

function last (array) {
  if (Array.isArray(array)) {
    return array[array.length - 1]
  } else {
    return array
  }
}
