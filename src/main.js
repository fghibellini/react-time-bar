
var React = require("react");
var _ = require("lodash");

import { timeStrToMinutes, minutesToStr } from './time-functions';
import { TimeBar } from './time-bar';

function roundToQuarters(timeStr) {
    var minutes = timeStrToMinutes(timeStr);
    var rounded =  minutes - (minutes % 15);
    return minutesToStr(rounded);
}

var intervals = [
    { id: 0, from: "10:00", to: "11:00" },
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

        interval.from = roundToQuarters(newTime);

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

        interval.to = roundToQuarters(newTime);

        refresh();
    }

    React.render(
        <TimeBar min={"8:00"}
                 max={"18:00"}
                 width={800}
                 intervals={intervals}
                 onStartChange={updateStart}
                 onEndChange={updateEnd} />,
        window.document.getElementById("container")
    );
}

refresh();
