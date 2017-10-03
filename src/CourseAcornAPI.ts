'use strict';
import {BaseAcornAPI, needLogin} from "./AcornAPI";
import rp = require('request-promise');

/**
 * This class handles all course related actions on acorn
 * Created by Charlie on 2017-09-23.
 */

export class CourseAcornAPI extends BaseAcornAPI {
    @needLogin
    public async getEligibleRegistrations(): Promise<object> {
        return await rp.get({
            uri: 'https://acorn.utoronto.ca/sws/rest/enrolment/eligible-registrations',
            jar: this.state.cookieJar,
            json: true
        });
    }
}