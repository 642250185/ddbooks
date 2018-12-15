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

let number = 0;
const getData = async(isbn) => {
    try {
        const main_path = `${mainPath}${searchResultPath}`;
        return new Promise(function (resolve, reject) {
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
                }).end(function (err, res) {
                if(_.isEmpty(res)){
                    resolve(-1);
                } else {
                    const rs = JSON.parse(res.text);
                    const {code, description, ret} = rs.data;
                    if(code === 0){
                        const buffer = Buffer.from(ret, 'base64');
                        resolve(buffer);
                    } else {
                        console.warn(`number:  ${++number} code: ${code}, ${description}`);
                        resolve(-1);
                    }
                }
            });
        });
    } catch (e) {
        console.error(e);
        return e;
    }
};

const analysisUrl = async(buffer, isbn) => {
    try {
        return new Promise(function (resolve, reject) {
            zlib.unzip(buffer,async(err, doc) =>{
                if(!err){
                    const r = doc.toString();
                    const $ = cheerio.load(r, {decodeEntities: false});
                    const aTag = $('#search_nature_rg').find('li').eq(0).find('a');
                    const url = aTag.attr('href');
                    if(!_.isEmpty(url)){
                        const product = {
                            _id     : new mongoose.Types.ObjectId,
                            isbn    : isbn,
                            url     : url
                        };
                        await new $product(product).save();
                        resolve(url);
                    } else {
                        resolve(-1);
                    }
                }
            });
        });
    } catch (e) {
        console.error(e);
        return e;
    }
};

const getBookUrl = async() => {
    for(const isbn of isbnList){
        const buffer = await getData(isbn);
        if(buffer === -1){
            continue;
        }
        const url = await analysisUrl(buffer, isbn);
        console.info('url:', url);
    }
};


exports.getBookUrl = getBookUrl;