
require("!style!css!less!./style.less");

var angular = require("angular");
var _ = require("lodash");

import { timeStrToMinutes, minutesToStr } from '../../src/functions/time-functions';

require('../../src/angular-directive');

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

angular.module("angularDirectiveDemo", ["react-timebar"])

.controller("onlyController", ($scope) => {

    angular.extend($scope, {
        bunchOfIntervals: [
            { id: 0, from: "10:00", to: "11:00", className:"highlighted" },
            { id: 1, from: "12:00", to: "15:00" }
        ],
        onIntervalClick: intervalId => {
            var intervals = $scope.bunchOfIntervals;
            var interval = _.find(intervals, i => i.id === intervalId);
            if (interval.className) {
                delete interval.className;
            } else {
                interval.className = "highlighted";
            }
        },
        onIntervalDrag: (intervalId, newIntervalStart) => {
            var intervals = $scope.bunchOfIntervals;
            var interval = _.find(intervals, i => i.id === intervalId);
            var intervalBefore = _.find(intervals, (__, index) => index === (intervals.length - 1) ? false : intervals[index+1].id === intervalId);
            var nextInterval = _.find(intervals, (__, index) => index === 0 ? false : intervals[index-1].id === intervalId);
            var minTime = intervalBefore ? intervalBefore.to : "8:00";
            var maxEndTime = nextInterval ? nextInterval.from : "18:00";
            var intervalDuration = subTimes(interval.to, interval.from);
            var maxTime = addMinutes(maxEndTime, -intervalDuration);

            var rounded = roundToHalfHours(newIntervalStart);
            var timeInMinutes = timeStrToMinutes(rounded);
            var newIntervalStartBounded = timeInMinutes > timeStrToMinutes(maxTime) ? maxTime :
                                          timeInMinutes < timeStrToMinutes(minTime) ? minTime :
                                          rounded;

            var delta = subTimes(newIntervalStartBounded, interval.from);
            interval.to = addMinutes(interval.to, delta);
            interval.from = newIntervalStartBounded;
        }
    });

});
