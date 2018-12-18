const _ = require('lodash');
const _path = require('path');
const fs = require('fs-extra');
const xlsx = require('node-xlsx').default;
const config = require('../config/config');

const {exportPath, detailsPath} = config.dd;

const getAllBooks = async() => {
    try {
        const books = await $book.find({status: false});
        await fs.ensureDir(_path.join(detailsPath, '..'));
        fs.writeFileSync(detailsPath, JSON.stringify(books, null, 4));
        return books;
    } catch (e) {
        console.error(e);
        return [];
    }
};


const exportExcel = async() => {
    try {
        const books = await getAllBooks();
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
        const filename = `${exportPath}/1-10WddResult.xlsx`;
        fs.writeFileSync(filename, xlsx.build([
            {name: '当当书籍', data: booksExcel},
        ]));
        console.log(`爬取结束, 成功导出文件: ${filename}`);
    } catch (e) {
        console.error(e);
        return e;
    }
};


exports.exportExcel = exportExcel;