
require("!style!css!less!./demo.less");

var React = require("react");
var _ = require("lodash");

import { timeStrToMinutes, minutesToStr } from './time-functions';
import { TimeBar } from './time-bar';

function roundToHalfHours(timeStr) {
    var minutes = timeStrToMinutes(timeStr);
    var rounded =  30 * Math.round(minutes / 30);
    return minutesToStr(rounded);
}

function subTimes(time1, time0) {
    var minutes0 = timeStrToMinutes(time0);
    var minutes1 = timeStrToMinutes(time1);
    return minutes1 - minutes0;
}

function addMinutes(timeStr, deltaMinutes) {
    var minutes = timeStrToMinutes(timeStr);
    return minutesToStr(minutes + deltaMinutes);
}

var intervals = [
    { id: 0, from: "10:00", to: "11:00", className:"highlighted" },
    { id: 1, from: "12:00", to: "15:00" }
];

function refresh() {

    function updateStart(intervalId, time) {
        var interval = _.find(intervals, i => i.id === intervalId);
        var intervalBefore = _.find(intervals, (__, index) => index === (intervals.length - 1) ? false : intervals[index+1].id === intervalId);
        var maxTime = interval.to;
        var minTime = intervalBefore ? intervalBefore.to : "8:00";

        var timeInMinutes = timeStrToMinutes(time);
        var newTime = timeInMinutes > timeStrToMinutes(maxTime) ? maxTime :
                      timeInMinutes < timeStrToMinutes(minTime) ? minTime :
                      time;

        interval.from = roundToHalfHours(newTime);

        refresh();
    }

    function updateEnd(intervalId, time) {
        var interval = _.find(intervals, i => i.id === intervalId);
        var nextInterval = _.find(intervals, (__, index) => index === 0 ? false : intervals[index-1].id === intervalId);
        var minTime = interval.from;
        var maxTime = nextInterval ? nextInterval.from : "18:00";

        var timeInMinutes = timeStrToMinutes(time);
        var newTime = timeInMinutes > timeStrToMinutes(maxTime) ? maxTime :
                      timeInMinutes < timeStrToMinutes(minTime) ? minTime :
                      time;

        interval.to = roundToHalfHours(newTime);

        refresh();
    }

    function onIntervalClick(intervalId, e) {
        var interval = _.find(intervals, i => i.id === intervalId);
        if (interval.className) {
            delete interval.className;
        } else {
            interval.className = "highlighted";
        }
        refresh();
    }

    function onIntervalDrag(intervalId, newIntervalStart) {
        var interval = _.find(intervals, i => i.id === intervalId);
        var intervalBefore = _.find(intervals, (__, index) => index === (intervals.length - 1) ? false : intervals[index+1].id === intervalId);
        var nextInterval = _.find(intervals, (__, index) => index === 0 ? false : intervals[index-1].id === intervalId);
        var minTime = intervalBefore ? intervalBefore.to : "8:00";
        var maxEndTime = nextInterval ? nextInterval.from : "18:00";
        var intervalDuration = subTimes(interval.to, interval.from);
        var maxTime = addMinutes(maxEndTime, -intervalDuration);

        var timeInMinutes = timeStrToMinutes(newIntervalStart);
        var newIntervalStartBounded = timeInMinutes > timeStrToMinutes(maxTime) ? maxTime :
                                      timeInMinutes < timeStrToMinutes(minTime) ? minTime :
                                      newIntervalStart;

        var newIntervalStartRounded = roundToHalfHours(newIntervalStartBounded);

        var delta = subTimes(newIntervalStartRounded, interval.from);
        interval.to = addMinutes(interval.to, delta);
        interval.from = newIntervalStartRounded;
        refresh();
    }

    React.render(
        <TimeBar min={"8:00"}
                 max={"18:00"}
                 width={800}
                 intervals={intervals}
                 onStartChange={updateStart}
                 onEndChange={updateEnd}
                 onIntervalClick={onIntervalClick}
                 onIntervalDrag={onIntervalDrag} />,
        window.document.getElementById("container")
    );
}

refresh();
