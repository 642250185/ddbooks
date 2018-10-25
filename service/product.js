
const cheerio = require('cheerio');
const request = require('superagent');

const config = require('../config/config');

const domain = config.domain;

const getProduct = async() => {
    try {
        const isbn = '9787208130500';
        const path = `${domain}/?key=${isbn}&act=input`;
        console.info('path: ', path);
        let result = await request.get(path);
        const $ = cheerio.load(result.text, {decodeEntities: false});
        console.info($('body').html());
        let len = $('#search_nature_rg').find('li').length;
        console.error('len: ', len);
    } catch (e) {
        console.error(e);
        return e;
    }
};


getProduct();