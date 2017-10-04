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
import {BaseAcornAPI} from "./AcornAPI";

const ACORN_HOST = "https://acorn.utoronto.ca";
const urlTable = {
    "authURL1": ACORN_HOST + "/sws",
    "authURL2": "https://weblogin.utoronto.ca/",
    "authURL3": "https://idp.utorauth.utoronto.ca/PubCookie.reply",
    "acornURL": ACORN_HOST + "/spACS"
};

const formHeader = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36',
    'content-type': 'application/x-www-form-urlencoded',
    'Accept': 'text/html'
};

interface LooseObj {
    [key: string]: string;
}

export class BasicAcornAPI extends BaseAcornAPI {
    /**
     * Login to Acorn
     * @throws AcornError throw AcornError if login failed
     * @returns Boolean will be true if all processes goes properly
     */
    public async login(user: string, pass: string): Promise<boolean> {
        let body: string = await rp.get({
            uri: urlTable.authURL1,
            jar: this.state.cookieJar
        });
        body = await rp.post({
            uri: urlTable.authURL2,
            jar: this.state.cookieJar,
            headers: formHeader,
            form: BasicAcornAPI.extractFormData(body),
        });
        let loginInfo = BasicAcornAPI.extractFormData(body);
        loginInfo['user'] = user;
        loginInfo['pass'] = pass;
        body = await rp.post({
            uri: urlTable.authURL2,
            jar: this.state.cookieJar,
            headers: formHeader,
            form: loginInfo,
        });

        if (body.search('Authentication failed') > -1)
            throw new AcornError('Invalid Identity');

        body = await rp.post({
            uri: urlTable.authURL3,
            jar: this.state.cookieJar,
            headers: formHeader,
            form: BasicAcornAPI.extractFormData(body),
            followAllRedirects: true
        });

        if (body.search('<h1>A problem has occurred</H1>') > -1)
            throw new AcornError('A problem has occurred');

        body = await rp.post({
            uri: urlTable.acornURL,
            jar: this.state.cookieJar,
            headers: formHeader,
            form: BasicAcornAPI.extractFormData(body),
            followAllRedirects: true
        });

        if (!(body.search('<title>ACORN</title>') > -1))
            throw new AcornError('Acorn Unavailable Now');

        // TODO check cookie to verify whether logged in
        this.state.isLoggedIn = true;
        return true;
    }

    /**
     * Extract data from fields of all existing forms from HTML string or dom
     * Helper method to facilitate auth process
     * @param doc HTML Document or HTML string
     * @return LooseObj loose javascript object
     */
    private static extractFormData(doc: libxmljs.HTMLDocument | string): LooseObj {
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