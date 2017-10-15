/**
 * Created by Charlie on 2017-10-05.
 */
import {expect} from "chai";
import {AcademicHistoryAcornAPI} from "../src/AcademicHistoryAcornAPI";
import {BasicAcornAPI} from "../src/BasicAcornAPI";
import {AcornStateManager} from "../src/AcornAPI";
import request = require("request");
import {config, logToFileSync} from "./TestHelper";

require('chai').use(require('chai-as-promised')).should();

describe('AcademicHistoryAcornAPI', function () {
    this.timeout(15000); // set timeout to be 15s instead of default 2
    let academicAPI: AcademicHistoryAcornAPI;

    it('should be created', async function () {
        let state = new AcornStateManager(request.jar());
        let basicAPI = new BasicAcornAPI(state);
        academicAPI = new AcademicHistoryAcornAPI(state);
        expect(academicAPI).to.not.be.null;
        await basicAPI.login(config.data.user, config.data.pass);
    });

    it('should get academic history', async function () {
        logToFileSync('academic_history', await academicAPI.getAcademicHistory());
    });
});