///<reference path="CourseInterfaces.ts"/>
'use strict';
import {BaseAcornAPI, needLogin} from "./AcornAPI";
import rp = require('request-promise');
import querystring = require('querystring');
import {AcornError} from "./AcornError";

/**
 * This class handles all course related actions on acorn
 * Created by Charlie on 2017-09-23.
 */

export class CourseAcornAPI extends BaseAcornAPI {
    private cachedRegistrations: Array<Acorn.Registration> = [];

    /**
     * Get user registration status
     * @return {TRequest}
     */
    @needLogin
    public async getEligibleRegistrations(): Promise<Array<Acorn.Registration>> {
        const res = await rp.get({
            uri: 'https://acorn.utoronto.ca/sws/rest/enrolment/eligible-registrations',
            jar: this.state.cookieJar,
            json: true
        });
        this.cachedRegistrations = res;
        return res;
    }

    /**
     * Get list of courses that are in enrollment cart
     */
    @needLogin
    public async getEnrolledCourses(registrationIndex: number = 0): Promise<Acorn.EnrolledCourses> {
        let registrations: Array<Acorn.Registration>;
        if (this.cachedRegistrations.length === 0) {
            registrations = (await this.getEligibleRegistrations());
        } else {
            registrations = this.cachedRegistrations;
        }
        if (!(registrations.length > registrationIndex)) {
            throw new AcornError(`Registration IndexOutOfBound! no enough registrations(need ${registrationIndex + 1}, but got ${registrations.length})`);
        }
        const getQueryStr = querystring.stringify(registrations[registrationIndex].registrationParams);
        return await rp.get({
            uri: 'https://acorn.utoronto.ca/sws/rest/enrolment/course/enrolled-courses?' + getQueryStr,
            jar: this.state.cookieJar,
            json: true,
        });
    }

    /**
     * Get list of courses that are either waitlisted or dropped
     */
    // public async getAppliedCourses(): Promise<object> {
    //
    // }

}