/**
 * Created by Charlie on 2017-09-24.
 */

import {expect, should} from 'chai';
import {CourseAcornAPI} from "../src/CourseAcornAPI";

require('chai').use(require('chai-as-promised')).should();

const config = JSON.parse(require('fs').readFileSync('./test/test_config.json'));
describe('CourseAcornAPI', async function () {
    let courseAPI: CourseAcornAPI;
    it('should be created', function () {
        courseAPI = new CourseAcornAPI();
        expect(courseAPI).to.not.be.null;
        expect(courseAPI.state).to.not.be.undefined;
    });

    it('should not get registration if not logged in', function () {
        courseAPI.getEligibleRegistrations().should.be.rejected;
    });

    it('should get registration if logged in', async function () {
        let res = await courseAPI.getEligibleRegistrations();
        res.should.be.a.instanceof(Object);
    });
});