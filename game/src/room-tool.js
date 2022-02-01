const { codeSendDataToJSONString } = require("./utils")
const DiceGame = require('./DiceGame')
const ENUM_SAY = require('./ENUM_SAY')
//const masterWs = require('./masterWs')

/**
 * 游戏房间
 */
const rooms = []  // 房间列表 

/** 创建一个新房间 */
const newRoom = function(title, passKey, master) {
    const room = new Room(title, passKey, master)
    rooms.push(room)
}

/** 获取房间列表  */
const getRooms = function() {
    const list = rooms.map(function(room) {
        return {
            id: room.id,
            title: room.title,
            member: room.members.length
        }
    })
    return codeSendDataToJSONString(list, ENUM_SAY.ROOM_LIST)
}

class Room {
    constructor(title,  passKey, master) {
        this.id = master.id + Date.now().toString(32) + Math.random().toString(16)
        this.title = title
        this.passKey = passKey
        this.master =  master
        this.members = [] // 成员列表
        this.memberBank = new Map()
        this.messages = [] // 当前房间的发言

        this.game = new DiceGame(this)

        var date = new Date()
        this.create_date = [
            [date.getFullYear(), date.getMonth(), date.getDate()].join('/'),
            [date.getHours(), date.getMinutes()].join(':')
        ].join(' ')
        this.time = date.getTime()
        this.join(master)
    }

    /** 用户下注 */
    stake(tourist, target, value) {
        const game = this.game
        game.pour(tourist, target, value)
        const result = game.currentPours()
        this.notify(codeSendDataToJSONString(result, ENUM_SAY.ROOM_STAKE))
        return null
    }

    /** 庄家开奖 */
    lottey(time) {
        const game = this.game
        game.lottey(time)
        const result = game.currentPours()
        this.notify(codeSendDataToJSONString(result, ENUM_SAY.ROOM_STAKE))
        return game.currentPours()
    }

    /** 用户发言 masterWs */
    sayByMember(tourist, msg) {
        const members = this.members
        const name = tourist.name
        const color = tourist.color
        const date = new Date()
        const time = [date.getHours() % 12, date.getMinutes()].join(':') + (date.getHours() >= 12 ? ' 下午' : '上午')
        const data = { name, color, msg, time }
       
        members.forEach(member => {
            member.masterWs.send(codeSendDataToJSONString(data, ENUM_SAY.USER_SAY))
        })
    }

    /** 返回当前房间的所有用户  */
    getMembres() {
        const members = this.members
        return members.map(member => {
            return {
                color: member.color,
                name: member.name,
                bank: this.getBankByMember(member),
                statu: this.master === member ? 'master' : 'client'
            }
        })
    }

    /** 获取当前用户该局的积分 */
    getBankByMember(tourist) {
        const val = this.memberBank.get(tourist)
        if (val === undefined) {
            this.memberBank.set(tourist, 0)
            return 0
        }
        return val
    }

    /** 更新用户积分 */
    upBankByMember(tourist, upValue) {
        let val = this.memberBank.get(tourist)
        val += upValue
        this.memberBank.set(tourist, val)
        tourist.masterWs.send(codeSendDataToJSONString({
            title: this.title,
            bank: val,
            statu: this.master === tourist ? 'master' : 'client'
        }, ENUM_SAY.ROOM_DETAIL))
    }

    /** 房间清空 */
    clearRoomBank() {
        const members = this.getMembres()
        this.notify(codeSendDataToJSONString(members), ENUM_SAY.ROOM_CLEAR)
        this.memberBank = new Map()
    }

    /** 加入房间 */
    join(tourist) {
        if (tourist.room === this) { return }
        /** 存在上一个房间则先退出 */
        if (tourist.room) { tourist.room.out(tourist) }
        tourist.room = this
        if (this.master === null) { // 如果当前房间无人则成为房主
            this.master = tourist
        }
        const members = this.members
        if (!this.memberBank.has(tourist)) { this.memberBank.set(tourist, 0) }
        members.push(tourist)
        const msg = `<strong style="color: ${tourist.color}">${tourist.name}</strong> 已加入`
        this.notify(codeSendDataToJSONString({msg}, ENUM_SAY.USER_JION))
    }

    /** 退出当前房间 */
    out (tourist) {
        const index = this.members.findIndex(item => item === tourist)
        if (index !== -1) {
            if (this.master === tourist) {
                this.master = null
            }
            this.members.splice(index, 1)
        }
        tourist.room = null
        const msg = `<strong style="color: ${tourist.color}">${tourist.name}</strong> 退出了`
        this.notify(codeSendDataToJSONString({msg}, ENUM_SAY.USER_OUT))
       
    }

    /** 向房间内所有成员广播 */
    notify(dataString, callback) {
        const members = this.members
        members.forEach(member => {
            if (dataString) {
                member.masterWs.send(dataString)
            } else {
                callback(member.masterWs)
            }
        })
    }
}

module.exports = {
    getRooms, newRoom, rooms
}