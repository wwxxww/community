var mongoose = require('../modules/database.js');
var moment = require('moment');
moment.locale('zh-cn');
 
var schema = new mongoose.Schema({
    // type: (一级回复,二级回复，关注，收藏),也可再建一个类型表
    type: {
        type: String,
        required: true
    },
    // 发消息的人的ID
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    }, 
    // 消息发给谁
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    // 收藏文章的ID（只在收藏文章时填写）
    articleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'articles'
    },
    // 回复的ID(二级回复时填写)
    replyId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'replies',
        default:null
    }, 
    readFlag: {
        type: Number,
        default: 0
    },
    createTime: {
        type: Date,
        default: Date.now
    }
});

schema.statics = {
}


// 虚拟字段（属性）只读
schema.virtual('createTimeFormat').get(function(){
    return moment(this.createTime).startOf('hour').fromNow();
})


var Model = mongoose.model('messages', schema);

module.exports = Model;