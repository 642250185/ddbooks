const mongoose = require('mongoose');
const Schema = mongoose.Schema;

exports.product = new Schema({
    _id: {
        type    : Schema.Types.ObjectId,
        default : new mongoose.Types.ObjectId
    },
    isbn    : String,
    url     : String,
    status  : {
        type: Boolean,  // true 表示该ISBN已经爬取过了。
        default: false
    },
    createTime: {
        type    : Date,
        default : Date.now,
        index   : true
    },
    updateTime: {
        type    : Date,
        default : Date.now
    }
},{
    versionKey: false,
    timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' }
});