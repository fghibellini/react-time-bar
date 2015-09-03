
var _ = require("lodash");
var React = require("react");
var ReactTimeBar = require("../../dist/component.commonjs");

var TimeBar = ReactTimeBar.TimeBar;

var intervals = [
    { id: 0, from: "10:00", to: "11:00", className:"highlighted" },
    { id: 1, from: "12:00", to: "15:00" }
];

function onIntervalClick(intervalId, e) {
    var interval = _.find(intervals, i => i.id === intervalId);
    if (interval.className) {
        delete interval.className;
    } else {
        interval.className = "highlighted";
    }
    refresh();
}

var refresh = () => React.render(
    <TimeBar min={"8:00"}
             max={"18:00"}
             width={800}
             intervals={intervals}
             onIntervalClick={onIntervalClick} />,
    window.document.getElementById("container")
);

refresh();
