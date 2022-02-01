const handleMaster = require('./masterHandle')
const {WebSocketServer} = require('ws')

/** 主业务逻辑，处理用户信息相关 */
const wss = new WebSocketServer({ port: 881 });
const handleNotify = function (callbabk) {
  wss.clients.forEach(function (ws) {
    if (ws.isAlive) { callbabk(ws)}
  })
}
wss.on('connection', function connection(ws) {
  
  handleMaster(ws)
  /** 发送提示信息 */
  ws.send('{"error_code": 0, "msg": "welcome！"}')
  /** 心跳检测 */
  ws.on('pong', function () {
    this.isAlive = true
  })
})
const interval = setInterval(function ping() {
  wss.clients.forEach(function (ws) {
    if (ws.isAlive === false) return ws.terminate()
    ws.isAlive = false
    ws.ping()
  });
}, 30000);

wss.on('close', function close() {
  clearInterval(interval)
})

module.exports = {wss, handleNotify}