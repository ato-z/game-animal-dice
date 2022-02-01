/** 房间列表iframe */
var listIframe = new Promise(function(resolve) {
    var iframe = document.querySelector('#list-iframe')
    iframe.onload = function() {
        resolve(this.contentWindow)
    }
    iframe.src = './room-list.html'
})
var showListPage = function() { // 显示房间列表
    siwtchView(0)
    masterWsConnect.then(function(ws) {
        ws.send(codeSendData(null, 'room/list'))
    })
}

/** 游戏房间 */
var gameIframe = new Promise(function(resolve) {
    var iframe = document.querySelector('#game-iframe')
    iframe.onload = function() {
        resolve(this.contentWindow)
    }
    iframe.src = './game.html'
})



/** 视图切换 */
;(function () { 
    var viewElement = Array.prototype.slice.call(document.querySelectorAll('.switch-win > .view'))
    window.siwtchView = function(index) {
        viewElement.forEach(function(element, current) {
            if (current === index) {
                element.className = 'view on'
            } else {
                element.className = 'view'
            }
        })
    }
} ())

/** 新建房间 */
;(function () { 
    var formElement = document.querySelector('#create-room')
    var titleElement = document.querySelector('#room-title')
    var passKeyElemet = document.querySelector("#room-passKey")
    formElement.addEventListener('submit', function(event) {
        event.preventDefault()
        var title = titleElement.value
        var passKey = passKeyElemet.value
        masterWsConnect.then(function(ws) {
            ws.send(codeSendData({
                title: title,
                passKey: passKey
            }, 'room/new'))
        })
        titleElement.value = ''
    })
} ())

/** 加入房间 */
;(function () {
    var formElement = document.querySelector('#join-room')
    var titleElement = document.querySelector('#room-title2')
    var passKeyElemet = document.querySelector("#room-passKey2")
    formElement.addEventListener('submit', function(event) {
        event.preventDefault()
        var roomID = titleElement.value
        var passKey = passKeyElemet.value

        masterWsConnect.then(function(ws) {
            ws.send(codeSendData({
                roomID: roomID,
                passKey: passKey
            }, 'room/join'))
        })
        passKeyElemet.value = ''
    })
    window.joinRoom = function(roomID) {
        siwtchView(2)
        titleElement.value = roomID
    }
} ())