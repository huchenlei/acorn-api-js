/**
 * Created by Charlie on 2017-09-24.
 */

'use strict';
import {AcornStateManager} from "./AcornAPI";
import request = require("request");
import {CourseAcornAPI} from "./CourseAcornAPI";
import {BasicAcornAPI} from "./BasicAcornAPI";
import {AcademicHistoryAcornAPI} from "./AcademicHistoryAcornAPI";

export class Acorn {
    private state: AcornStateManager;
    basic: BasicAcornAPI;
    course: CourseAcornAPI;
    academic: AcademicHistoryAcornAPI;
    public constructor() {
        this.state = new AcornStateManager(request.jar());
        this.basic = new BasicAcornAPI(this.state);
        this.course = new CourseAcornAPI(this.state);
        this.academic = new AcademicHistoryAcornAPI(this.state);
    }
}
