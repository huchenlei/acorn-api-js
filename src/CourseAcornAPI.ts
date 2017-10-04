///<reference path="CourseInterfaces.ts"/>
'use strict';
import {BaseAcornAPI, needLogin} from "./AcornAPI";
import rp = require('request-promise');
import querystring = require('querystring');
import {AcornError} from "./AcornError";
import _ = require('lodash');

/**
 * This class handles all course related actions on acorn
 * Created by Charlie on 2017-09-23.
 */


function needRegistration(target: any, propertyKey: string, descriptor: any) {
    if (descriptor === undefined) {
        descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
    }
    let originalMethod = descriptor.value;
    descriptor.value = async function (registrationIndex: number = 0, ...args: any[]) {
        if ((<CourseAcornAPI>this).cachedRegistrations.length === 0) {
            await (<CourseAcornAPI>this).getEligibleRegistrations();
        }
        const regisNum = (<CourseAcornAPI>this).cachedRegistrations.length;
        if (!(regisNum > registrationIndex)) {
            throw new AcornError(`Registration IndexOutOfBound! no enough registrations(need ${registrationIndex + 1}, but got ${regisNum})`);
        }
        args.unshift(registrationIndex); // add registration index at the front of args
        return originalMethod.apply(this, args);
    };
    return descriptor;
}

export class CourseAcornAPI extends BaseAcornAPI {
    cachedRegistrations: Array<Acorn.Registration> = [];

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
     * Get list of courses that are currently enrolled(APP), waitlisted(WAIT), dropped(DROP)
     * @param registrationIndex
     * @return {TRequest}
     */
    @needLogin
    @needRegistration
    public async getEnrolledCourses(registrationIndex: number = 0): Promise<Acorn.EnrolledCourses> {
        const getQueryStr = querystring.stringify(this.cachedRegistrations[registrationIndex].registrationParams);
        return await rp.get({
            uri: 'https://acorn.utoronto.ca/sws/rest/enrolment/course/enrolled-courses?' + getQueryStr,
            jar: this.state.cookieJar,
            json: true
        });
    }

    /**
     * Get list of courses that are in enrollment cart
     * @param registrationIndex
     * @return {TRequest}
     */
    @needLogin
    @needRegistration
    public async getCartedCourses(registrationIndex: number = 0): Promise<Array<Acorn.CartedCourse>> {
        const getQueryStr = querystring.stringify(_.pick(this.cachedRegistrations[registrationIndex],
            ['candidacyPostCode', 'candidacySessionCode', 'sessionCode']));
        return await rp.get({
            uri: 'https://acorn.utoronto.ca/sws/rest/enrolment/plan?' + getQueryStr,
            jar: this.state.cookieJar,
            json: true
        });
    }
}