const _ = require('lodash');
const _path = require('path');
const fs = require('fs-extra');
const cheerio = require('cheerio');
const request = require('request');
const iconv = require('iconv-lite');
const superagent = require('superagent');
const xlsx = require('node-xlsx').default;
const config = require('../config/config');

const productPath = config.productPath;

let num = 0;
const getData = (url) => {
    try {
        ++num;
        return new Promise(function(resolve, reject){
            const result = [];
            request.get({url: url,encoding: null}, function (err, response, body) {
                let buf = iconv.decode(body, 'gb2312');
                let $ = cheerio.load(buf);
                // 分类
                const arrCategroy = [];
                $('.breadcrumb').children('a').each(function () {
                    const tx = $(this).text();
                    if(!_.isEmpty(tx)){
                        arrCategroy.push(tx);
                    }
                });
                const categroy = arrCategroy.join(" > ");
                // 图片
                const src = $('.img').find('img').attr('src');
                // 标题
                const title = $('.name_info').find('h1').attr('title');
                // 抢购价
                let price = $('#dd-price').text().trim();
                price = price.substring(price.indexOf("￥"), price.length);
                // 原价
                let m_price = $('#original-price').text().trim();
                m_price = m_price.substring(m_price.indexOf("￥"), m_price.length);
                // 电子书价
                const e_price = $('.price_e').find('a').html();
                // ISBN
                let isbn = $('#detail_describe').find('li').eq(4).text();
                isbn = isbn.substring(isbn.indexOf("：")+1, isbn.length);
                // 出版社
                const public = $('.messbox_info').children().eq(1).find('a').text();
                let publicDate = $('.messbox_info').children().eq(2).text();
                publicDate = publicDate.substring(publicDate.indexOf(":")+1, publicDate.length);
                console.info(`[${num}] : ${title} ${categroy} ${price} ${m_price} ${e_price} ${public} ${publicDate} ${src}`);
                if(_.isEmpty(isbn)){
                    resolve([]);
                } else {
                    result.push({channel: 0, title, categroy, src, price, m_price, e_price, paper_price:"", public, publicDate});
                    resolve(result);
                }
            });
        });
    } catch (e) {
        console.error(e);
        return e;
    }
};


const getCloudData = async (url) =>{
    try {
        let result = await superagent.get(url);
        const $ = cheerio.load(result.text, {decodeEntities: false});
        // 分类
        let resultList = []; const arrCategroys = [];
        $('#crumb').children('a').each(function () {
            let tx = $(this).text();
            if(!_.isEmpty(tx)){
                tx = tx.substring(0, tx.lastIndexOf('>')-2);
                if(!_.isEmpty(tx.trim())){
                    arrCategroys.push(tx.trim());
                }
            }
        });
        const categroy = arrCategroys.join(' > ');
        // 图片
        let src = $('.bookCover_area').find('img').attr('src');
        // 标题
        let title = $('.title_words').text();
        // 抢购价
        let e_price = $('.normal_price').find('i').text();
        // 纸质书价
        let paper_price = $('.paper_price').text();
        paper_price = paper_price.substring(paper_price.indexOf("：")+2, paper_price.indexOf(".")+3);
        // 出版社
        const public = $('.explain_box').children().eq(1).find('a').text();
        // 出版时间
        let publicDate = $('.explain_box').children().eq(2).text();
        publicDate = publicDate.substring(publicDate.indexOf("：")+1, publicDate.length);

        console.info(`[${num}] : ${title} ${categroy} ${e_price} ${public} ${publicDate} ${src}`);
        resultList.push({channel: 1, title, categroy, src, price: "", m_price:"", e_price, paper_price, public, publicDate});
        return resultList;
    } catch (e) {
        console.error(e);
        return e;
    }
};


const getDetail = async() => {
    try {
        const products = JSON.parse(fs.readFileSync(productPath));
        console.info(`书籍总数为: ${products.length}`);
        let index = 0, booklist = [];
        for(let url of products){
            ++index;
            let books = await getData(url);
            if(books.length === 0){
                books = await getCloudData(url);
            }
            booklist = booklist.concat(books);
            if(index === 15){
                break;
            }
        }
        console.info('size: %d, booklist: %j', booklist.length, booklist);

    } catch (e) {
        console.error(e);
        return e;
    }
};


getDetail();

