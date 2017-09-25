/**
 * Created by Charlie on 2017-09-24.
 */

'use strict';
import {AcornStateManager} from "./src/AcornAPI";
import request = require("request");
import {CourseAcornAPI} from "./src/CourseAcornAPI";
import {BasicAcornAPI} from "./src/BasicAcornAPI";

export class Acorn {
    private state: AcornStateManager;
    basic: BasicAcornAPI;
    course: CourseAcornAPI;
    public constructor() {
        this.state = new AcornStateManager(request.jar());
        this.basic = new BasicAcornAPI(state);
        this.course = new CourseAcornAPI(state);
    }
}
