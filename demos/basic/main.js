
require("!style!css!less!./style.less");


var React = require("react");
var ReactDOM = require("react-dom");
var _ = require("lodash");

import { TimeBar } from '../../src/component';

require("./visualizer");

// CONFIG

var START_TIME = 8 * 60;
var END_TIME = 18 * 60;

// SOME FUNCTIONS TO CONVERT THE MODEL TO THE TIME-BAR FORMAT AND BACK

var timeStringToTimeBarTime = str => {
    var parts = str.split(":");
    var minutesFromMidnight = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    return minutesFromMidnight - START_TIME;
};

var timeBarTimeToString = time => {
    var minutesFromMidnight = time + START_TIME;
    var hours = Math.floor(minutesFromMidnight / 60);
    var remainderMinutes = minutesFromMidnight - hours * 60;
    return hours + ":" + (remainderMinutes > 10 ? remainderMinutes : "0" + remainderMinutes);
};

var toTimeBarIntervals = ints => _.map(ints, interval => {
    var { id, from, to, isSelected } = interval;
    return {
        id: id,
        from: timeStringToTimeBarTime(from),
        to: timeStringToTimeBarTime(to),
        className: isSelected ? "highlighted" : ""
    };
});

var intervalsToString = ints => JSON.stringify(_.map(ints, interval => {
    var { from, to, ...rest } = interval;
    return {
        from: timeBarTimeToString(from),
        to: timeBarTimeToString(to),
        ...rest
    };
}), null, "\t")

// TIME-BAR HANDLERS

function onIntervalClick(intervalId, e) {
    var interval = _.find(intervals, i => i.id === intervalId);

    interval.isSelected = !interval.isSelected;

    refresh();
}

function updateStart(intervalId, time) {
    var interval = _.find(intervals, i => i.id === intervalId);
    var intervalBefore = _.find(intervals, (__, index) => index === (intervals.length - 1) ? false : intervals[index+1].id === intervalId);
    var maxTime = interval.to - 30;
    var minTime = intervalBefore ? intervalBefore.to : 0;

    var newTime = time > maxTime ? maxTime :
                  time < minTime ? minTime :
                  time;

    interval.from = Math.round(newTime);

    refresh();
}

function updateEnd(intervalId, time) {
    var interval = _.find(intervals, i => i.id === intervalId);
    var nextInterval = _.find(intervals, (__, index) => index === 0 ? false : intervals[index-1].id === intervalId);
    var minTime = interval.from + 30;
    var maxTime = nextInterval ? nextInterval.from : (END_TIME - START_TIME);

    var newTime = time > maxTime ? maxTime :
                  time < minTime ? minTime :
                  time;

    interval.to = Math.round(newTime);

    refresh();
}

function onIntervalDrag(intervalId, newIntervalStart) {
    var interval = _.find(intervals, i => i.id === intervalId);
    var intervalBefore = _.find(intervals, (__, index) => index === (intervals.length - 1) ? false : intervals[index+1].id === intervalId);
    var nextInterval = _.find(intervals, (__, index) => index === 0 ? false : intervals[index-1].id === intervalId);

    var minTime = intervalBefore ? intervalBefore.to : 0;
    var maxEndTime = nextInterval ? nextInterval.from : (END_TIME - START_TIME);
    var intervalDuration = interval.to - interval.from;
    var maxTime = maxEndTime - intervalDuration;

    var newIntervalStartBounded = newIntervalStart > maxTime ? maxTime :
                                  newIntervalStart < minTime ? minTime :
                                  newIntervalStart;

    var newTime = Math.round(newIntervalStartBounded);
    var delta = newTime - interval.from;
    interval.from = newTime;
    interval.to = interval.to + delta;

    refresh();
}

function intervalContentGen(interval) {

    function blockEvent(e) { e.stopPropagation(); }

    function fn(e) {
        blockEvent(e);
        removeInterval(interval.id);
    }

    var removeButton = (<a className="remove-button"
                           onClick={fn}
                           onMouseDown={blockEvent}>[x]</a>);

    var from = timeBarTimeToString(interval.from),
        to = timeBarTimeToString(interval.to),
        label = from + " - " + to;

    return <span className="interval-content">{label} {removeButton}</span>;
}

function genNewInterval(bounds) {
    var intervalWithHighestId = _.max(intervals, i => i.id);
    var newId = intervalWithHighestId ? intervalWithHighestId.id + 1 : 0;
    var newInterval = { id: newId, from: bounds.from, to: bounds.to };
    var index = 0;
    for (var interval; interval = intervals[index]; index++) {
        if (interval.from > newInterval.from)
            break;
    }
    intervals.splice(index, 0, newInterval);
    refresh();
}

// ACTUAL USAGE

var serverData = [
    {
        id: 0,
        from: "10:00",
        to: "11:00",
        isSelected: true
    },
    {
        id: 1,
        from: "12:00",
        to: "15:00"
    }
];

var intervals = toTimeBarIntervals(serverData);

function refresh() {

    window.document.getElementById("intervals").innerText = intervalsToString(intervals);

    ReactDOM.render(
        <TimeBar max={(18-8)*60}
                 width={800}
                 intervals={intervals}
                 onStartChange={updateStart}
                 onEndChange={updateEnd}
                 onIntervalClick={onIntervalClick}
                 onIntervalDrag={onIntervalDrag}
                 onIntervalNew={genNewInterval}
                 intervalContentGenerator={intervalContentGen} />,
        window.document.getElementById("container")
    );
}

refresh();
