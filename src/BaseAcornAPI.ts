/**
 * This Class provides basic acorn actions
 *
 * Created by Charlie on 2017-09-22.
 */

import tough = require('tough-cookie');
import request = require('request');
import rp = require('request-promise');

import libxmljs = require('libxmljs');

import {AcornError} from './AcornError';

// rp.defaults({jar: true}); // enable cookies for request

const urlTable = {
    "authURL1": "https://acorn.utoronto.ca/sws",
    "authURL2": "https://weblogin.utoronto.ca/",
    "authURL3": "https://idp.utorauth.utoronto.ca/PubCookie.reply",
    "acornURL": "https://acorn.utoronto.ca/spACS"
};

interface LooseObj {
    [key: string]: string
}

const headers = {
    // "Host": "weblogin.utoronto.ca",
    // "Connection": "keep-alive",
    // "Pragma": "no-cache",
    // "Cache-Control": "no-cache",
    "Origin": "https://idp.utorauth.utoronto.ca",
    // "Upgrade-Insecure-Requests": 1,
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36",
    // "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Referer": "https://idp.utorauth.utoronto.ca/idp/Authn/RemoteUserForceAuth",
    // "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "zh-CN,zh;q=0.8,en;q=0.6"
};

export class BaseAcornAPI {
    username: string;
    password: string;

    /**
     * Password login acorn
     * @param username
     * @param password
     */
    public constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }

    /**
     * Try to login
     */
    public async login(): Promise<void> {
        const cookieJar = rp.jar();
        let body: string = await rp.get({
            uri: urlTable.authURL1,
            jar: cookieJar
        });
        // console.log(this.extractFormData(body));
        body = await rp.post(urlTable.authURL2, {
            // jar: cookieJar,
            body: this.extractFormData(body),
            json: true
        });

        // require('fs').writeFileSync('./auth.html', body);
        let loginInfo = this.extractFormData(body);
        loginInfo['user'] = this.username;
        loginInfo['pass'] = this.password;
        // console.log(loginInfo);
        let config = {
            uri: urlTable.authURL2,
            jar: cookieJar,
            formData: loginInfo,
        };
        // console.log(config);
        body = await rp.post(config);

        if (body.search('Authentication failed')) throw new AcornError('Invalid Identity');
        body = await rp.post({
            uri: urlTable.authURL3,
            jar: cookieJar,
            formData: this.extractFormData(body)
        });
        if (body.search('<h1>A problem has occurred</H1>')) throw new AcornError('Invalid Identity');
        body = await rp.post({
            uri: urlTable.acornURL,
            jar: cookieJar,
            formData: this.extractFormData(body)
        });

        if (!body.search('<title>ACORN</title>'))
            throw new AcornError('Acorn Unavailable Now');

    }

    /**
     * Extract data from fields of all existing forms from HTML string or dom
     * @param doc HTML Document or HTML string
     */
    private extractFormData(doc: libxmljs.HTMLDocument | string): LooseObj {
        let sanctifiedDoc: libxmljs.HTMLDocument;
        if (typeof doc === 'string') {
            sanctifiedDoc = libxmljs.parseHtml(doc);
        } else {
            sanctifiedDoc = doc;
        }
        const inputs: Array<libxmljs.Element> = sanctifiedDoc.find('//form/input');
        let result: LooseObj = {};
        for (let input of inputs) {
            result[input.attr('name').value()] = input.attr('value').value();
        }
        return result;

    }
}