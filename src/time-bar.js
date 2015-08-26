
require("!style!css!less!./styles.less");

var React = require("react");
var _ = require("lodash");

import { setCursorToWholeDocument, unsetCursorToWholeDocument } from './global-cursor';
import { timeStrToMinutes, minutesToStr, timeToPercentil } from './time-functions';

function modifyTimeByPixels(min, max, width, t0, deltaPx) {
    var _min = timeStrToMinutes(min);
    var _max = timeStrToMinutes(max);
    var l = _max - _min;
    var pixelDuration = l / width;
    var deltaMinutes = deltaPx * pixelDuration;

    var _t0 = timeStrToMinutes(t0);
    return minutesToStr(_t0 + deltaMinutes);
}

export var TimeBar = React.createClass({
    displayName: "TimeBar",
    propTypes: {
        min: React.PropTypes.string,
        max: React.PropTypes.string,
        width: React.PropTypes.number,
        onStartChange: React.PropTypes.func,
        onEndChange: React.PropTypes.func,
        intervals: React.PropTypes.arrayOf(React.PropTypes.shape({
            id: React.PropTypes.oneOfType([
                React.PropTypes.number,
                React.PropTypes.string
            ]),
            from: React.PropTypes.string,
            to: React.PropTypes.string
        }))
    },
    getInitialState: function() {
        return {
            dragging: null
        };
    },
    componentDidMount: function() {
    },
    dragStart: function(intervalId, side, initialXCoord, timeBeforeDrag) {
        setCursorToWholeDocument(window.document, side === "left" ? "w-resize" : "e-resize");

        var onMouseMove = e => {
            if (this.state.dragging) {
                this.drag(e.clientX);
            }
        };
        window.document.addEventListener("mousemove", onMouseMove);

        var onMouseUp = () => {
            if (this.state.dragging) {
                this.dragEnd();
            }
        };
        window.document.addEventListener("mouseup", onMouseUp);

        this.setState({
            dragging: {
                intervalId: intervalId,
                side: side,
                timeBeforeDrag: timeBeforeDrag,
                initialXCoord: initialXCoord,
                eventHandlers: {
                    mousemove: onMouseMove,
                    mouseup: onMouseUp
                }
            }
        });
    },
    dragEnd: function() {
        var { mousemove, mouseup } = this.state.dragging.eventHandlers;
        window.document.removeEventListener("mousemove", mousemove);
        window.document.removeEventListener("mouseup", mouseup);
        unsetCursorToWholeDocument(window.document);
        this.setState({
            dragging: null
        });
    },
    drag: function(clientX) {
        var { intervalId, side, timeBeforeDrag, initialXCoord } = this.state.dragging;
        var { min, max, width, onStartChange, onEndChange } = this.props;
        var newTime = modifyTimeByPixels(min, max, width, timeBeforeDrag, clientX - initialXCoord);

        if (side === "left") {
            onStartChange(intervalId, newTime);
        } else {
            onEndChange(intervalId, newTime);
        }
    },
    render: function() {
        var { min, max, width, intervals } = this.props;

        var mappedIntervals = intervals.map((int, intIndex) => {
            var start = width * timeToPercentil(min, max, int.from);
            var end = width * timeToPercentil(min, max, int.to);

            var leftHandleDragStart = e => this.dragStart(int.id, "left", e.clientX, int.from);
            var rightHandleDragStart = e => this.dragStart(int.id, "right", e.clientX, int.to);

            return (<div className="interval"
                         key={intIndex}
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
