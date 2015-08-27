
require("!style!css!less!./styles.less");

var React = require("react");

import { setCursorToWholeDocument, unsetCursorToWholeDocument } from './global-cursor';
import { timeStrToMinutes, minutesToStr, timeToPercentil } from './time-functions';
import { objectAssign } from './utils';
import { setupRxLogic } from './rx-logic';

function computeDeltaInMinutes(min, max, width, deltaPx) {
    var minMinutes = timeStrToMinutes(min);
    var maxMinutes = timeStrToMinutes(max);
    var intervalDuration = maxMinutes - minMinutes;
    var pixelDuration = intervalDuration / width;
    return Math.round(deltaPx * pixelDuration);
}

function modifyTimeByPixels(min, max, width, t0, deltaPx) {
    var deltaMinutes = computeDeltaInMinutes(min, max, width, deltaPx);
    var t0InMinutes = timeStrToMinutes(t0);

    return minutesToStr(t0InMinutes + deltaMinutes);
}

var TERMINATION_MSG = {};

export var TimeBar = React.createClass({
    displayName: "TimeBar",
    propTypes: {
        min: React.PropTypes.string,
        max: React.PropTypes.string,
        width: React.PropTypes.number,
        onStartChange: React.PropTypes.func,
        onEndChange: React.PropTypes.func,
        onIntervalClick: React.PropTypes.func,
        onIntervalDrag: React.PropTypes.func,
        intervals: React.PropTypes.arrayOf(React.PropTypes.shape({
            id: React.PropTypes.oneOfType([
                React.PropTypes.number,
                React.PropTypes.string
            ]),
            from: React.PropTypes.string,
            to: React.PropTypes.string,
            className: React.PropTypes.string
        }))
    },
    getInitialState: function() {
        var { observable, mouseDownObserver, terminationObserver } = setupRxLogic(window.document);

        observable.subscribe(update => {
            if (update === TERMINATION_MSG) {
                // handle termination
            } else if (update.type === "mousedown") {
                // handle mousedown
                var { intervalId, side, initialCoords, timeBeforeDrag } = update;
                this.dragStart(intervalId, side, initialCoords, timeBeforeDrag);
            } else if (update.type === "mousemove") {
                // handle mousemove
                this.drag(update);
            } else if (update.type === "mouseup") {
                // handle mouseup
                this.dragEnd();
            } else {
                // handle other
                console.error("unexpected branch reach");
            }
        }, error => {
            console.log(error);
        }, () => {
            // noop
        });

        return {
            terminationObserver: terminationObserver,
            mouseDownObserver: mouseDownObserver,
            dragging: null
        };
    },
    componentWillUnmount: function() {
        this.state.terminationObserver.onNext(TERMINATION_MSG);
    },
    dragStart: function(intervalId, side, initialCoords, timeBeforeDrag) {
        this.setState(objectAssign(this.state, {
            dragging: {
                intervalId: intervalId,
                side: side,
                initialCoords: initialCoords,
                timeBeforeDrag: timeBeforeDrag,
                movedAfterDragStart: false
            }
        }));
    },
    drag: function(newCoords) {
        var { intervalId, side, timeBeforeDrag, initialCoords, movedAfterDragStart } = this.state.dragging;
        var { min, max, width, onStartChange, onEndChange, onIntervalDrag } = this.props;
        var newTime = modifyTimeByPixels(min, max, width, timeBeforeDrag, newCoords.x - initialCoords.x);

        if (!this.state.dragging.movedAfterDragStart) {
            var cursorName = {
                left: "w-resize",
                right: "e-resize",
                whole: "move"
            }[side];
            setCursorToWholeDocument(window.document, cursorName);

            this.state.dragging.movedAfterDragStart = true;
            this.setState(this.state);
        }

        if (side === "left") {
            onStartChange(intervalId, newTime);
        } else if (side === "right") {
            onEndChange(intervalId, newTime);
        } else if (side === "whole") {
            onIntervalDrag(intervalId, newTime);
        }
    },
    dragEnd: function() {
        var { onIntervalClick } = this.props;
        var { intervalId, movedAfterDragStart } = this.state.dragging;

        if (movedAfterDragStart) {
            unsetCursorToWholeDocument(window.document);
        } else {
            onIntervalClick(intervalId, null);
        }

        this.setState(objectAssign(this.state, {
            dragging: null
        }));
    },
    render: function() {
        var { min, max, width, intervals } = this.props;

        var mappedIntervals = intervals.map((int, intIndex) => {
            var start = width * timeToPercentil(min, max, int.from);
            var end = width * timeToPercentil(min, max, int.to);

            var leftHandleDragStart = e => {
                this.state.mouseDownObserver.onNext({
                    type: "mousedown",
                    intervalId: int.id,
                    side: "left",
                    initialCoords: { x: e.clientX, y: e.clientY },
                    timeBeforeDrag: int.from
                });
                e.preventDefault();
                e.stopPropagation();
            };
            var rightHandleDragStart = e => {
                this.state.mouseDownObserver.onNext({
                    type: "mousedown",
                    intervalId: int.id,
                    side: "right",
                    initialCoords: { x: e.clientX, y: e.clientY },
                    timeBeforeDrag: int.to
                });
                e.preventDefault();
                e.stopPropagation();
            };
            var intervalDragStart = e => {
                this.state.mouseDownObserver.onNext({
                    type: "mousedown",
                    intervalId: int.id,
                    side: "whole",
                    initialCoords: { x: e.clientX, y: e.clientY },
                    timeBeforeDrag: int.from
                });
                e.preventDefault();
                e.stopPropagation();
            };

            return (<div className={["interval", int.className].join(" ")}
                         key={int.id}
                         onMouseDown={intervalDragStart}
                         style={{ left: start, width: end - start }}>
                <div className="interval-handle interval-handle-left"
                     onMouseDown={leftHandleDragStart} />
                <div className="interval-handle interval-handle-right"
                     onMouseDown={rightHandleDragStart} />
            </div>);
        });

        return (<div className="time-bar"
                    style={{ width: width }}>
            {mappedIntervals}
        </div>);
    }
});
