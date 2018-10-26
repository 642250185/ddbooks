const path = require('path');

const config = {
    domain: 'http://search.dangdang.com',
    productPath: path.join(__dirname, '..', 'data/product.json'),
    env: function() {
        global.$config = this;
        return global.$config;
    }
};

module.exports = config.env();





