require('../schema');
const _ = require('lodash');
const _path = require('path');
const fs = require('fs-extra');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const request = require('superagent');
const xlsx = require('node-xlsx').default;
const config = require('../config/config');

const domain = config.domain;
const filePath = config.filePath;
const productPath = config.productPath;
const failedsPath = config.failedsPath;
const breakOffPath = config.breakOffPath;

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
        const _product = await $product.find({isbn: isbn});
        if(_.isEmpty(_product)){
            const product = {
                _id     : new mongoose.Types.ObjectId,
                isbn    : isbn,
                url     : url
            };
            await new $product(product).save();
        } else {
            console.warn(`[${index}] : 已入库......`);
        }
        return url;
    } catch (e) {
        console.error(e);
        return e;
    }
};


const saveBreakOff = async(isbn) => {
    try {
        const results = [{isbn: isbn}];
        await fs.ensureDir(_path.join(breakOffPath, '..'));
        fs.writeFileSync(breakOffPath, JSON.stringify(results, null, 4));
    } catch (e) {
        console.error(e);
        return e;
    }
};


const getBreakOff = async() => {
    try {
        const breakoff = JSON.parse(fs.readFileSync(breakOffPath));
        const isbn = breakoff[0].isbn;
        return isbn;
    } catch (e) {
        console.error(e);
        return e;
    }
};


const getSurplusIsbns = async (isbn, isbnArray) => {
    try {
        let start = false, result = [];
        for(let _isbn of isbnArray){
            if(_isbn === isbn){
                start = true;
            }
            if(start){
                result.push(_isbn);
            }
        }
        isbnList = result;
    } catch (e) {
        console.error(e);
        return [];
    }
};

const getAllProduct = async() => {
    try {
        let number = 0, results = [], faileds = [];
        const breakOffIsbn = await getBreakOff();
        if(breakOffIsbn !== ""){
            await getSurplusIsbns(breakOffIsbn, isbnList);
        }
        for(let isbn of isbnList){
            await saveBreakOff(isbn);
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


exports.saveProduct = saveProduct;