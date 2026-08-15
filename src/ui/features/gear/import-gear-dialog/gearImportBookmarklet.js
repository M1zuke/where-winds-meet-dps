// Runs in the browser on the official WWM dashboard, not in this app. Kept to
// ES5 syntax and executed via `new Function` in tests: a bookmarklet gets no
// transpiler, and a parse error inside a javascript: URL is silent.
;(function () {
  var CACHE_KEY = "getAreaServer"
  var TOKEN_KEY = "h72na_data_token"
  var ROLE_INFO_URL = "https://s2.easebar.com/78ae9d90792a3e9b/role/roleInfo"
  var CARRIED_FIELDS = [
    "roleName",
    "level",
    "school",
    "wearEquips",
    "wearEquipsDetailed",
    "passiveSlots",
  ]

  function looksLikeRoleInfo(value) {
    return !!value && typeof value === "object" && !!value.wearEquipsDetailed
  }

  function readCache() {
    var stored
    try {
      stored = window.localStorage.getItem(CACHE_KEY)
    } catch (storageBlocked) {
      return null
    }
    if (!stored) return null
    try {
      var parsed = JSON.parse(stored)
      return looksLikeRoleInfo(parsed) ? parsed : null
    } catch (notJson) {
      return null
    }
  }

  function readToken() {
    try {
      var stored = window.localStorage.getItem(TOKEN_KEY)
      if (stored) return stored
    } catch (storageBlocked) {
      // fall through to the cookie
    }
    var fromCookie = /(?:^|;\s*)token=([^;]+)/.exec(document.cookie || "")
    return fromCookie ? fromCookie[1] : null
  }

  function fetchRoleInfo(onDone) {
    var token = readToken()
    if (!token) {
      onDone(null, "Not logged in on this page. Open the dashboard, sign in, then run this again.")
      return
    }
    var request = new XMLHttpRequest()
    request.open("GET", ROLE_INFO_URL, true)
    request.withCredentials = true
    request.setRequestHeader("access_token", token)
    request.onload = function () {
      var payload
      try {
        payload = JSON.parse(request.responseText)
      } catch (notJson) {
        onDone(null, "The dashboard returned something unreadable.")
        return
      }
      if (!looksLikeRoleInfo(payload && payload.data)) {
        onDone(null, "The dashboard returned no gear data.")
        return
      }
      onDone(payload.data, null)
    }
    request.onerror = function () {
      onDone(null, "Could not reach the dashboard.")
    }
    request.send()
  }

  function buildEnvelope(roleInfo) {
    var envelope = { source: "wwm-dashboard", v: 1, capturedAt: new Date().toISOString() }
    for (var i = 0; i < CARRIED_FIELDS.length; i += 1) {
      var field = CARRIED_FIELDS[i]
      if (roleInfo[field] !== undefined) envelope[field] = roleInfo[field]
    }
    // Names only, never values — this is drift detection, not a second payload.
    var extras = []
    for (var key in roleInfo) {
      if (!Object.prototype.hasOwnProperty.call(roleInfo, key)) continue
      if (CARRIED_FIELDS.indexOf(key) === -1) extras.push(key)
    }
    envelope.unrecognizedPayloadKeys = extras
    return envelope
  }

  function countEntries(value) {
    if (!value || typeof value !== "object") return 0
    if (Object.prototype.toString.call(value) === "[object Array]") return value.length
    var total = 0
    for (var key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) total += 1
    }
    return total
  }

  function copyViaTextarea(text) {
    var holder = document.createElement("textarea")
    holder.value = text
    holder.setAttribute("readonly", "readonly")
    holder.style.cssText = "position:fixed;top:-1000px;left:-1000px;opacity:0"
    document.body.appendChild(holder)
    holder.select()
    var copied = false
    try {
      copied = document.execCommand("copy")
    } catch (notAllowed) {
      copied = false
    }
    document.body.removeChild(holder)
    return copied
  }

  function copy(text, onDone) {
    if (window.navigator && window.navigator.clipboard) {
      window.navigator.clipboard.writeText(text).then(
        function () {
          onDone(true)
        },
        function () {
          onDone(copyViaTextarea(text))
        },
      )
      return
    }
    onDone(copyViaTextarea(text))
  }

  function deliver(roleInfo) {
    var envelope = buildEnvelope(roleInfo)
    var text = JSON.stringify(envelope)
    copy(text, function (copied) {
      if (!copied) {
        window.prompt("Copy this, then paste it into Import Gear:", text)
        return
      }
      window.alert(
        "Copied " +
          countEntries(envelope.wearEquipsDetailed) +
          " gear pieces and " +
          countEntries(envelope.passiveSlots) +
          " inner ways. Paste them into Import Gear.",
      )
    })
  }

  var cached = readCache()
  if (cached) {
    deliver(cached)
    return
  }
  fetchRoleInfo(function (roleInfo, failure) {
    if (failure) {
      window.alert(failure)
      return
    }
    deliver(roleInfo)
  })
})()
