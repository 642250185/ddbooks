require('../schema');
const _ = require('lodash');
const zlib = require('zlib');
const _path = require('path');
const fs = require('fs-extra');
const async = require('async');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const request = require('superagent');
const Buffer = require('buffer').Buffer;
const xlsx = require('node-xlsx').default;
const config = require('../config/config');
const {mainPath, filePath, breakOffPath, searchResultPath} = config.dd;

let isbnList = [];
const obj  = xlsx.parse(filePath);
Object.keys(obj).forEach(function(key) {
    obj[key].data.forEach(function(item) {
        isbnList.push(item[0]);
    });
});

const getBookUrl = async() => {
    try {
        let number = 0;
        // 保存中断ISBN
        const saveBreakOff = async function(isbn) {
            const results = [{isbn: isbn}];
            await fs.ensureDir(_path.join(breakOffPath, '..'));
            fs.writeFileSync(breakOffPath, JSON.stringify(results, null, 4));
        };
        // 获取剩余的ISBN
        const getSurplusIsbns = async function(isbn, isbnArray) {
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
        };
        // 获取中断ISBN
        const getBreakOff = async function(){
            const breakoff = JSON.parse(fs.readFileSync(breakOffPath));
            const isbn = breakoff[0].isbn;
            if(isbn !== 0){
                console.info('filtrate before: ', isbnList.length);
                // 最后一个值
                const end = isbnList[isbnList.length - 1];
                console.info(`now: ${isbn}    |    end: ${end}`);
                if(isbn == end){
                    isbnList = [];
                    console.warn(`所有ISBN已经爬取完`);
                }
                await getSurplusIsbns(isbn, isbnList);
                console.info('filtrate after: ', isbnList.length);
            }
        };
        // 解析URL
        const analysisUrl = function(buffer, isbn, callback){
            zlib.unzip(buffer, async (err, doc) =>{
                if(!err){
                    const r = doc.toString();
                    const $ = cheerio.load(r, {decodeEntities: false});
                    const aTag = $('#search_nature_rg').find('li').eq(0).find('a');
                    const url = aTag.attr('href');
                    if(!_.isEmpty(url)){
                        await saveBreakOff(isbn);
                        console.info(`${++number}   ${isbn}   ${url}`);
                        const product = {
                            _id     : new mongoose.Types.ObjectId,
                            isbn    : isbn,
                            url     : url
                        };
                        await new $product(product).save();
                        callback(null, {isbn, url});
                    } else {
                        console.warn(`${++number}   ${isbn}   未获取到URL`);
                        callback(null, {isbn, url});
                    }
                }
            });
        };
        // 请求获取数据
        let fetch = function (isbn, callback) {
            const main_path = `${mainPath}${searchResultPath}`;
            request.post(main_path)
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
                })
                .end(function (err, res) {
                    if(_.isEmpty(res)){
                        callback(null, {});
                    } else {
                        const rs = JSON.parse(res.text);
                        const {code, description, ret} = rs.data;
                        if(code === 0){
                            const buffer = Buffer.from(ret, 'base64');
                            analysisUrl(buffer,isbn, callback);
                        }
                    }
                });
        };
        // 执行比较
        await getBreakOff();
        // 并发请求
        async.mapLimit(isbnList, 10, async function(isbn, callback){
            fetch(isbn, callback);
        }, function(err, result){
            console.info('result.size: ', result.length, result);
        });
    } catch (e) {
        console.error(e);
        return e;
    }
};


exports.getBookUrl = getBookUrl;