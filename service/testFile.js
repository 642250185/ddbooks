const path = require('path');
const fs = require('fs-extra');

const testPath = path.join(__dirname, '..', 'data/test.json');

fs.open(testPath, "a+", function (err, fd) {
    if(err){
        return console.error(err);
    }
    fs.writeFile(fd, [{"name": "b"}], function (err) {
        if(err){
            return console.error(err);
        }
    })
});
















