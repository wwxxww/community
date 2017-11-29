var mongoose = require('../modules/database.js');

var schema = new mongoose.Schema({
    articleId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'articles' 
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    createTime: {
        type: Date,
        default: Date.now
    }
});

schema.statics = {
    post: function (data, cb) {
        Model.create(data, function (err, result) {
            if (err) {
                return cb({ code: 201, message: err });
            }
            cb(null, { code: 200, message: '保存成功!' })
        })
    }
}

var Model = mongoose.model('favorites', schema);

module.exports = Model;