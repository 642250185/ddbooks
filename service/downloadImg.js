const uuid = require('uuid');
const fs = require('fs-extra');
const request = require('superagent');
const sleep = require('js-sleep/js-sleep');
const config = require('../config/config');

const imagesPath = config.imagesPath;
const detailsPath = config.detailsPath;


let count = 0;
const downloadImages = async(isbn, title, src) => {
    try {
        ++count;
        const imgs = src.split("、");
        console.info(`${isbn} - ${title} 共 ${imgs.length} 张图片`);
        for(let url of imgs){
            await sleep(1000 * 2);
            const uuidStr = uuid();
            const fileName = `${isbn}-${uuidStr}`;
            const path = `${imagesPath}/${fileName}.jpeg`;
            await request(url).pipe(fs.createWriteStream(path)).on('close', () =>{
                console.info(`[${count}]:[${isbn}]: -> ${fileName}.jpeg Download Success!`);
            });
        }
    } catch (e) {
        console.error(e);
        return e;
    }
};


const saveAllImages = async() => {
    try {
        const details = JSON.parse(fs.readFileSync(detailsPath));
        console.info(`共 ${details.length} 本书准备下载图片......`);
        for(let item of details){
            const {isbn, title, src} = item;
            await downloadImages(isbn, title, src);
        }
    } catch (e) {
        console.error(e);
        return e;
    }
};


exports.saveAllImages = saveAllImages;