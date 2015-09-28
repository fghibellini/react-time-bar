
var $ = require("jquery");

var lines =
`Moving the mouse over this element updates the counter.
This counter should not update when dragging an interval in the above timeline.
The mouse moved <span class="counter">0</span> times.`;

var template = `<div id="mousemove-visualizer"><h4>Mouse move area</h4><p>${lines}</p></div>`;

$(() => {
    var element = $(template);
    var counter = element.find(".counter");
    $("#container").after(element);

    var c = 0;
    element.on("mousemove", () => counter.text(++c));
});
