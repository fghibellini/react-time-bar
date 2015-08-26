
require("!style!css!less!./styles.less");

var React = require("react");

import { setCursorToWholeDocument, unsetCursorToWholeDocument } from './global-cursor';
import { timeStrToMinutes, minutesToStr, timeToPercentil } from './time-functions';
import { objectAssign } from './utils';

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
        return {
            dragging: null
        };
    },
    dragStart: function(intervalId, side, initialCoords, timeBeforeDrag) {
        var onMouseMove = e => {
            this.drag({ x: e.clientX, y: e.clientY });
        };
        window.document.addEventListener("mousemove", onMouseMove);

        var onMouseUp = () => {
            this.dragEnd();
        };
        window.document.addEventListener("mouseup", onMouseUp);

        this.setState(objectAssign(this.state, {
            dragging: {
                intervalId: intervalId,
                side: side,
                timeBeforeDrag: timeBeforeDrag,
                initialCoords: initialCoords,
                movedAfterDragStart: false,
                eventHandlers: {
                    mousemove: onMouseMove,
                    mouseup: onMouseUp
                }
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
        var { eventHandlers, intervalId, movedAfterDragStart } = this.state.dragging;
        var { mousemove, mouseup } = eventHandlers;

        window.document.removeEventListener("mousemove", mousemove);
        window.document.removeEventListener("mouseup", mouseup);

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
                this.dragStart(int.id, "left", { x: e.clientX, y: e.clientY }, int.from);
                e.preventDefault();
                e.stopPropagation();
            };
            var rightHandleDragStart = e => {
                this.dragStart(int.id, "right", { x: e.clientX, y: e.clientY }, int.to);
                e.preventDefault();
                e.stopPropagation();
            };
            var intervalDragStart = e => {
                this.dragStart(int.id, "whole", { x: e.clientX, y: e.clientY }, int.from);
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
