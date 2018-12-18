const mongoose = require('mongoose');
const Schema = mongoose.Schema;

exports.book = new Schema({
    _id: {
        type    : Schema.Types.ObjectId,
        default : new mongoose.Types.ObjectId
    },
    isbn        : String,
    channel     : Number,
    title       : String,
    categroy    : String,
    src         : String,
    price       : String,
    m_price     : String,
    e_price     : String,
    paper_price : String,
    public      : String,
    publicDate  : String,
    status      : {
        type: Boolean,
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





