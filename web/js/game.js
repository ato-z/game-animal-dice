// 单次下注筹码
var bankValue = 1

/** 房间的配置 */
;(function () {
    // 本局筹码
    window.setCurrentRoomValue = function(n) {
        document.querySelector('#room-value').value = n
    }
    // 设置每次下注的筹码
    var radios = Array.prototype.slice.call(document.querySelectorAll('.radio-view input'))
    radios.forEach(function (radio) {
        radio.onchange = function () {
            bankValue = this.value / 1
        }
    })

    // 设置昵称
    document.querySelector('#my-name').onchange = function () {
        top.setNickName(this.value)
    }
    window.setCurrentNickName = function name(name) {
        document.querySelector('#my-name').value = name
    }

    // 退出房间
    document.querySelector('.out-btn').onclick = function() {
        top.backRoom()
    }

    // 重置房间
    document.querySelector('.reset-btn').onclick = function() {
        setTimeout((function () {
            this.clickOne = undefined
        }).bind(this), 300)
        if (!this.clickOne) { 
            this.clickOne = true
            return top.msg('双击重置房间')
        }
        top.resetRoom()
    }
}())


/** 下注事件 */
;(function () {
    var selector = [] // 当前选择的下注目标
    var disktop = document.querySelector('.desktop')
    var items = Array.prototype.slice.call(disktop.querySelectorAll('.item'))
    var getPosition = function (touch, target) {
        var react = target.getClientRects()
        var width = react[0].width / 3
        var left = ~~(touch.clientX / width)
        var top = ~~(touch.clientY / width)
        var index = left + (top * 3)
        return index
    }
    
    items.forEach(function(item, index) {        
        item.onclick = function() {
            top.roomStake(bankValue, [index])
        }
    })
    
    disktop.addEventListener('touchstart', function (event) {
        var touch = event.changedTouches[0]
        var index = getPosition(touch, this)
        selector.splice(0, selector.length)
        selector.push(index)
    })
    disktop.addEventListener('touchmove', function (event) {
        event.preventDefault()
    })
    disktop.addEventListener('touchend', function (event) {
        var touch = event.changedTouches[0]
        var index = getPosition(touch, this)
        if (index !== selector[selector.length - 1]) {
            selector.push(index)
        }
        top.roomStake(bankValue, selector.map(function (item) {
            return item
        }))
    })
} ())

/** 绘制下注的信息 */
;(function () {
    var items = Array.prototype.slice.call(document.querySelectorAll('.desktop .item'))
    window.clearRoomStake = function () {
        items.forEach(function(item) {
            item.innerHTML = ''
        })
    }
    window.drawRoomStake = function(data) {
        var statkes = items.map(function(item) { return [] })
        data.forEach(function(tourist) {
            var style = [
                'background-color:' + tourist.color,
            ]
            tourist.targets.forEach(function(line) {
                var className = 'class="'+(line.type == 1 ? 'single' : 'double')+'"'
                var value = line.value
                style[1] = 'left:' + line.left + 'rem'
                style[2] = 'top:' + line.top + 'rem'
                line.key.forEach(function(key) {
                    statkes[key].push([
                        '<strong style="'+style.join(';')+'" '+className+'>',
                            value,
                        '</strong>'
                    ].join(''))
                })
                
            })
        })
        
        statkes.forEach(function(html, index) {
            items[index].innerHTML = html.join('')
        })
    }  
}())

/** 房间成员信息 */
;(function () {
    var view = document.querySelector('#member-view')
    window.upRoomMember = function (data) {
        const list = data.members
        view.innerHTML = list.map(function (item) {
            var name = item.statu === 'master' ? '房主' : '成员'
            name += ' ' + item.name
            return [
                '<li class="item flex-middle">',
                    '<strong class="name flex1" style="color: '+item.color+'">'+name+'</strong>',
                    '<span class="val">'+item.bank+'</span>',
                '</li>',
            ].join('')
        }).join('')
    }
}())

/** 摇奖控制 */
;(function () {
    // 骰子每面的宽度
    var width = 250
    
    /**
     * 鱼虾蟹的图片路径
     */
    var icons = [
        'hu.png', 'jiuhulu.png', 'laomuji.png',
        'xia.png', 'liyu.png', 'pangxie.png'
    ].map(function (src) {
        return './images/' + src
    })

    /** 标签栏切换 */
    var middle = document.querySelector('.middle')
    var bars = middle.children
    var views = Array.prototype.slice.call(document.querySelectorAll('.switch-win .view'))
    middle.onclick = function(event) {
        if (event.target === this) { return false }
        var index = (function (target, children) {
            var i = 0
            for (; i < children.length; i++) {
                if (children[i] === target) { return i }
            }
            return null
        } (event.target, this.children))
        if (index === null) { return  }
        if (index === 1) { top.upRoomMember() }
        views.map(function(item, current) {
            if (current !== index) {
                bars[current].classList.remove('on')
                item.classList.remove('on')
            } else {
                bars[current].classList.add('on')
                item.classList.add('on')

            }
        })
    }

    /** 更新文字大小 */
    var fontContainer = document.querySelector('.bottom')
    var upFontSize = document.querySelector('#up-font-btn')
    upFontSize.onchange = function() {
        fontContainer.style.fontSize = this.value + 'px'
    }

    /** 长图 */
    var logImg = loadLogImg(icons, width)
    logImg.then(function(img) {
        var corona = document.querySelector(".corona section")
        var ASides = [1, 1, 1].map(function() {
            var item = createaASide(width, img)
            var div = document.createElement('div')
            div.appendChild(item.canvas)
            div.className = 'flex1 item'
            corona.appendChild(div)
            return item
        })

        /** 控制台显示状态 */
        window.switchTargetView = function (statu) {
            if (statu) {
                document.querySelector('.target-view').classList.add('ing')
            } else {
                document.querySelector('.target-view').classList.remove('ing')
            }
        }
        /** 返回聊天室 */
        window.switchChatRoom = function () {
            bars[0].click()
        }

        /** 开始滚动 */
        window.rollByIndex = function (time, targetIndexs) {
            window.switchTargetView(true)
            targetIndexs.forEach(function (targetIndex,index) {
                ASides[index].rollTo(time, targetIndex)
            })
        }

        /** 开启摇奖 */
        document.querySelector('.play').onclick = function() {
            top.masterWsConnect.then(function(ws) {
                ws.send(top.codeSendData({
                    time: 10000
                }, 'room/lottey'))
            })
           
        }
    })

} ())

/** 聊天室 */
;(function () {
    var titleElement = document.querySelector('#room-title')
    var masterSwitchElement = document.querySelector('#master-btn')
    var resetBtnElement = document.querySelector('.reset-btn')
    window.upRoomDetail = function (data) {
        titleElement.innerHTML = data.title
        masterSwitchElement.style.display = data.statu === 'master' ? 'block' : 'none'
        resetBtnElement.style.display = data.statu === 'master' ? 'block' : 'none'
        setCurrentRoomValue(data.bank)
    }

    var msgForm = document.querySelector('.chat-form')
    var msgInput = msgForm.querySelector('input')
    msgForm.addEventListener('submit', function(event) {
        event.preventDefault()
        top.sayToRoom(msgInput.value)
        msgInput.value = ''
    })

    var chatList = document.querySelector('.chat-list')
    var createChatItem = function(html){
        var children = Array.prototype.slice.call(chatList.children)

        var item = document.createElement('div')
        item.className = 'item'
        item.innerHTML = html
        if (children.length) {
            chatList.insertBefore(item, children[0])
        } else {
            chatList.appendChild(item)
        }

        var delNum = 20 - children.length
        if (delNum < 0) {
            var delItems =  children.splice(delNum)
            delItems.forEach(function(delItem) {
                chatList.removeChild(delItem)
            })
        }        
        return item
    }

    var handleUserJoin = function(data) {// 用户加入
        var item = createChatItem([
            '<div class="tip2">'+data.msg+'</div>'
        ].join(''))
        return item
    }
    var handleUserSay = function(data) { // 用户发言
        var item = createChatItem([
            '<div class="chat-item">',
                '<div class="flex-middle top">',
                    '<strong class="name" style="color: '+data.color+'">'+data.name+'</strong>',
                    '<span class="time">/'+ data.time +'</span>',
                '</div>',
                '<p class="say">'+data.msg+'</p>',
            '</div>'
        ].join(''))
        return item
    }
    var handleSimptResult = function(data) { // 简易的开奖通知
        var item = createChatItem([
            '<div class="tip">',
                '开奖通知：',
                data.map(function(name) {
                    return '<strong>'+name+'</strong>'
                }).join('-'),
            '</div>'
        ].join(''))
        return item
    }
    var handleReslt = function(data) { // 详情游戏通知
        var item = createChatItem([
            '<div class="lines">',
                data.map(function(line) {
                    return [
                        '<div class="line flex-middle">',
                            '<div class="flex1">',
                                '<strong style="color: '+line.color+'">' + line.name + ': </strong>',
                                line.address.map(function(add) {
                                    if (add.diff > 0) {
                                        return '<strong class="col1">' +add.title + add.diff +  '</strong>'
                                    } else {
                                        return '<span>' +add.title + add.diff +  '</span>'
                                    }
                                }).join(' '),
                            '</div>',
                            '<strong>'+line.diff+'</strong>',
                        '</div>'
                    ].join('')
                }).join(''),
            '</div>'
        ].join(''))
    }

    /** 在聊天室发言 */
    window.pushChatItem = function(data, type) {
        if (type === 0) { // 用户加入
            handleUserJoin(data)
        }
        if (type === 1) { // 用户发言
            handleUserSay(data)
        }
        if (type === 2) { // 开奖通知
            handleSimptResult(data)
        }
        if (type === 3) { // 开奖通知
            handleReslt(data)
        }
    }
}())