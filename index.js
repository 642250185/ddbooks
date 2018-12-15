require('./schema');
const {saveProduct} = require('./service/product');
const {getBookUrl} = require('./service/bookUrl');
const {exportExcel} = require('./service/detail');
const {saveAllImages} = require('./service/downloadImg');

const start = async() => {
    try {
        console.info('开始');

        console.info('开始采集根据isbn获取书籍链接......');
        await getBookUrl();
        console.info('根据isbn获取书籍链接数据采集完成......');

        console.info('开始采集书籍详情数据......');
        await exportExcel();
        console.info('书籍详情数据采集完成......');

        console.info('开始下载书籍图片......');
        await saveAllImages();
        console.info('图片下载完成......');

        console.info('结束');
    } catch (e) {
        console.error(e);
        return e;
    }
};


start();