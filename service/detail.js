const _ = require('lodash');
const _path = require('path');
const fs = require('fs-extra');
const cheerio = require('cheerio');
const request = require('request');
const iconv = require('iconv-lite');
const superagent = require('superagent');
const xlsx = require('node-xlsx').default;
const config = require('../config/config');

const download = config.exportPath;
const productPath = config.productPath;
const detailsPath = config.detailsPath;

let num = 0;
const getShopBookInfo = async (productId, shopId) => {
    try {
        const domain = 'http://product.dangdang.com';
        const shopDetail = '/index.php';
        const url = `${domain}${shopDetail}?r=callback%2Fdetail&productId=${productId}&templateType=mall&describeMap=&shopId=${shopId}&categoryPath=`;
        return new Promise(function (resolve, reject) {
            const result = [];
            request.get({url: url, encoding: null}, async function (err, response, body) {
                let buf = iconv.decode(body, 'gbk');
                let $ = cheerio.load(buf);

                console.info('999999999999: ', $('body').html());
            });
        });
    } catch (e) {
        console.error(e);
        return e;
    }
};


const getData = (item) => {
    try {
        ++num;
        const {isbn, url} = item;
        return new Promise(function(resolve, reject){
            const result = [];
            request.get({url: url,encoding: null}, async function (err, response, body) {
                console.info(`[${num}] : ${isbn} ${url} ${response.statusCode} `);
                if(response.statusCode === 404){
                    console.warn(`[${num}] 404,页面不存在......!`);
                    resolve(0);
                }
                if(err) reject(err);
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
                arrCategroy.shift();
                const categroy = arrCategroy.join(" > ");
                // 图片
                const imgsList = [];
                $('#main-img-slide').find('li').each(function () {
                    const imgUrls = $(this).find('a').attr('data-imghref');
                    imgsList.push(imgUrls);
                });
                const src = imgsList.join("、");
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
                let _isbn = $('#detail_describe').find('li').eq(4).text();
                _isbn = _isbn.substring(_isbn.indexOf("：")+1, _isbn.length);
                // 出版社
                const public = $('.messbox_info').children().eq(1).find('a').text();
                let publicDate = $('.messbox_info').children().eq(2).text();
                publicDate = publicDate.substring(publicDate.indexOf(":")+1, publicDate.length);

                console.info(`[${num}] :${_isbn} ${title} ${categroy} ${price} ${m_price} ${e_price} ${public} ${publicDate} ${src}`);

                // if(_.isEmpty(_isbn) && !_.isEmpty(title)){
                //     const shopUrl = $('.title_name').find('a').attr('href');
                //     const shopId = shopUrl.substring(shopUrl.lastIndexOf("/") + 1, shopUrl.length);
                //     const productId = url.substring(url.lastIndexOf("/")+1, url.lastIndexOf("."));
                //     await getShopBookInfo(productId, shopId);
                // }

                if(_.isEmpty(_isbn) && _.isEmpty(title)){
                    resolve([]);
                } else {
                    result.push({isbn, channel: 0, title, categroy, src, price, m_price, e_price, paper_price:"", public, publicDate});
                    resolve(result);
                }
            });
        });
    } catch (e) {
        console.error(e);
        return e;
    }
};


const getCloudData = async (item) =>{
    try {
        const {isbn, url} = item;
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
        arrCategroys.shift();
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
        resultList.push({isbn, channel: 1, title, categroy, src, price: "", m_price:"", e_price, paper_price, public, publicDate});
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
        for(let item of products){
            ++index;
            let books = await getData(item);
            if(books === 0){
                continue;
            }
            if(_.isEmpty(books)){
                books = await getCloudData(item);
            }
            booklist = booklist.concat(books);
        }
        console.info('size: %d', booklist.length);
        return booklist;
    } catch (e) {
        console.error(e);
        return e;
    }
};


const saveDetail = async(books) => {
    try {
        await fs.ensureDir(_path.join(detailsPath, '..'));
        fs.writeFileSync(detailsPath, JSON.stringify(books, null, 4));
    } catch (e) {
        console.error(e);
        return e;
    }
};


const exportExcel = async() => {
    try {
        const books = await getDetail();
        await saveDetail(books);
        console.info(`${books.length} 条书籍信息`);
        const booksExcel = [['ISBN', '渠道(0:当当官网、1:当当云阅读)','书籍名称','分类','图片地址','抢购价', '原价', '电子书价', '纸质书价', '出版社', '出版时间']];
        for(let book of books){
            const row = [];
            row.push(book.isbn);
            row.push(book.channel);
            row.push(book.title);
            row.push(book.categroy);
            row.push(book.src);
            row.push(book.price);
            row.push(book.m_price);
            row.push(book.e_price);
            row.push(book.paper_price);
            row.push(book.public);
            row.push(book.publicDate);
            booksExcel.push(row);
        }
        const filename = `${download}/ddBooks.xlsx`;
        fs.writeFileSync(filename, xlsx.build([
            {name: '当当书籍', data: booksExcel},
        ]));
        console.log(`爬取结束, 成功导出文件: ${filename}`);
    } catch (e) {
        console.error(e);
        return e;
    }
};

exportExcel();
exports.exportExcel = exportExcel;