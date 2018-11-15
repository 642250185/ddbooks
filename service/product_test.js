const _ = require('lodash');
const _path = require('path');
const fs = require('fs-extra');
const cheerio = require('cheerio');
const request = require('superagent');
const xlsx = require('node-xlsx').default;
const config = require('../config/config');

const async = require('async');
const zlib = require('zlib');
const Buffer = require('buffer').Buffer;
const {domain, mainPath, productPath, searchResultPath, failedsPath, detailsPath, breakOffPath, exportPath, imagesPath, filePath} = config.dd;


let isbnList = [];
const obj  = xlsx.parse(filePath);
Object.keys(obj).forEach(function(key) {
    obj[key].data.forEach(function(item){
        isbnList.push(item[0]);
    });
});

let index = 0;

/**
 * 采集URL
 * @param buffer
 * @param isbn
 * @returns {Promise<*>}
 */
const getUrl = async(buffer, isbn) => {
    try {
        return new Promise(function(resolve, reject){
            zlib.unzip(buffer, (err, doc) => {
                if (!err) {
                    const r = doc.toString();
                    const $ = cheerio.load(r, {decodeEntities: false});
                    const aTag = $('#search_nature_rg').find('li').eq(0).find('a');
                    const url = aTag.attr('href');
                    if(_.isEmpty(url)){
                        console.warn(`${isbn} 未获取到URL!`);
                    } else {
                        console.info(`${isbn} ${url}`);
                    }
                    resolve(url);
                } else {
                    reject(err);
                }
            });
        });
    } catch (e) {
        console.error(e);
        return e;
    }
};

/**
 * 获取数据源
 * @param isbn
 * @returns {Promise<*>}
 */
const getProduct = async(isbn) => {
    try {
        ++index;
        const main_path = `${mainPath}${searchResultPath}`;
        let result = await request.post(main_path)
            .set('Content-Type', 'application/json')
            .send({
                "head": {
                    "version": "1.0.0"
                },
                "param": {
                    "token" : "d9a57117c592435fa8e3c23f34d397a1",
                    "uid"   : "99",
                    "key"   : `${isbn}`
                }
            });
        result = JSON.parse(result.text);
        const {code, description, ret} = result.data;
        let url = "";
        if(code === 0){
            const buffer = Buffer.from(ret, 'base64');
            url = await getUrl(buffer, isbn);
        } else {
            console.error(`${code} ${description}`);
        }
        return url;
    } catch (e) {
        console.error(e);
        return e;
    }
};


const _getProduct = async function(isbn, callback){
    const main_path = `${mainPath}${searchResultPath}`;
    let result = await request.post(main_path)
        .set('Content-Type', 'application/json')
        .send({
            "head": {
                "version": "1.0.0"
            },
            "param": {
                "token" : "d9a57117c592435fa8e3c23f34d397a1",
                "uid"   : "99",
                "key"   : `${isbn}`
            }
        });
    result = JSON.parse(result.text);
    const {code, description, ret} = result.data;
    let url = "";
    if(code === 0){
        const buffer = Buffer.from(ret, 'base64');
        url = await getUrl(buffer, isbn);
    } else {
        console.error(`${code} ${description}`);
    }
    callback(null, url);
};


const _getAllProduct = async function(){
    console.info(`ISBN数量 :: `, isbnList.length);
    let number = 0, results = [], faileds = [];
    async.mapLimit(isbnList, 10, async (isbn, callback) => {
        await _getProduct(isbn, function (err, res) {
            console.error('err: ', err);
            console.info('res: ', res);
            callback(null, res);
        });
    }, function(err, result){
        console.info('size: %d, result: ',result.length, result);
        result.map((item) => {
            console.info('item: ', item);
        });
    });
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
        }
        return {results};
    } catch (e) {
        console.error(e);
        return [];
    }
};


const saveProduct = async() => {
    try {
        const results = await getAllProduct();
        console.info('results: ', results);
        return results;
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
        if(!_.isEmpty(result)){
            isbnList = result;
        }
    } catch (e) {
        console.error(e);
        return [];
    }
};


_getAllProduct();
// exports.saveProduct = saveProduct;