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

const urlTable = {
    "authURL1": "https://acorn.utoronto.ca/sws",
    "authURL2": "https://weblogin.utoronto.ca/",
    "authURL3": "https://idp.utorauth.utoronto.ca/PubCookie.reply",
    "acornURL": "https://acorn.utoronto.ca/spACS"
};

const formHeader = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36',
    'content-type': 'application/x-www-form-urlencoded',
    'Accept': 'text/html'
};

interface LooseObj {
    [key: string]: string;
}

export class BaseAcornAPI {
    protected cookieJar = rp.jar(); // Use default cookie jar implementation in request-promise
    private username: string;
    private password: string;

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
     * Login to Acorn
     * @throws AcornError throw AcornError if login failed
     * @returns Boolean will be true if all processes goes properly
     */
    public async login(): Promise<boolean> {
        let body: string = await rp.get({
            uri: urlTable.authURL1,
            jar: this.cookieJar
        });
        body = await rp.post({
            uri: urlTable.authURL2,
            jar: this.cookieJar,
            headers: formHeader,
            form: this.extractFormData(body),
        });
        let loginInfo = this.extractFormData(body);
        loginInfo['user'] = this.username;
        loginInfo['pass'] = this.password;
        body = await rp.post({
            uri: urlTable.authURL2,
            jar: this.cookieJar,
            headers: formHeader,
            form: loginInfo,
        });

        if (body.search('Authentication failed') > -1)
            throw new AcornError('Invalid Identity');

        body = await rp.post({
            uri: urlTable.authURL3,
            jar: this.cookieJar,
            headers: formHeader,
            form: this.extractFormData(body),
            followAllRedirects: true
        });

        if (body.search('<h1>A problem has occurred</H1>') > -1)
            throw new AcornError('A problem has occurred');

        body = await rp.post({
            uri: urlTable.acornURL,
            jar: this.cookieJar,
            headers: formHeader,
            form: this.extractFormData(body),
            followAllRedirects: true
        });

        if (!body.search('<title>ACORN</title>'))
            throw new AcornError('Acorn Unavailable Now');

        return true;
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
        const inputs: Array<libxmljs.Element> = sanctifiedDoc.find('//form//input[@type="hidden"]');
        let result: LooseObj = {};
        for (let input of inputs) {
            result[input.attr('name').value()] = input.attr('value') ? input.attr('value').value() : "";
        }
        return result;
    }
}