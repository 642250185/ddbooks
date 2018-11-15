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
const {mainPath, filePath, searchResultPath} = config.dd;

let isbnList = [];
const obj  = xlsx.parse(filePath);
Object.keys(obj).forEach(function(key) {
    obj[key].data.forEach(function(item) {
        isbnList.push(item[0]);
    });
});

const test = async() => {
    try {
        let number = 0;
        // 解析URL
        const analysisUrl = function(buffer, isbn, callback){
            zlib.unzip(buffer, async (err, doc) =>{
                if(!err){
                    const r = doc.toString();
                    const $ = cheerio.load(r, {decodeEntities: false});
                    const aTag = $('#search_nature_rg').find('li').eq(0).find('a');
                    const url = aTag.attr('href');
                    if(!_.isEmpty(url)){
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
        // 并发请求
        async.mapLimit(isbnList, 10, function(isbn, callback){
            fetch(isbn, callback);
        }, function(err, result){
            console.info('result.size: ', result.length, result);
        });
    } catch (e) {
        console.error(e);
        return e;
    }
};


test();