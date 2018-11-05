const _ = require('lodash');
const _path = require('path');
const fs = require('fs-extra');
const cheerio = require('cheerio');
const request = require('superagent');
const xlsx = require('node-xlsx').default;
const config = require('../config/config');
const {changeIP} = require('../util/iputil');

const domain = config.domain;
const filePath = config.filePath;
const productPath = config.productPath;
const failedsPath = config.failedsPath;

let isbnList = [];
const obj  = xlsx.parse(filePath);
Object.keys(obj).forEach(function(key) {
    obj[key].data.forEach(function(item){
        isbnList.push(item[0]);
    });
});

let index = 0;
const getProduct = async(isbn) => {
    try {
        ++index;
        // await changeIP();
        const path = `${domain}/?key=${isbn}&act=input`;
        const result = await request.get(path);
        const $ = cheerio.load(result.text, {decodeEntities: false});
        const aTag = $('#search_nature_rg').find('li').eq(0).find('a');
        const url = aTag.attr('href');
        if(_.isEmpty(url)){
            console.warn(`[${index}] : ${isbn} 未获取到URL!`);
        } else {
            console.info(`[${index}] : ${isbn} ${url}`);
        }
        return url;
    } catch (e) {
        console.error(e);
        return e;
    }
};


const getAllProduct = async() => {
    try {
        console.info(`ISBN数量 :: `, isbnList.length);
        let number = 0, results = [], faileds = [];
        for(let isbn of isbnList){
            ++number;
            const url = await getProduct(isbn);
            if(!_.isEmpty(url)){
                results.push({isbn, url});
            } else {
                faileds.push(isbn);
            }
            // if(number === 115){
            //     break;
            // }
        }
        return {results, faileds};
    } catch (e) {
        console.error(e);
        return [];
    }
};


const saveProduct = async() => {
    try {
        const {results, faileds} = await getAllProduct();
        console.info(`ISBN采集结果 >> 成功: ${results.length}、 失败: ${faileds.length}`);
        await fs.ensureDir(_path.join(productPath, '..'));
        fs.writeFileSync(productPath, JSON.stringify(results, null, 4));
        // 统计失败的
        await fs.ensureDir(_path.join(failedsPath, '..'));
        fs.writeFileSync(failedsPath, JSON.stringify(faileds, null, 4));
        return results;
    } catch (e) {
        console.error(e);
        return e;
    }
};

// saveProduct();
exports.saveProduct = saveProduct;