/**
 * Created by Charlie on 2017-09-24.
 */
import {expect} from "chai";
import {BasicAcornAPI} from "../src/BasicAcornAPI";
import {config} from "./TestHelper";

require('chai').use(require('chai-as-promised')).should();


describe('BasicAcornAPI', function () {
    this.timeout(15000); // set timeout to be 15s instead of default 2
    let basicAPI: BasicAcornAPI;
    it('should be created', function () {
        basicAPI = new BasicAcornAPI();
        expect(basicAPI).to.not.be.null;
    });

    it('should throw Acorn Error when user/pass pair is incorrect', function () {
        expect(basicAPI.login('user', 'pass')).to.be.rejected;
    });

    // High Delay
    it('should login the user', async function () {
        // console.log(basicAPI);
        let result = await basicAPI.login(config.data.user, config.data.pass);
        expect(result).to.be.true;
        expect(basicAPI.state.isLoggedIn).to.be.true;
    });
});