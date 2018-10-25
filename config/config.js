const path = require('path');

const config = {
    domain: 'http://search.dangdang.com',
    env: function() {
        global.$config = this;
        return global.$config;
    }
};

module.exports = config.env();





