const url = require('url');
const _path = require('path');
const fs = require('fs-extra');
const async = require('async');
const cheerio = require('cheerio');
const superagent = require('superagent');

const config = require('../config/config');

const {testDataPath} = config.dd;

const cnodeUrl = 'https://cnodejs.org/';

const test = async() => {
    try {
        superagent.get(cnodeUrl).end(function(err, res) {
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

            };

            async.mapLimit(topicUrls, 11, function (topicUrl, callback) {
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
        });
    } catch (e) {
        console.error(e);
        return e;
    }
};


test();