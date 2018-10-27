const path = require('path');

const config = {
    domain: 'http://search.dangdang.com',
    productPath: path.join(__dirname, '..', 'data/product.json'),
    failedsPath: path.join(__dirname, '..', 'data/faileds.json'),
    detailsPath: path.join(__dirname, '..', 'data/details.json'),

    exportPath: path.join(__dirname, '..', 'download'),
    imagesPath: path.join(__dirname, '..', 'download/images'),
    filePath: path.join(__dirname, '..', 'file/ddbook.xlsx'),
    env: function() {
        global.$config = this;
        return global.$config;
    }
};

module.exports = config.env();





