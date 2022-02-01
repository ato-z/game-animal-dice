const { randomName, fillZero } = require('./utils')

const pool = new Map()
class Tourist{
    masterWs = null // 发言、用户信息、房间信息的的长链接 
    constructor(id) {
        this.id = id
        this.name = randomName()
        this.color = '#' + [
            fillZero((~~(Math.random() * 256)).toString(16)),
            fillZero((~~(Math.random() * 256)).toString(16)),
            fillZero((~~(Math.random() * 256)).toString(16))
        ].join('')
    }
}

module.exports = function(userKey) {
    if (pool.has(userKey)) { return pool.get(userKey) }
    var tourist = new Tourist(userKey)
    pool.set(userKey, tourist)
    return tourist
}