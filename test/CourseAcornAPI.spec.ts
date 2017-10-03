/**
 * Created by Charlie on 2017-09-24.
 */

import {expect, should} from 'chai';
import {CourseAcornAPI} from "../src/CourseAcornAPI";
import {BasicAcornAPI} from "../src/BasicAcornAPI";
import {AcornStateManager} from "../src/AcornAPI";
import request = require("request");

require('chai').use(require('chai-as-promised')).should();

class AcornRegistration{
    post: {
        code: string,
        description: string,
        acpDuration: number
    };
    sessionCode: string;
    personId: number;
    acpDuration: number;
    secondaryOrgCode: string;
    registrationParams: {
        [key: string]: string
    };
    [key: string]: any;
}

const config = JSON.parse(require('fs').readFileSync('./test/test_config.json'));
describe('CourseAcornAPI', async function () {
    this.timeout(15000); // set timeout to be 15s instead of default 2
    let basicAPI: BasicAcornAPI;
    let courseAPI: CourseAcornAPI;
    it('should be created', function () {
        const state = new AcornStateManager(request.jar());
        basicAPI = new BasicAcornAPI(state);
        courseAPI = new CourseAcornAPI(state);

        expect(courseAPI).to.not.be.null;
        expect(courseAPI.state).to.not.be.undefined;
    });

    it('should share state with other AcornAPI instances', function () {
        expect(courseAPI.state).to.deep.equal(basicAPI.state);
    });

    it('should not get registration if not logged in', function () {
        courseAPI.getEligibleRegistrations().should.be.rejected;
    });

    it('should get registration if logged in', async function () {
        await basicAPI.login(config.data.user, config.data.pass);
        expect(basicAPI.state.isLoggedIn).to.be.true;

        let res = await courseAPI.getEligibleRegistrations();
        res.should.be.a.instanceof(Array);
        (<Array<any>>res)[0].should.haveOwnProperty('registrationParams');
    });
});