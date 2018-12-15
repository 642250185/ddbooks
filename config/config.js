const path = require('path');

const config = {

    mongodb: {
        host: '10.0.10.230',
        port: 27017,
        dbname: 'ddData'
    },

    dd: {
        domain: 'http://search.dangdang.com',
        mainPath: 'http://bijia-api.huishoubao.com',
        searchResultPath: '/bijia/crawler/get_dangdang_search_result',

        productPath: path.join(__dirname, '..', 'data/product.json'),
        failedsPath: path.join(__dirname, '..', 'data/faileds.json'),
        detailsPath: path.join(__dirname, '..', 'data/details.json'),
        breakOffPath: path.join(__dirname, '..', 'data/breakOff.json'),

        testDataPath: path.join(__dirname, '..', 'data/testData.json'),

        exportPath: path.join(__dirname, '..', 'download'),
        imagesPath: path.join(__dirname, '..', 'download/images'),
        filePath: path.join(__dirname, '..', 'file/isbndata.xlsx'),
    },

    env: function() {
        global.$config = this;
        return global.$config;
    }
};


module.exports = config.env();