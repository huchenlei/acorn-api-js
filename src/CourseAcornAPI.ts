///<reference path="CourseInterfaces.ts"/>
'use strict';
import {BaseAcornAPI, needLogin} from "./AcornAPI";
import rp = require('request-promise');
import querystring = require('querystring');
import {AcornError} from "./AcornError";
import _ = require('lodash');
import assert = require('assert');

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

interface CookieValue {
    key: string;
    value: string;
    [key: string]: any;
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

    /**
     * Normally registrationIndex = 1 is summer course
     * {"course":{"code":"CSC236H1","sectionCode":"Y","primaryTeachMethod":"LEC","enroled":false},"lecture":{"sectionNo":"LEC,5101"},"tutorial":{},"practical":{}}
     *
     * [WARNING] this method has not been tested yet;
     * Currently its logic is directly copied from Acorn API(Java)
     * @param registrationIndex
     * @param code courseCode
     * @param sectionCode
     * @param lectureSectionNo
     */
    @needLogin
    @needRegistration
    public async enroll(registrationIndex: number,
                        code: string,
                        sectionCode: string,
                        lectureSectionNo: string): Promise<boolean> {
        const payload = {
            activeCourse: {
                course: {
                    code,
                    sectionCode: sectionCode.toUpperCase(),
                    primaryTeachMethod: "LEC",
                    enrolled: "false"
                },
                lecture: {
                    sectionNo: lectureSectionNo.toUpperCase()
                },
                tutorial: {},
                practical: {}
            },
            eligRegParams: this.cachedRegistrations[registrationIndex].registrationParams
        };
        let xsrfToken = "";
        this.state.cookieJar.getCookies('https://acorn.utoronto.ca').forEach(cookie => {
            const cv = <CookieValue>JSON.parse(JSON.stringify(cookie));
            if (cv.key === 'XSRF-TOKEN') {
                xsrfToken = cv.value;
            }
        });

        assert(xsrfToken !== "", "unable to locate xsrf-token in cookies");
        const res = await rp.post({
            uri: 'https://acorn.utoronto.ca/sws/rest/enrolment/course/modify',
            body: payload,
            headers: {
                "X-XSRF-TOKEN": xsrfToken
            }
        });
        return true;
    }

    /**
     * This method loads some extra information on courses
     * @param registrationIndex
     * @param courseCode
     * @param courseSessionCode
     * @param sectionCode
     * @return {TRequest}
     */
    @needLogin
    @needRegistration
    public async getExtraCourseInfo(registrationIndex: number,
                                    courseCode: string,
                                    courseSessionCode: string,
                                    sectionCode: string): Promise<Acorn.Course> {
        const getQueryStr =
            querystring.stringify(this.cachedRegistrations[registrationIndex].registrationParams) + '&' +
            querystring.stringify({
                activityApprovedInd: "",
                activityApprovedOrg: "",
                courseCode,
                courseSessionCode,
                sectionCode
            });

        return await rp.get({
            uri: 'https://acorn.utoronto.ca/sws/rest/enrolment/course/view?' + getQueryStr,
            jar: this.state.cookieJar,
            json: true
        });
    }
}