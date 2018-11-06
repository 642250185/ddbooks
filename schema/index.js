const config = require('../config/config');
const mongoose = require('mongoose');
mongoose.connect(`mongodb://${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.dbname}`);
mongoose.Promise = global.Promise;
global.$mongoose = mongoose;

const syncDB = () => {
    const {product} = require('../model/product');
    global['$product'] = mongoose.model('product', product, 'product');
};

syncDB();