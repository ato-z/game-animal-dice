const {MsgError} = require('./MsgError');
const { codeSendDataToJSONString } = require('./utils')
const ENUM_SAY = require('./ENUM_SAY');
/** 
* 取区间数  randomArea(0, 5)  取0到5 之间的随机数
* min 最小
* max 最大
* */
const randomArea = function (min, max) {
   return Math.round(Math.random() * (max - min)) + min;
}

/**
 *  动画曲线函数
 *  t: current time（当前时间）
 *  b: beginning value（初始值）
 *  c: change in value（变化量）
 *  d: duration（持续时间）
 *  */
const animaTimeProp = function (t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
    return -c / 2 * ((t -= 2) * t * t*t - 2) + b
}

const aSide = ['虎', '葫芦', '鸡', '虾', '鱼', '蟹']


/** 骰子游戏 */
class DiceGame{
    constructor(room) {
        this.room = room
        
        this.address = [0, 0, 0]
        this.timeIndex = null // setTimeout 指针
        this.resize() // 重置缓冲区 
    }

    /** 开奖 */
    lottey(time) {
        if (this.statu === 0) { throw new MsgError('正在开奖') }
        if (this.statu === 1) { throw new MsgError('正在结算') }
        this.statu = 0
        const targetIndexs = this.address = this.address.map(() => randomArea(0, 5))
        const room = this.room
        // 广播骰子状态
        room.notify(codeSendDataToJSONString({targetIndexs, time}, ENUM_SAY.ROLL))
        setTimeout(() => {
            this.annunciate()
        }, time)
    }

    /** 发出开奖通告 */
    annunciate() {
        this.statu = 1
        const address = this.address.map(key => aSide[key])
        const room = this.room
        room.notify(codeSendDataToJSONString(address, ENUM_SAY.RESULT_SMIPLE))

        setTimeout( () => {
            this.closeAccount()
        }, 3000) // 3秒后得出结算
    }

    /** 对开奖结果进行结算 */
    closeAccount() {
        this.statu = -1
        const address = this.address.map(key => key)
        const areaPour = this.areaPour
        const room = this.room
        const list = [...areaPour.keys()].map(tourist => {
            const map = areaPour.get(tourist)
            let diff = 0
            const itemAddress = [...map.keys()].map(touristKey => {
                let value = map.get(touristKey).value
                touristKey = touristKey.split(',')
                let changeValue = 0
                if (touristKey.length === 1) {
                    changeValue = this.singleThrow(address, touristKey[0])
                }
                if (touristKey.length === 2) {
                    changeValue = this.doubleThrow(address, touristKey)
                }
                diff += value * changeValue
                
                return {
                    title: touristKey.map(numKey => aSide[numKey]).join('&'),
                    diff: (changeValue > 0 ? '+'  : '') + (value * changeValue)
                }
            })
            const itemData = {
                name: tourist.name, diff, color: tourist.color,
                address: itemAddress
            }
            room.upBankByMember(tourist, diff)
            return itemData
        })
        this.resize()
        room.notify(codeSendDataToJSONString(list, ENUM_SAY.RESULT))
    }

    /** 单押 */
    singleThrow(address, touristKey) {
        var val = -1
        for (let i = 0, len = address.length; i < len; i++) {
            if (address[i] == touristKey) {
                if (val === -1) { val = 1 }
                else { val += 1 }
            }
        }
        return val
    }

    /** 双押  */
    doubleThrow(address, touristKeys) {
        const addressMap = {}
        address.forEach(key => addressMap[key] = true)
        if (addressMap[touristKeys[0]] && addressMap[touristKeys[1]]) {
            return 5
        }
        return -1
    }

    /** 返回下注信息 */ 
    currentPours() {
        const areaPour = this.areaPour
        return [...areaPour.keys()].map(tourist => {
            const map = areaPour.get(tourist)
            const targets = [...map.keys()].map(key => {
                key = key.split(',')
                const value = map.get(key.join(','))
                const data = {...value, key}
                if (key.length === 1) { data.type = 1} // 单押赔1
                if (key.length === 2) { data.type = 2} // 双押赔2 同时押两个： 比如押了 虎、鸡， 只出鸡或者虎都不算赢
                return data
            })
            const itemData = {
                name: tourist.name,
                color: tourist.color,
                targets: targets
            }
            return itemData
        })
    }
    
    /** 清空下注 */
    resize() {
        this.statu = -1 // -1开局 0摇奖中 1开奖
        this.areaPour = new Map()
    }
  
    /** 用户下注 */
    pour(tourist, target, value) {
        if (target/1 >= 6) { throw new MsgError('已超边界') }
        if (this.statu !== -1) { throw new MsgError('请耐心等待下一局开始～') }
        const areaPour = this.areaPour
        let map = areaPour.get(tourist)
        if (!map) {
            map = new Map()
            areaPour.set(tourist, map)
        }
        target = target.join(',')
        if (map.has(target)) { // 取消选择
            map.delete(target)
        } else {
            map.set(target, {
                value,
                left: (Math.random() * 2).toFixed(2),
                top: (Math.random() * 2).toFixed(2)
            })
        }
    }
}

module.exports = DiceGame