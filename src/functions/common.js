
var React = require("react");

export function defaultPreviewBoundsGenerator(startTime, max, intervals) {
    var intervalPreviewWidth = 60;

    var prevInterval, nextInterval;
    for (var i = 0, interval; interval = intervals[i]; i++) {
        if (interval.to <= startTime)
            prevInterval = interval;
        if (interval.from > startTime) {
            nextInterval = interval;
            break;
        }
    }

    var minStartTime = prevInterval ? prevInterval.to : 0;
    var maxEndTime = nextInterval ? nextInterval.from : max;

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
        return { from: start, to: end };
    }
}
