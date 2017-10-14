/**
 * Created by Charlie on 2017-09-24.
 */
import {expect} from "chai";
import {CourseAcornAPI} from "../src/CourseAcornAPI";
import {BasicAcornAPI} from "../src/BasicAcornAPI";
import {AcornStateManager} from "../src/AcornAPI";
import {AcornError} from '../src/AcornError';
import request = require("request");
import assert = require('assert');
import _ = require("lodash");


require('chai').use(require('chai-as-promised')).should();

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

    /**
     * Test for @needLogin decorator
     */
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

    it('should get enrolled courses if logged in', async function () {
        // const result =
        await courseAPI.getEnrolledCourses();
        // require('fs').writeFileSync('./encourse.json', JSON.stringify(result));
    });

    let cartedCourse: Acorn.CartedCourse | null = null;
    it('should get carted courses if logged in', async function () {
        const cartedCourses = await courseAPI.getCartedCourses();
        // For later testing use
        if (cartedCourses.length > 0) {
            cartedCourse = cartedCourses[0];
        }
    });

    // TODO test when course registration is open
    // it('should enroll course if logged in', async function () {
    //     await courseAPI.enroll(0, "CSC467", "F", "LEC,0101");
    // });

    /**
     * To test this part
     * The tester's acorn account must have at least one course in enrollment cart
     */
    it('should get extra course info if logged in', async function () {
        if (cartedCourse === null) {
            throw new AcornError('No course in course cart, unable to find extra info');
        }
        const sessionCodes = _.compact(_.values<string>(_.pick(cartedCourse,
            ['regSessionCode1', 'regSessionCode2', 'regSessionCode3'])));
        assert(sessionCodes.length > 0, 'no session code available'); // need at least one sessionCode
        const res = await courseAPI.getExtraCourseInfo(
            0, cartedCourse.courseCode, sessionCodes[0], cartedCourse.sectionCode);
    });
});