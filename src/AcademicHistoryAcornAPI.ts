import {BaseAcornAPI, needLogin} from "./AcornAPI";
import rp = require('request-promise');
import sanitizeHtml = require('sanitize-html');
import libxmljs = require('libxmljs');
import _ = require('lodash');
import {isUndefined} from "util";
import {AcornError} from "./AcornError";
import {isNull} from "util";
import assert = require('assert');
import SessionalAcademicHistory = Acorn.SessionalAcademicHistory;

/**
 * This class is responsible for all academic history operations
 * Created by Charlie on 2017-10-05.
 */

namespace Acorn {
    export interface Score {
        code: string;
        title: string;
        weight: string;
        other?: string;
        score?: string;
        rank?: string;
        classRank?: string;
    }

    export interface SessionalAcademicHistory {
        header: string;
        scores: Score[];
        extraInfo?: string;
    }
}

function getText(elements: Array<libxmljs.Element>): Array<string> {
    return _.map(elements, (element: libxmljs.Element) => {
        return element.text();
    });
}

export class AcademicHistoryAcornAPI extends BaseAcornAPI {
    @needLogin
    public async getAcademicHistory() : Promise<Array<Acorn.SessionalAcademicHistory>>{
        const page = await rp.get({
            uri: 'https://acorn.utoronto.ca/sws/transcript/academic/main.do?main.dispatch&mode=complete',
            jar: this.state.cookieJar
        });

        // const page = require('fs').readFileSync('./sample_original.html', 'utf-8');
        const doc = libxmljs.parseHtml(page);
        const infoNode = doc.get("//div[@class='academic-history']//div[@class='academic-history-report row']");
        if (isUndefined(infoNode)) throw new AcornError("Unable to locate academic info div!");

        // [WARNING]: here only considered the case all session proceed case
        const headers = getText(infoNode.find("./h3[@class='sessionHeader']"));
        const scores = _.map<string, Acorn.Score[]>(getText(infoNode.find("./div[@class='courses blok']")), sessionScore => {
                return _.map<string, Acorn.Score>(_.filter(sessionScore.split('\n'),
                    courseScore => { // Remove empty lines
                        return !(/^[ \t\n]*$/.test(courseScore));
                    }),
                    courseScore => {
                        const match = /(\w{3,4}\d{3,4}\w\d) (.+?) (\d\.\d\d) (.+)/
                            .exec(courseScore);
                        if (isNull(match)) {
                            throw new AcornError("Unexpected course score format: " + courseScore);
                        }
                        match.shift(); // Remove the first match which is not a capture
                        const scoreRegex = /(\d{1,3}) (\w[+\-]?) (\w[+\-]?)/;
                        const mustFields = ["code", "title", "weight"];
                        const lastField = match[match.length - 1];
                        if (scoreRegex.test(lastField)) {
                            match.pop();
                            const scoreMatch = scoreRegex.exec(lastField);
                            if (isNull(scoreMatch)) throw new AcornError("Severe. This should never happen");
                            scoreMatch.shift();
                            return _.zipObject(mustFields.concat(["score", "rank", "classRank"]), match.concat(scoreMatch));
                        } else {
                            return _.zipObject(mustFields.concat(["other"]), match);
                        }
                    }
                );
            }
        );
        const extraInfos = _.chunk(getText(infoNode.find("./div[@class='emph gpa-listing']")), 3);
        assert(headers.length === scores.length);
        let result = [];
        for (let i = 0; i < headers.length; i++) {
            const extraInfo = (extraInfos.length > i) ? extraInfos[i] : undefined;
            result.push(<Acorn.SessionalAcademicHistory>{
                header: headers[i],
                scores: scores[i],
                extraInfo
            });
        }
        return result;
    }
}