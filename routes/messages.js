var express = require('express'); 
var router = express.Router();

var check = require('../modules/check.js');

var Message = require('../models/message.js');

// 增加：渲染通知视图
router.get('/list', check.login, function (req, res, next) {
    var userId=req.session.user._id;     
    var filter={
        toUserId:userId, 
        readFlag:0 
    } 
    var filter2={
        toUserId:userId,
        readFlag:1 
    }
    var message2= Message.find(filter2).populate('articleId').populate('fromUserId').populate('replyId');
   var message= Message.find(filter).populate('articleId').populate('fromUserId').populate('replyId');
    Promise.all([message,message2]).then(function(results){
        // console.log(results);
        res.render('messages/list.ejs',{
            title: '消息中心',
            user: req.session.user,
            noread:results[0],
            read:results[1]
        })  
    }).catch(function (err) {
       console.log(err);
    })
}) 
 

// 增加：确认已读接口
router.post('/readed',check.login,function(req,res,next){
    var _id=req.body.message_id;
    //  console.log(_id);
    Message.findByIdAndUpdate(_id,{$set:{readFlag: 1}},function(err,result){
        if(err){
         res.json({code:201,message:'更新失败' });
         return;
        }
        res.json({code:200,result})
    })
})

 
// 增加：全部已读接口
router.post('/allread',check.login,function(req,res,next){
    var userId=req.session.user._id;
    Message.update({toUserId:userId},{$set:{readFlag:1}},{multi: true},function(err,result){
        if(err){
            res.json({code:201,message:"更新失败"});
            return;
        }
        res.json({code:200,message:result})
    })
})




module.exports = router;