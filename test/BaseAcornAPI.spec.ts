/**
 * Created by Charlie on 2017-09-24.
 */

import {expect} from 'chai';
import {BaseAcornAPI} from '../src/BaseAcornAPI';
import {AcornError} from "../src/AcornError";

require('chai').use(require('chai-as-promised')).should();

const config = JSON.parse(require('fs').readFileSync('./test/test_config.json'));

describe('BaseAcornAPI', function (){
    this.timeout(15000); // set timeout to be 15s instead of default 2
    let base: BaseAcornAPI;
    it('should be created', function() {
        base = new BaseAcornAPI(config.data.user, config.data.pass);
        expect(base).to.not.be.null;
    });

    // High Delay
    it('should login the user', async function() {
        let result = await base.login();
        expect(result).to.be.true;
    });

    it('should throw Acorn Error when user/pass pair is incorrect', function() {
        let incorrectBase = new BaseAcornAPI('user', 'pass');
        expect(incorrectBase.login()).eventually.throws(new AcornError('Invalid Identity'));
    });
});