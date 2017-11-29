var express = require('express');
var router = express.Router();
var Category = require('../models/category.js');
var Article = require('../models/article.js');
var Reply = require('../models/reply.js');
var check = require('../modules/check.js');
var Page = require('../modules/page.js');
var Favorite = require('../models/favorite.js');
var Message = require('../models/message.js');
// 进入发布文章页面
router.get('/post', check.login, function (req, res, next) {
    Category.find(function (err, result) {
        if (err) {
            res.json({
                code: 201,
                message: err
            });
            return;
        }
        // console.log(result);
        res.render('articles/post.ejs', {
            title: '发起',
            user: req.session.user,
            categories: result
        })
    })
})

// 发布文章
router.post('/post', check.login, function (req, res, next) {
    var article = {
        category: req.body.category,
        title: req.body.title,
        content: req.body.content,
        userId: req.session.user._id
    }
    Article.post(article, function (err, result) {
        if (err) {
            res.json({
                code: 201,
                message: err.message
            });
            return;
        }

        res.json(result);
    })
})

// localhost:8000/articles/detail?id=10&age=20  取的时候req.query.id
// localhost:8000/articles/detail/10  取的时候req.params.id
router.get('/detail/:id/:page?', function (req, res, next) {
    var id = req.params.id;
    var currentPage = req.params.page || 1;
    if (!id || !currentPage) {
        res.json({
            code: 201,
            message: '参数错误！'
        });
        return;
    }

    currentPage = parseInt(currentPage);
    var filter = {
        parentId: null,
        articleId: id,
        status: 0
    };
    var article = Article.findById(id).populate('category').populate('userId').populate('lastReplyId');
    var replyCount = Reply.find(filter).count();
    var topReply = Reply.find(filter)
        .skip((currentPage - 1) * 10)
        .limit(10)
        .sort({
            createTime: -1
        })
        .populate('userId');
    var browerCount = Article.findByIdAndUpdate(id, {
        $inc: {
            browerCount: 1
        }
    });

    Promise.all([article, replyCount, topReply, browerCount]).then(function (results) {
        var totalPage = Math.ceil(results[1] / 10);
        res.render('articles/detail.ejs', {
            title: '文章详情',
            user: req.session.user,
            article: results[0],
            topReply: results[2],
            pages: Page.getPages(currentPage, totalPage),
            totalPage: totalPage,
            currentPage: currentPage
        })
    }).catch(function (err) {
        res.json({
            code: 201,
            message: '查询失败！'
        })
    })

})

// 增加：在一二级回复功能的基础上，在向回复表添加一条数据的基础上，在向message表添加一条数据。以供通知视图数据需要。
router.post('/reply', function (req, res, next) {
    var articleId = req.body.articleId;
    var content = req.body.content;
    var parentId = req.body.parentId
    var toUserId = req.body.toUserId;
    var fromUserId = req.session.user._id;
    var replyId = req.body.parentId;

    if (!parentId) parentId = null;
    if (!replyId) replyId = null;


    //replys表： 一二级回复的数据
    var data = {
        articleId,
        content,
        userId: req.session.user._id,
        parentId
    }
    // message表的数据。
    var data2 = {
        articleId,
        fromUserId,
        toUserId,
        replyId
    }
    parentId ? data2.type = 'reply' : data2.type = 'comment';

    var message = Message.create(data2);  //向message表添加一条数据
    var reply = Reply.create(data); // 向回复表中添加一条记录
    // 更新articles表中的replyCount字段
    var articleReplyCount = Article.findByIdAndUpdate(articleId, { $inc: {replyCount: 1}});

    // 二级回复
    if (data.parentId) {
        var updateCount = Reply.findByIdAndUpdate(data.parentId, {$inc: { secondReplyCount: 1 }});
        Promise.all([reply, updateCount, message]).then(function (results) {
            res.json({code: 200, message: results })
        }).catch(function (err) {
            res.json({  code: 201, message: err});
        })
    } else { // 一级回复
        Promise.all([reply, articleReplyCount, message]).then(function (results) {
            res.json({code: 200,message: results})
        }).catch(function (err) {
            res.json({ code: 201, message: err});
        })
    }
})

router.post('/remove', check.login, function (req, res, next) {
    var id = req.body.id;
    var articleUserId = req.body.articleUserId;
    if (!id || !articleUserId) {
        res.json({
            code: 201,
            message: '参数错误！'
        });
        return;
    }

    // 判断删除的文章是否属于当前登录的用户
    var userId = req.session.user._id.toString();
    if (userId != articleUserId.toString()) {
        res.json({
            code: 201,
            message: '你不能删除别人发布的文章！'
        });
        return;
    }

    // 级联删除("假删除"，逻辑删除)
    var deleteArticle = Article.findByIdAndUpdate(id, {
        $set: {
            status: 1
        }
    });
    // https://docs.mongodb.com/manual/reference/write-concern/
    var deleteReply = Reply.update({articleId: id }, { $set: {status: 1 }},{ w: 1,multi: true});
    Promise.all([deleteArticle, deleteReply]).then(function (results) {
        res.json({
            code: 200,
            message: '删除成功！'
        });
    }).catch(function (err) {
        res.json({
            code: 201,
            message: '删除出错！'
        });
        return;
    })
})

router.get('/edit/:id', check.login, function (req, res, next) {
    var articleId = req.params.id;
    if (!articleId) {
        res.json({
            code: 201,
            message: '参数错误!'
        });
        return;
    }

    var article = Article.findById(articleId);
    var category = Category.find();

    Promise.all([article, category]).then(function (results) {
        res.render('articles/edit', {
            title: '编辑文章',
            user: req.session.user,
            article: results[0],
            categories: results[1]
        })
    }).catch(function (err) {
        res.json({
            code: 201,
            message: '查询数据出错!'
        })
    })
})

router.post('/edit', check.login, function (req, res, next) {
    var category = req.body.category;
    var title = req.body.title;
    var content = req.body.content;
    var id = req.body.id;

    if (!id || !category || !content || !title) {
        res.json({
            code: 201,
            message: ' 参数出错！'
        });
        return;
    }

    var article = Article.update({
        _id: id
    }, {
        $set: {
            category: category,
            title: title,
            content: content,
            updateTime: Date.now()
        }
    }, {
        w: 1,
        multi: false
    })

    Promise.all([article]).then(function (results) {
        res.json({
            code: 200,
            mssage: '更新成功！'
        })
    }).catch(function (err) {
        res.json({
            code: 201,
            message: '更新失败！'
        });
        return;
    })
})

// 接口返回一段HTML代码片段
router.post('/showReply2/:parentId/:page?', check.ajaxLogin, function (req, res, next) {
    var parentId = req.params.parentId;
    var currentPage = req.params.page || 1;
    if (!parentId || !currentPage) {
        res.json({
            code: 201,
            message: '参数错误！'
        });
        return;
    }
    currentPage = parseInt(currentPage);

    var filter = {
        parentId: parentId,
        status: 0
    };
    // 二级回复的数据总个数
    var totalPromise = Reply.find(filter).count();
    // 二级回复的数据列表
    var reply2Promise = Reply.find(filter)
        .skip((currentPage - 1) * 10)
        .limit(10)
        .sort({
            createTime: -1
        })
        .populate('userId');

    Promise.all([totalPromise, reply2Promise]).then(function (results) {
        // 获取二级回复的总页数
        var totalPage = Math.ceil(results[0] / 10);
        res.render('articles/reply2-list.ejs', {
            title: '二级回复',
            user: req.session.user,
            reply2: results[1],
            pages: Page.getPages(currentPage, totalPage),
            totalPage: totalPage,
            currentPage: currentPage,
            parentId
        });
    }).catch(function (err) {
        res.json({
            code: 201,
            message: err
        });
    })
})


// 收藏的接口
router.post('/favorite', function (req, res, next) {

    var articleId = req.body.articleId;
    var fromUserId=req.session.user._id;
    var toUserId=req.body.userId;
    var userId=req.session.user._id;
    var type='favorite';
    var favorite = {
        articleId,
        userId,
        createTime: new Date(),
    }

    Message.create({articleId,fromUserId,type,toUserId},function(err,result){
        if(err){
            res.json({code:201,message:'添加失敗'});
            return;
        }
        Favorite.post(favorite, function (err, result) {
            if (err) {
                res.json({code: 201,message: err.message});
                return;
            }
            Article.findByIdAndUpdate(articleId, {$inc: {favoriteCount: 1}}, function (err, result) {
                if (err) {
                    res.json({ code: 201, message: err.message});
                    return;
                }
                res.json({code: 200,message: '收藏成功' });
            })
        })
    }) 
})

module.exports = router;