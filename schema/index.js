const config = require('../config/config');
const mongoose = require('mongoose');
mongoose.connect(`mongodb://${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.dbname}`);
mongoose.Promise = global.Promise;
global.$mongoose = mongoose;

const {product} = require('../model/product');
const {book} = require('../model/book');

const syncDB = () => {
    global['$product'] = mongoose.model('product', product, 'product');
    global['$book'] = mongoose.model('book', book, 'book');
};

syncDB();