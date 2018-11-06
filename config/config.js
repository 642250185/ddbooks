const path = require('path');

const config = {

    mongodb: {
        host: '10.0.10.187',
        port: 27017,
        dbname: 'ddData5'
    },

    domain: 'http://search.dangdang.com',
    productPath: path.join(__dirname, '..', 'data/product.json'),
    failedsPath: path.join(__dirname, '..', 'data/faileds.json'),
    detailsPath: path.join(__dirname, '..', 'data/details.json'),
    breakOffPath: path.join(__dirname, '..', 'data/breakOff.json'),

    exportPath: path.join(__dirname, '..', 'download'),
    imagesPath: path.join(__dirname, '..', 'download/images'),
    filePath: path.join(__dirname, '..', 'file/ddBook12-14W.xlsx'),
    env: function() {
        global.$config = this;
        return global.$config;
    }
};

module.exports = config.env();





