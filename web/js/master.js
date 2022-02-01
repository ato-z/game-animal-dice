/** 与服务端对照枚举 */
var ENUM_SAY = {
    ERROR:           -1, // 错误信息
    PUBLIC:           0, // 公告发言
    USER_JION:        101, // 加入房间
    USER_OUT:         102, // 加入房间
    USER_SAY:         103, // 用户发言
    USER_DETAIL:      104, // 用户信息
    USER_BUSY:        105, // 用户抢登

    ROOM_LIST:        200, // 房间列表
    ROOM_DETAIL:      201, // 房间信息
    ROOM_MEMBERS:     202, // 房间内成员信息
    ROOM_STAKE:       203, // 玩家下注
    ROLL:             204, // 骰子滚动

    RESULT:           300, // 详情开奖信息
    RESULT_SMIPLE:    301, // 简短的开奖
    RESULT_CLEAR:     302, // 游戏进行清算，并将用户积分全重置为0
}
var handleFragment = {}

/** 统一发送到服务器的格式 */
var codeSendData = function (data, path) {
    var codeData = {
        ukey: userKey,
        data: data,
        path: path || ''
    }
    return JSON.stringify(codeData)
}

/*=========== 一个枚举类型对应一个动作 ===========*/
/** 异常提示信息 */
handleFragment[ENUM_SAY.ERROR] = function (res) {
    top.msg(res.msg)
}
/** 用户相关 */
handleFragment[ENUM_SAY.USER_JION] = function (res) { // 用户加入房间
    gameIframe.then(function(win) {
        win.pushChatItem(res.data, 0)
    })
    masterWsConnect.then(function (ws) {
        ws.send(codeSendData(null, 'room/detail'))
        siwtchView(3)
    })
}

window.backRoom = function() {
    masterWsConnect.then(function (ws) {
        ws.send(codeSendData(null, 'room/out'))
        showListPage()
    })
}
handleFragment[ENUM_SAY.USER_OUT] = function (res) { // 用户退出房间
    gameIframe.then(function(win) {
        win.pushChatItem(res.data, 0)
    })
}
handleFragment[ENUM_SAY.USER_SAY] = function (res) { // 用户发言
    gameIframe.then(function (win) {
        win.pushChatItem(res.data, 1)
    })
}
handleFragment[ENUM_SAY.USER_DETAIL] = function (res) { // 用户详情信息
    var data = res.data
    // 更新用户昵称
    gameIframe.then(function(win) {
        win.setCurrentNickName(data.name)
    })
    // 不存在房间id， 说明没有加入任何房间
    if (data.roomID === null) { return showListPage() }
    // 存在房间id，进行免密登录
    masterWsConnect.then(function (ws) {
        ws.send(codeSendData({
            roomID: data.roomID,
            sign: data.sign
        }, 'room/joinBySign'))
    })
}
window.setNickName = function (name) { // 设置用户昵称
    masterWsConnect.then(function (ws) {
        ws.send(codeSendData({
            name: name
        }, 'user/rename'))
    })
}
window.sayToRoom = function (msg) { // 用户发言
    masterWsConnect.then(function (ws) {
        ws.send(codeSendData({
            msg: msg
        }, 'room/say'))
    })
}
window.upRoomMember = function () { // 获取最新的房间成员信息
    masterWsConnect.then(function (ws) {
        ws.send(codeSendData(null, 'room/members'))
    })
}

/** 房间相关 */
handleFragment[ENUM_SAY.ROOM_LIST] = function (res) { // 获取房间列表
    listIframe.then(function(contentWindow) {
        contentWindow.upListView(res)
    })
}
handleFragment[ENUM_SAY.ROOM_MEMBERS] = function (res) { // 获取房间成员
    gameIframe.then(function (win) {
        win.upRoomMember(res.data)
    })
}
handleFragment[ENUM_SAY.ROOM_DETAIL] = function (res) { // 房间详情
    var data = res.data
    gameIframe.then(function (win) {
        win.upRoomDetail(data)
    })
}
/** 下注的助手函数 */
var roomStake_time = null
window.roomStake = function (value, target) {
    clearTimeout(roomStake_time)
    roomStake_time = setTimeout(function (params) {
        masterWsConnect.then(function (ws) {
            ws.send(codeSendData({
                value: value,
                target: target,
            }, 'room/stake'))
        })
    }, 50)
}
handleFragment[ENUM_SAY.ROOM_STAKE] = function (res) { // 玩家下注
   const data = res.data
   gameIframe.then(function(win) {
        win.drawRoomStake(data)
   })
}

handleFragment[ENUM_SAY.ROLL] = function (res) { // 骰子滚动 
    var data = res.data
    gameIframe.then(function (win) {
        win.clearRoomStake()
        win.rollByIndex(data.time, data.targetIndexs)
    })
}

handleFragment[ENUM_SAY.RESULT_SMIPLE] = function (res) { // 游戏通知结果
    gameIframe.then(function(win) {
        win.switchChatRoom()
        win.clearRoomStake()
        win.pushChatItem(res.data, 2)
    })
}

handleFragment[ENUM_SAY.RESULT] = function (res) { // 游戏通知结算
    gameIframe.then(function (win) {
        win.switchTargetView(false)
        win.clearRoomStake()
        win.pushChatItem(res.data, 3)
    })
}

window.resetRoom = function() {
    masterWsConnect.then(function (ws) {
        ws.send(codeSendData(null, 'room/over'))
    })
}
handleFragment[ENUM_SAY.RESULT_CLEAR] = function (res) { // 积分归0
    win.pushChatItem('<p>房间已重置</p>', 0)
}