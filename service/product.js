const _path = require('path');
const fs = require('fs-extra');
const cheerio = require('cheerio');
const request = require('superagent');
const xlsx = require('node-xlsx').default;
const config = require('../config/config');
const obj  = xlsx.parse('../回收ISBN.xlsx');

const domain = config.domain;
const productPath = config.productPath;

let isbnList = [];
Object.keys(obj).forEach(function(key) {
    obj[key].data.forEach(function(item){
        isbnList.push(item[0]);
    });
});


const getProduct = async(isbn) => {
    try {
        const path = `${domain}/?key=${isbn}&act=input`;
        const result = await request.get(path);
        const $ = cheerio.load(result.text, {decodeEntities: false});
        const aTag = $('#search_nature_rg').find('li').eq(0).find('a');
        const url = aTag.attr('href');
        return url;
    } catch (e) {
        console.error(e);
        return e;
    }
};


const getAllProduct = async() => {
    try {
        let number = 0, result = [];
        for(let isbn of isbnList){
            ++number;
            const url = await getProduct(isbn);
            result.push(url);
            if(number === 30){
                break;
            }
        }
        return result;
    } catch (e) {
        console.error(e);
        return [];
    }
};


const saveProduct = async() => {
    try {
        const allUrls = await getAllProduct();
        console.info(allUrls.length, allUrls);
        await fs.ensureDir(_path.join(productPath, '..'));
        fs.writeFileSync(productPath, JSON.stringify(allUrls, null, 4));
        return allUrls;
    } catch (e) {
        console.error(e);
        return e;
    }
};

saveProduct();
exports.saveProduct = saveProduct;