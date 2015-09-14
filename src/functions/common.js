
var React = require("react");

import { timeStrToMinutes, minutesToStr } from './time-functions';

var intervalPreviewWidth = 30;
export function defaultPreviewBoundsGenerator(startTime, min, max, intervals) {
    startTime = timeStrToMinutes(startTime);

    var prevInterval, nextInterval;
    for (var i = 0, interval; interval = intervals[i]; i++) {
        var iFrom = timeStrToMinutes(interval.from);
        var iTo = timeStrToMinutes(interval.to);
        if (iTo <= startTime)
            prevInterval = interval;
        if (iFrom > startTime) {
            nextInterval = interval;
            break;
        }
    }

    var minStartTime = prevInterval ? timeStrToMinutes(prevInterval.to) : timeStrToMinutes(min);
    var maxEndTime = nextInterval ? timeStrToMinutes(nextInterval.from) : timeStrToMinutes(max);

    if (intervalPreviewWidth > (maxEndTime - minStartTime)) {
        return null;
    } else {
        var startTimeUnbounded = startTime - intervalPreviewWidth / 2;
        var start, end;
        if (startTimeUnbounded < minStartTime) {
            start = minStartTime;
            end = start + intervalPreviewWidth;
        } else {
            var endTimeUnbounded = startTime + intervalPreviewWidth / 2;
            end = endTimeUnbounded > maxEndTime ? maxEndTime : endTimeUnbounded;
            start = end - intervalPreviewWidth;
        }
        return { from: minutesToStr(start), to: minutesToStr(end) };
    }
}

export function defaultIntervalContentGenerator(interval) {
    return <span className="interval-content">{interval.from + " - " + interval.to}</span>;
}
