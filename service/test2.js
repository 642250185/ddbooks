const url = require('url');
const _path = require('path');
const fs = require('fs-extra');
const async = require('async');
const cheerio = require('cheerio');
const superagent = require('superagent');

const config = require('../config/config');

const {testDataPath} = config.dd;

const cnodeUrl = 'https://cnodejs.org/';

const arr_url = [
    'https://cnodejs.org/topic/5beb95fbbe1b120abac59180',
    'https://cnodejs.org/topic/5bd4772a14e994202cd5bdb7',
    'https://cnodejs.org/topic/5baee8de9545eaf107b9c6f3',
    'https://cnodejs.org/topic/5b8de66137b3005a0b0e6b3f',
    'https://cnodejs.org/topic/5b7f8a2c944cb8340c27e335',
    'https://cnodejs.org/topic/5bec3714a05b0e0ae443b366',
    'https://cnodejs.org/topic/5bebf18ebe1b120abac594ee',
    'https://cnodejs.org/topic/5bec2ceabe1b120abac59639',
    'https://cnodejs.org/topic/5bec067cbe1b120abac59565',
    'https://cnodejs.org/topic/5bec0ef0a05b0e0ae443b2c1',
    'https://cnodejs.org/topic/5be1b0bb646a05745b7b9074',
    'https://cnodejs.org/topic/5bea391de161dc409d7612b6',
    'https://cnodejs.org/topic/5bebbc2dbe1b120abac592a2',
    'https://cnodejs.org/topic/5bcc139215e4fd1923f4911f',
    'https://cnodejs.org/topic/5bead9e92fed25406c25e3ce',
    'https://cnodejs.org/topic/5ab3166be7b166bb7b9eccf7',
    'https://cnodejs.org/topic/5bea75dd2fed25406c25e0fa',
    'https://cnodejs.org/topic/5beba11ebe1b120abac591ed',
    'https://cnodejs.org/topic/5bbb3f1e15e4fd1923f48d44',
    'https://cnodejs.org/topic/5b3e2e8c35342ab069061298',
    'https://cnodejs.org/topic/5be41bfa21d75b74609f57dd',
    'https://cnodejs.org/topic/5bea705ae161dc409d7613d8',
    'https://cnodejs.org/topic/5b752e507271129a2f32aa38',
    'https://cnodejs.org/topic/5beacdf62fed25406c25e3a0',
    'https://cnodejs.org/topic/5b8e207937b3005a0b0e6b50',
    'https://cnodejs.org/topic/5beab573e161dc409d76160b',
    'https://cnodejs.org/topic/5ac478e10ab0448f0fe3f86d',
    'https://cnodejs.org/topic/5bea0b082fed25406c25dddb',
    'https://cnodejs.org/topic/5bea9dc82fed25406c25e2c0',
    'https://cnodejs.org/topic/5be6cffb646a05745b7ba792',
    'https://cnodejs.org/topic/5be673da21d75b74609f603a',
    'https://cnodejs.org/topic/5be246c321d75b74609f4b94',
    'https://cnodejs.org/topic/5b52cc67fb9e84ec69cc1ca3',
    'https://cnodejs.org/topic/5ba5fd6237a6965f59051bd1',
    'https://cnodejs.org/topic/5bea3a962fed25406c25df9e',
    'https://cnodejs.org/topic/5bea3957e161dc409d7612c0',
    'https://cnodejs.org/topic/5be69602646a05745b7ba710',
    'https://cnodejs.org/topic/5be95c612fed25406c25dcd1',
    'https://cnodejs.org/topic/5b44291035342ab0690613d6',
    'https://cnodejs.org/topic/5bdb055f646a05745b7b71a4'
];


const test = async() => {
    try {

        /*superagent.get(cnodeUrl).end(function(err, res) {
            if (err) {
                return console.error(err)
            }
            // 存放标题url的数组
            const topicUrls = [];
            const $ = cheerio.load(res.text);


            //获取首页所有的链接
            $('#topic_list .topic_title').each(function (idx, el) {
                if (idx < 40) {
                    var $el = $(el);
                    var href = url.resolve(cnodeUrl, $el.attr('href'));
                    topicUrls.push(href);
                }
            });
            //并发连接数的计数器
            let concurrencyCount = 0;


            let fetch = function (url, callback) {
                console.time('  耗时');
                concurrencyCount++;
                superagent.get(url).end( function (err, res) {
                    console.log('并发数:', concurrencyCount--, 'fetch', url);
                    //var $ = cheerio.load(res.text);
                    callback(null, [url, res.text]);
                });

            };*/

            let concurrencyCount = 0;

            let fetch = function (url, callback) {
                console.time('  耗时');
                concurrencyCount++;
                superagent.get(url).end( function (err, res) {
                    console.log('并发数:', concurrencyCount--, 'fetch', url);
                    //var $ = cheerio.load(res.text);
                    callback(null, [url, res.text]);
                });
            };

            console.info('arr_url.size: ', arr_url.length);

            async.mapLimit(arr_url, 11, function (topicUrl, callback) {
                fetch(topicUrl, callback);
                console.timeEnd("  耗时");
            }, async function (err, result) {
                console.info('result.size: ', result.length);
                result = result.map( function (pair) {
                    var $ = cheerio.load(pair[1]);
                    return ({
                        title: $('.topic_full_title').text().trim(),
                        href: pair[0],
                        comment1: $('.reply_content').eq(0).text().trim(),
                        author1: $('.reply_author').eq(0).text().trim() || "评论不存在",
                    });
                });
                console.log('final:\n',result);

                await fs.ensureDir(_path.join(testDataPath, '..'));
                fs.writeFileSync(testDataPath, JSON.stringify(result, null, 4));

                return result;
            });

        // });
    } catch (e) {
        console.error(e);
        return e;
    }
};


test();