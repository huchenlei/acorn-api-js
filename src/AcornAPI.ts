/**
 * Created by Charlie on 2017-09-24.
 */

'use strict';
import request = require('request');
import {AcornError} from "./AcornError";

/**
 * Share the state information among all API components
 */

export class AcornStateManager {
    private _cookieJar: request.CookieJar;

    get cookieJar(): request.CookieJar {
        return this._cookieJar;
    }

    public isLoggedIn: boolean;

    public constructor(cookieJar: request.CookieJar) {
        this.isLoggedIn = false;
        this._cookieJar = cookieJar;
    }

    // TODO add login expire check
}

/**
 * Every API components must have field AcornStateManager
 */
export interface AcornAPI {
    state: AcornStateManager;
}

/**
 * Base class for every Acorn API class
 */
export class BaseAcornAPI implements AcornAPI {
    public state: AcornStateManager;

    constructor(state: AcornStateManager = new AcornStateManager(request.jar())) {
        this.state = state;
    }
}

/**
 * Decorator to wrap member functions of BaseAcornAPI and it's ascendants.
 * the decorated member functions would first check the login state and then
 * proceed.
 *
 * The return type of decorated function should be a Promise
 * @param target BaseAcornAPI instance
 * @param propertyKey decorated method name
 * @param descriptor method descriptor
 * @return {PropertyDescriptor}
 */
export function needLogin(target: Function, propertyKey: string, descriptor: any) {
    // save a reference to the original method this way we keep the values currently in the
    // descriptor and don't overwrite what another decorator might have done to the descriptor.
    if (descriptor === undefined) {
        descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
    }
    let originalMethod = descriptor.value;
    // editing the descriptor/value parameter
    descriptor.value = async function (...args: any[]) {
        if (!(<AcornAPI>this).state.isLoggedIn) {
            throw new AcornError('Need to first login to proceed with ' + propertyKey);
        } else {
            return originalMethod.apply(this, args);
        }
    };
    return descriptor;
}