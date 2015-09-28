
require("!style!css!less!./style.less");

var React = require("react");
var _ = require("lodash");

import { TimeBar } from '../../src/component';

/**
 * 0:00 at the start means the first minute of the day
 * 0:00 at the end means the first minute of the NEXT day
 */

var startTimeToMinutes = str => {
    var parts = str.split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
};

var endTimeToMinutes = str => {
    return startTimeToMinutes(str) || 1440;
};

/**
 * The other way around we need just one function.
 */

var minutesToTime = minutes => {
    minutes = minutes % 1440;
    var hours = Math.floor(minutes/60);
    var remainderMinutes = minutes - hours * 60;
    return hours + ":" + (remainderMinutes >= 10 ? remainderMinutes : '0' + remainderMinutes);
};

/**
 * Conversion functions from our server format to the timebar's one and back.
 */

var toTimeBarIntervals = ints => _.map(ints, interval => {
    var { from, to, ...rest } = interval;
    return {
        from: startTimeToMinutes(from),
        to: endTimeToMinutes(to),
        ...rest
    };
});

var fromTimeBarIntervals = ints => _.map(ints, interval => {
    var { from, to, ...rest } = interval;
    return {
        from: minutesToTime(from),
        to: minutesToTime(to),
        ...rest
    };
});

/**
 * USAGE
 */

var serverData = [
    { id: 0, from: "0:00", to: "3:00" },
    { id: 1, from: "10:00", to: "11:00" },
    { id: 2, from: "12:00", to: "15:00" },
    { id: 3, from: "21:00", to: "0:00" }
];

var intervals = toTimeBarIntervals(serverData);

function refresh() {

    window.document.getElementById("intervals").innerText = JSON.stringify(fromTimeBarIntervals(intervals), null, "\t");

    React.render(
        <TimeBar width={800}
                 intervals={intervals} />,
        window.document.getElementById("container")
    );
}

refresh();
