/**
 * Created by Charlie on 2017-10-15.
 */

import fs = require('fs');

const LOG_DIR = './test/logs/';
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
}

export const config =
    JSON.parse(fs.readFileSync('./test/test_config.json', 'utf-8'));

export function logToFileSync(file_name:string, data: object):void{
    fs.writeFileSync(`${LOG_DIR}${file_name}.json`, JSON.stringify(data));
}