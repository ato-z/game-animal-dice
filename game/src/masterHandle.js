const Tourist = require('./Tourist')
const {codeSendDataToJSONString} = require('./utils')
const { getRooms, newRoom, rooms } = require('./room-tool')
const {MsgError} = require('./MsgError')
const ENUM_SAY = require('./ENUM_SAY')



/** 用户加入房间的免登密钥 */
const codeSign = (roomID, uid) => {
    var vals = roomID.split('.').map(item => (('0x' + item) / 1) || 0).concat(
        uid.split('.').map(item => (('0x' + item) / 1) || 0)
    )
    var val = 0
    vals.forEach(element => {
        val += element
    })
    return val.toString(16)
}

/** 简单的表驱动模型 */
const router = {}
/** 获取用户信息 */
router['user/detail'] = function(res) {
    var tourist = new Tourist(res.ukey)
    return codeSendDataToJSONString({
        name: tourist.name,
        color: tourist.color,
        roomID: tourist.room ? tourist.room.id : null,
        sign: tourist.room ? codeSign(tourist.room.id, res.ukey) : null
    }, ENUM_SAY.USER_DETAIL)
}
/** 更新用户昵称 */
router['user/rename'] = function(res) {
    var tourist = new Tourist(res.ukey)
    if (!res.data.name) { throw new MsgError('请输入您的昵称') }
    if (res.data.name.length > 8) { throw new MsgError('昵称长度不可超过8位') }
    tourist.name = res.data.name
    return {msg: '已修改昵称'}
}


/** 房间列表 */
router['room/list'] = function(res) {return getRooms()}
/** 创建房间 */
router['room/new'] = function(res) {
    const tourist = new Tourist(res.ukey)
    const data = res.data
    if (!data.title || data.title.length > 8) {
        throw new MsgError('房间名不能为空或长度不超过8位')
    }
    if (!data.passKey || data.passKey.length < 6 || data.passKey.length > 16) {
        throw new MsgError('且密码长度需要大等于6且不超过16位')
    }
    newRoom(data.title, data.passKey, tourist)
    setTimeout(() => {
        const result = getRooms()
        const { handleNotify } = require('./masterWs')
        handleNotify(ws => ws.send(result))
    }, 1000)
    return null
}
/** 获取房间里的所有用户 */ 
router['room/members'] = function(res) {
    const tourist = new Tourist(res.ukey)
    const room = tourist.room
    const members = room.getMembres()
    return codeSendDataToJSONString({
        members
    }, ENUM_SAY.ROOM_MEMBERS)
}
/** 获取当前用户所属房间信息 */
router['room/detail'] = function(res) {
    var tourist = new Tourist(res.ukey)
    var room = tourist.room
    return codeSendDataToJSONString({
        title: room.title,
        bank: room.getBankByMember(tourist),
        statu: room.master === tourist ? 'master' : 'client'
    }, ENUM_SAY.ROOM_DETAIL)
}
/** 房间内发言 */
router['room/say'] = function(res) {
    const tourist = new Tourist(res.ukey)
    const data = res.data
    const room = tourist.room
    if (!data.msg) { throw new MsgError('说点啥吧～') }
    room.sayByMember(tourist, data.msg) 
    return null
}
 /** 加入房间  */
router['room/join'] = function(res) {
    const tourist = new Tourist(res.ukey)
    const data = res.data
    if (!data.roomID) { throw new MsgError('roomID不能为空～') }
    if (!data.passKey) { throw new MsgError('请输入房间密码') }
    const room = rooms.find(room => room.id === res.data.roomID)
    if (!room) { throw new MsgError('当前房间不存在或已被销毁') }
    if (data.passKey !== room.passKey) { throw new MsgError('密码错误！') }
    return room.join(tourist)
}
/** 免密加入房间  */
router['room/joinBySign'] = function(res) {
    const tourist = new Tourist(res.ukey)
    const data = res.data
    if (!data.roomID) { throw new MsgError('roomID不能为空～') }
    if (!data.sign) { throw new MsgError('密钥不存在，请输入密码加入') }
    const room = rooms.find(room => room.id === res.data.roomID)
    if (!room) { throw new MsgError('当前房间不存在或已被销毁') }
    if (codeSign(room.id, res.ukey) !== res.data.sign) { throw new MsgError('密钥不可用，请输入密码加入') }
    return codeSendDataToJSONString({msg: tourist.name + '已重连'}, ENUM_SAY.USER_JION)
}
/** 退出房间  */
router['room/out'] = function(res) {
    const tourist = new Tourist(res.ukey)
    if (!tourist.room) { throw new MsgError('您暂未加入任何房间') }
    var room = tourist.room
    room.out(tourist)
    return null
}

/** 玩家下注  */
router['room/stake'] = function(res) {
    const tourist = new Tourist(res.ukey)
    const room = tourist.room
    if (!room) { throw new MsgError('您未加入游戏中') }
    // 庄家不允许下注
    if (room.master === tourist) { throw new MsgError('您是该房庄家, 不支持下注') }
    const data = res.data
    const value = data.value / 1
    let target = data.target
    if (isNaN(value)) { throw new MsgError('下注单位不能为必须为数字类型') }
    if (typeof target !== 'array') { target = [target] }
    target = target.sort((a, b) => a - b)
    const result = room.stake(tourist, target, value)
    return null
}
/** 庄家开奖  */
router['room/lottey'] = function(res) {
    const tourist = new Tourist(res.ukey)
    const room = tourist.room
    if (!room) { throw new MsgError('您未加入游戏中') }
    // 只有庄家才能开奖
    if (room.master !== tourist) { throw new MsgError('您不是庄家，不可开启结果') }
    const time = res.data.time || 10000 // 默认摇10秒
    const result = room.lottey(time)
    return null
}

/** 对房间进行清算  */
router['room/over'] = function(res) {
    const tourist = new Tourist(res.ukey)
    const room = tourist.room
    if (room.master !== tourist) { throw new MsgError('您不是庄家，不可重置房间') }
    room.clearRoomBank()
    const members = room.getMembres()
    return codeSendDataToJSONString({
        members
    }, ENUM_SAY.ROOM_MEMBERS)
}

module.exports = function(ws) {
    /** 收到客服端发送的讯息 */
    ws.on('message', function message(data) {
        try {
            const codeData = JSON.parse(data)

            // 找不到不处理, 可能是心跳包
            if (router[codeData.path] === undefined) { return }

            // 如果未携带用户key
            if (codeData.ukey === undefined) { return }
            const tourist = new Tourist(codeData.ukey)

            // 第一次登录
            if (tourist.masterWs === null) { tourist.masterWs = ws }

            // 用户抢登
            if (tourist.masterWs !== ws) {
                tourist.masterWs.close()
                tourist.masterWs.send(codeSendDataToJSONString(
                    null, ENUM_SAY.USER_BUSY, -1,
                    '您已在其他地方登录'
                ))
            }
            
            // 让每次的ws保持最新
            tourist.masterWs = ws
            // 正常处理流程
            const result = router[codeData.path](codeData)
            if (typeof result === 'string') { return ws.send(result) }
            // 公共信息
            if (result) { ws.send(codeSendDataToJSONString(result, ENUM_SAY.PUBLIC)) }
        } catch(e) {
            console.log(e)
            if (e instanceof MsgError) {
                return ws.send(codeSendDataToJSONString(null, ENUM_SAY.ERROR, e.error_code, e.message))
            }
        }
    })
}