/** 错误信息基类 */
class MsgError{
    constructor(message, error_code = 1) {
        this.message = message
        this.error_code = error_code
    }
}

module.exports = {MsgError}