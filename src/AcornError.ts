/**
 * Created by Charlie on 2017-09-22.
 */

export class AcornError implements Error {
    name: string = 'AcornError';
    message: string;
    public constructor(message: string) {
        this.message = message;
    }
}