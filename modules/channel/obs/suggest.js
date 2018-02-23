var nest = require('depnest')
var {Struct, map, computed, watch} = require('mutant')

exports.needs = nest({
  'channel.obs.recent': 'first',
  'channel.obs.subscribed': 'first',
  'channel.obs.mostActive': 'first',
  'keys.sync.id': 'first'
})

exports.gives = nest('channel.async.suggest')

exports.create = function (api) {
  var suggestions = null
  var subscribed = null

  return nest('channel.async.suggest', function () {
    loadSuggestions()
    return function (word) {
      if (!word) {
        return suggestions().slice(0, 200)
      } else {
        return suggestions().filter((item) => {
          return item.title.toLowerCase().startsWith(word.toLowerCase())
        })
      }
    }
  })

  function loadSuggestions () {
    if (!suggestions) {
      var id = api.keys.sync.id()
      subscribed = api.channel.obs.subscribed(id)
      var mostActive = api.channel.obs.mostActive()
      var contacts = computed([subscribed, mostActive], function (a, b) {
        var result = Array.from(a)
        b.forEach((item, i) => {
          if (!result.includes(item[0])) {
            result.push(item)
          }
        })
        return result
      })

      suggestions = map(contacts, suggestion, {idle: true})
      watch(suggestions)
    }
  }

  function suggestion (id) {
    if (Array.isArray(id)) {
      return Struct({
        title: id[0],
        id: `#${id[0]}`,
        subtitle: computed([id[0], subscribed, `(${id[1]})`], subscribedCaption),
        value: `#${id[0]}`
      })
    } else {
      return Struct({
        title: id,
        id: `#${id}`,
        subtitle: computed([id, subscribed], subscribedCaption),
        value: `#${id}`
      })
    }
  }
}

function subscribedCaption (id, subscribed, fallback) {
  if (subscribed.has(id)) {
    return 'subscribed'
  } else {
    return fallback || ''
  }
}
