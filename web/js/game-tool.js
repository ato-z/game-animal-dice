/** 
 * 取区间数  randomArea(0, 5)  取0到5 之间的随机数
 * min 最小
 * max 最大
 * */
var randomArea = function (min, max) {
    return Math.round(Math.random() * (max - min)) + min;
}

/**
 *  动画曲线函数
 *  t: current time（当前时间）
 *  b: beginning value（初始值）
 *  c: change in value（变化量）
 *  d: duration（持续时间）
 *  */
var animaTimeProp = function (t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
    return -c / 2 * ((t -= 2) * t * t*t - 2) + b
}

/** 
 * 加载图片 loadImgToPromise('./images/hu.png') 
 * src 图片路径
 *  */
var loadImgToPromise = function(src) {
    var img = new Image()
    var promise = new Promise(function(resolve, reject) {
        img.onload = function() { resolve(this) }
        img.onerror = reject
    })
    img.src = src
    return promise
}

/** 
 * 多图加载拼成一张长图
 * icons 图片路径集合 ['./images/hu.png', './images/jiuhulu.png']
 * width 长图的宽度
 *  */
var loadLogImg = function(icons, width) {
    var loadImgs = icons.map(loadImgToPromise)
    return Promise.all(loadImgs).then(function(imgs) {
        imgs.push(imgs[0]) // 无缝滚动需要额外添加一个
        var height = imgs.length * width
        return { width: width, height: height, imgs: imgs }
    }).then(function(op) {
        var imgs = op.imgs
        var canvas = document.createElement('canvas')
        canvas.width = op.width
        canvas.height = op.height
        var ctx = canvas.getContext('2d')
        ctx.fillStyle = "#f2f4f7";
        ctx.fillRect(0, 0, op.width, op.height);
        var height = 0
        imgs.map(function(img) {
            ctx.drawImage(img, 0, 0, img.width, img.height, 0, height, op.width, op.width)
            height += op.width
        })
        return loadImgToPromise(canvas.toDataURL('image/jpeg'))
    })
}


/** 
 * 滚动到指定位置
 * ctx         canvas的2d绘画环境
 * img         滚动的长图
 * height      长图中每一面的高度
 * time        持续时间
 * startIndex  开始的高度
 * targetIndex 目标高度
 *  */
var rollTo = function(ctx, img, height, time, startIndex, targetIndex) {
    var resolve, reject;
    var promise = new Promise(function(a, b) {
        resolve = a
        reject = b
    })
    var maxHeight = img.height - height
    var targetY = randomArea(8, 17) * maxHeight + targetIndex * height
    var startY = startIndex * height
    targetY -= startY
    var startDate = new Date().getTime()
    var handleUp = function() {
        var current = Math.min(new Date() - startDate, time)
        var currentY = animaTimeProp(current, startY, targetY, time) % maxHeight
        ctx.clearRect(0, 0, height, height)
        ctx.drawImage(img, 0, currentY, img.width, height, 0, 0, height, height)
        if (current !== time) {
            requestAnimationFrame(handleUp)
        } else {
            resolve(targetIndex)
        }
    }
    handleUp()
    return promise
}

/** 
 * 创建单面骰子
 * width   宽度
 * logImg  骰子长图
*/
var createaASide = function(width, logImg) {
    var canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = width
    var ctx = canvas.getContext('2d')
    var prev = 0
    ctx.drawImage(logImg, 0, 0, width, width, 0, 0, width, width)
    return {
        canvas: canvas, ctx: ctx,
        /**
         * 持续滚动
         * time   持续时间 
         * index  滚动到指定下标 
         * @returns promise
         */
        rollTo: function(time, index) {
            var promise = rollTo(ctx, logImg, width, time, prev, index)
            prev = index
            return promise
        },

        /**
         * 按帧滚动
         */
        rollByFrame: function (currentY) {
            ctx.clearRect(0, 0, width, width)
            ctx.drawImage(logImg, 0, currentY, logImg.width, width, 0, 0, width, width)
        }
    }
}