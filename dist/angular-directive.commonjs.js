(function(e, a) { for(var i in a) e[i] = a[i]; }(exports, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _component = __webpack_require__(1);

	var React = __webpack_require__(13);
	var angular = __webpack_require__(18);

	function bindToScope(scope, fn) {
	    return function () {
	        var args = arguments;
	        scope.$apply(function () {
	            fn.apply(null, args);
	        });
	    };
	}

	function getOptionalDependency($injector, dependencyDescriptor) {
	    try {
	        return $injector.get(dependencyDescriptor);
	    } catch (e) {
	        return null;
	    }
	}

	function isPure(fnName) {
	    return !! ~['previewBoundsGenerator', 'intervalContentGenerator'].indexOf(fnName);
	}

	angular.module("react-timebar", []).directive("reactTimeBar", function ($injector) {
	    var inputStreams = getOptionalDependency($injector, 'reactTimeBar.Inputs');
	    var TimeBarComponent = inputStreams ? (0, _component.getTimeBarComponent)({ capturedMouseEvents: inputStreams }) : _component.TimeBar;
	    return {
	        link: function link(scope, element, attributes) {
	            var propNames = Object.keys(_component.TimeBar.propTypes);

	            scope.$watch(function () {
	                var values = {};
	                var _iteratorNormalCompletion = true;
	                var _didIteratorError = false;
	                var _iteratorError = undefined;

	                try {
	                    for (var _iterator = propNames[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	                        var propName = _step.value;

	                        var binding = attributes[propName];
	                        if (binding) {
	                            values[propName] = scope.$eval(binding);
	                        }
	                    }
	                } catch (err) {
	                    _didIteratorError = true;
	                    _iteratorError = err;
	                } finally {
	                    try {
	                        if (!_iteratorNormalCompletion && _iterator["return"]) {
	                            _iterator["return"]();
	                        }
	                    } finally {
	                        if (_didIteratorError) {
	                            throw _iteratorError;
	                        }
	                    }
	                }

	                return values;
	            }, function (newValues) {
	                var withWrappedFunctions = {};
	                for (var i in newValues) {
	                    withWrappedFunctions[i] = typeof newValues[i] === 'function' && !isPure(i) ? bindToScope(scope, newValues[i]) : newValues[i];
	                }

	                React.render(React.createElement(TimeBarComponent, withWrappedFunctions), element[0]);
	            }, true);

	            element.on('$destroy', function () {
	                React.unmountComponentAtNode(element[0]);
	            });
	        }
	    };
	});

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	exports.getTimeBarComponent = getTimeBarComponent;

	var _functionsUtils = __webpack_require__(2);

	var _state2 = __webpack_require__(4);

	var _deltaFunction = __webpack_require__(6);

	var _mouseEventCapturing = __webpack_require__(10);

	var _functionsCommon = __webpack_require__(12);

	var _events = __webpack_require__(9);

	__webpack_require__(14);

	var rx = __webpack_require__(3);
	var React = __webpack_require__(13);

	var NESTED_DELTAS_ERROR = "The delta function is not allowed to synchrously trigger another state transition! This is a bug in the time-bar component.";
	var NO_CAPTURED_EVENTS_STREAM_ERROR = "The TimeBar component requires a pausable stream of mouse events!";
	var NO_ENVIRONMENT_ERROR = "The TimeBar component requires and environment object!";

	var CREATE_INTERVAL = function CREATE_INTERVAL() {/* token function */};

	exports.CREATE_INTERVAL = CREATE_INTERVAL;

	function getTimeBarComponent(environmentArgs) {

	    if (!environmentArgs) {
	        throw Error(NO_ENVIRONMENT_ERROR);
	    }
	    if (!environmentArgs.capturedMouseEvents) {
	        throw Error(NO_CAPTURED_EVENTS_STREAM_ERROR);
	    }

	    var capturedMouseEvents = environmentArgs.capturedMouseEvents.pausable();
	    capturedMouseEvents.pause();

	    var environment = {
	        capturedMouseEvents: capturedMouseEvents
	    };

	    return React.createClass({
	        displayName: "TimeBar",
	        statics: {
	            CREATE_INTERVAL: CREATE_INTERVAL
	        },
	        propTypes: {
	            max: React.PropTypes.number,
	            width: React.PropTypes.number,
	            onStartChange: React.PropTypes.func,
	            onEndChange: React.PropTypes.func,
	            onIntervalClick: React.PropTypes.func,
	            onIntervalTap: React.PropTypes.func,
	            onIntervalLongPress: React.PropTypes.func,
	            onIntervalDrag: React.PropTypes.func,
	            onDragEnd: React.PropTypes.func,
	            onLongPress: React.PropTypes.func,
	            onDoubleLongPress: React.PropTypes.func,
	            onTap: React.PropTypes.func,
	            longPressInterval: React.PropTypes.number,
	            mouseMoveRadius: React.PropTypes.number,
	            touchMoveRadius: React.PropTypes.number,
	            intervals: React.PropTypes.arrayOf(React.PropTypes.shape({
	                id: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
	                from: React.PropTypes.number,
	                to: React.PropTypes.number,
	                className: React.PropTypes.string
	            })),
	            intervalContentGenerator: React.PropTypes.func,
	            previewBoundsGenerator: React.PropTypes.func,
	            onDoubleTap: React.PropTypes.func,
	            onIntervalNew: React.PropTypes.func,
	            direction: React.PropTypes.string
	        },
	        getDefaultProps: function getDefaultProps() {
	            return {
	                max: 1440,
	                width: 800,
	                onStartChange: _functionsUtils.noop,
	                onEndChange: _functionsUtils.noop,
	                onIntervalClick: _functionsUtils.noop,
	                onIntervalTap: _functionsUtils.noop,
	                onIntervalLongPress: _functionsUtils.noop,
	                onIntervalDrag: _functionsUtils.noop,
	                onDragEnd: _functionsUtils.noop,
	                onLongPress: _functionsUtils.noop,
	                onDoubleLongPress: _functionsUtils.noop,
	                onTap: _functionsUtils.noop,
	                longPressInterval: 800,
	                mouseMoveRadius: 10,
	                touchMoveRadius: 10,
	                intervals: [],
	                intervalContentGenerator: function intervalContentGenerator() {
	                    return null;
	                },
	                previewBoundsGenerator: _functionsCommon.defaultPreviewBoundsGenerator,
	                onDoubleTap: _functionsUtils.noop,
	                onIntervalNew: _functionsUtils.noop,
	                direction: "horizontal"
	            };
	        },
	        getAllInputs: function getAllInputs() {
	            var inputSubject = new rx.Subject();
	            this.inputObserver = inputSubject;
	            return (0, _functionsUtils.mergeInputs)([inputSubject, capturedMouseEvents]).observeOn(rx.Scheduler.currentThread);
	        },
	        setupStateMachine: function setupStateMachine(allInputs, deltaFunction) {
	            var _this = this;

	            function formatState(s) {
	                //return JSON.stringify(s.action);
	            }
	            var SM_Subscription = allInputs.subscribe(function (update) {
	                try {
	                    /* ONLY THIS FUNCTION IS ALLOWED TO CHANGE THE STATE DIRECTLY */
	                    var state = _this.my_state;
	                    var inputObserver = _this.inputObserver;

	                    if (_this.__deltaRunnging) {
	                        console.error(Error(NESTED_DELTAS_ERROR));
	                    }
	                    _this.__deltaRunnging = true;
	                    var newState = deltaFunction(state, update, inputObserver, environment, SM_Subscription.dispose.bind(SM_Subscription));
	                    _this.__deltaRunnging = false;

	                    if (newState !== state) {
	                        if (state.action && (!newState.action || newState.action.constructor !== state.action.constructor)) {
	                            var exitHook = state.action && state.action.constructor && _deltaFunction.stateExitClearTimeoutHooks.get(state.action.constructor);
	                            if (exitHook) {
	                                exitHook(state, update, newState);
	                            }
	                        }
	                        _this.my_state = newState;
	                        _this.replaceState(newState);
	                    }
	                } catch (e) {
	                    // Prevent unexpected errors to freeze the time bar.
	                    console.error(e);
	                }
	            }, function (error) {
	                // One of the input streams failed.
	                console.error(error);
	            });
	        },
	        getInitialState: function getInitialState() {
	            var initialProps = (0, _state2.propsToImmutable)(this.props);

	            var allInputs = this.getAllInputs();
	            this.setupStateMachine(allInputs, _deltaFunction.deltaFunction);

	            return this.my_state = new _state2.TimeBarState(_extends({
	                action: null
	            }, initialProps.toObject()));
	        },
	        componentWillReceiveProps: function componentWillReceiveProps(newProps) {
	            var inputObserver = this.inputObserver;

	            inputObserver.onNext({
	                type: _events.PROPERTY_CHANGE,
	                newProps: (0, _state2.propsToImmutable)(newProps)
	            });
	        },
	        componentWillUnmount: function componentWillUnmount() {
	            var inputObserver = this.inputObserver;

	            inputObserver.onNext({ type: _events.TERMINATE });
	        },
	        render: function render() {
	            var _this2 = this;

	            var _state = this.state;
	            var action = _state.action;
	            var max = _state.max;
	            var width = _state.width;
	            var intervals = _state.intervals;
	            var direction = _state.direction;
	            var intervalContentGenerator = _state.intervalContentGenerator;
	            var previewBoundsGenerator = _state.previewBoundsGenerator;
	            var onIntervalNew = _state.onIntervalNew;
	            var inputObserver = this.inputObserver;

	            // THE DISPLAYED INTERVALS

	            var mappedIntervals = intervals.map(function (interval, intIndex) {
	                var start = width * interval.from / max;
	                var end = width * interval.to / max;

	                var mouseDownHandlerGen = function mouseDownHandlerGen(side, timeBeforeDrag) {
	                    return function (e) {
	                        inputObserver.onNext({
	                            type: _events.INTERVAL_MOUSE_DOWN,
	                            intervalId: interval.id,
	                            side: side,
	                            initialCoords: { x: e.clientX, y: e.clientY },
	                            timeBeforeDrag: timeBeforeDrag
	                        });
	                        e.preventDefault();
	                        e.stopPropagation();
	                    };
	                };

	                var touchStartHandlerGen = function touchStartHandlerGen(side, timeBeforeDrag) {
	                    return function (e) {
	                        e.preventDefault();
	                        e.stopPropagation();
	                        var touch = e.changedTouches[0];
	                        inputObserver.onNext({
	                            type: _events.INTERVAL_TOUCH_START,
	                            intervalId: interval.id,
	                            side: side,
	                            touchId: touch.identifier,
	                            initialCoords: { x: touch.clientX, y: touch.clientY },
	                            timeBeforeDrag: timeBeforeDrag
	                        });
	                    };
	                };

	                var touchMove = function touchMove(e) {
	                    e.preventDefault();
	                    e.stopPropagation();
	                    var touch = e.changedTouches[0];
	                    inputObserver.onNext({
	                        type: _events.INTERVAL_TOUCH_MOVE,
	                        touchId: touch.identifier,
	                        clientX: touch.clientX,
	                        clientY: touch.clientY
	                    });
	                };

	                var touchEnd = function touchEnd(e) {
	                    var touch = e.changedTouches[0];
	                    inputObserver.onNext({
	                        type: _events.INTERVAL_TOUCH_END,
	                        touchId: touch.identifier,
	                        clientX: touch.clientX,
	                        clientY: touch.clientY
	                    });
	                    e.preventDefault();
	                    e.stopPropagation();
	                };

	                var leftHandleDragStart = mouseDownHandlerGen("left", interval.from);
	                var rightHandleDragStart = mouseDownHandlerGen("right", interval.to);
	                var intervalDragStart = mouseDownHandlerGen("whole", interval.from);

	                var leftHandleTouchDragStart = touchStartHandlerGen("left", interval.from);
	                var rightHandleTouchDragStart = touchStartHandlerGen("right", interval.to);
	                var intervalTouchDragStart = touchStartHandlerGen("whole", interval.from);

	                var style = direction === "horizontal" ? { left: start, width: end - start } : { top: start, height: end - start };

	                return React.createElement(
	                    "div",
	                    { className: ["interval", interval.className].join(" "),
	                        key: interval.id,
	                        onMouseDown: intervalDragStart,
	                        onTouchStart: intervalTouchDragStart,
	                        onTouchEnd: touchEnd,
	                        onTouchMove: touchMove,
	                        style: style },
	                    React.createElement("div", { className: "interval-handle interval-handle-left",
	                        onMouseDown: leftHandleDragStart,
	                        onTouchStart: leftHandleTouchDragStart }),
	                    React.createElement("div", { className: "interval-handle interval-handle-right",
	                        onMouseDown: rightHandleDragStart,
	                        onTouchStart: rightHandleTouchDragStart }),
	                    intervalContentGenerator(interval)
	                );
	            });

	            // THE PREVIEW OF A NEW INERVAL

	            var intervalPreview = !(action instanceof _state2.PreviewAction) ? null : (function () {
	                var offset = action.offset;
	                var startTime = max * offset / width;
	                var bounds = previewBoundsGenerator(startTime, max, intervals.toJS());

	                var previewClick = function previewClick(e) {
	                    e.stopPropagation();
	                    onIntervalNew(bounds);
	                };

	                if (bounds === null) {
	                    return null;
	                } else {
	                    var start = width * bounds.from / max;
	                    var end = width * bounds.to / max;
	                    var style = direction === "horizontal" ? { left: start, width: end - start } : { top: start, height: end - start };
	                    return React.createElement(
	                        "div",
	                        { className: "new-interval",
	                            style: style,
	                            onClick: previewClick },
	                        "+"
	                    );
	                }
	            })();

	            // THE TIME BAR ITSELF

	            var barMouseMove = function barMouseMove(e) {
	                var barElement = React.findDOMNode(_this2);
	                if (e.target === barElement || e.target.className === "new-interval") {
	                    var boundingRect = barElement.getBoundingClientRect();

	                    var _ref = direction === 'horizontal' ? [e.pageX, boundingRect.left + window.scrollX] : [e.pageY, boundingRect.top + window.scrollY];

	                    var _ref2 = _slicedToArray(_ref, 2);

	                    var page = _ref2[0];
	                    var bounding = _ref2[1];

	                    var offset = page - bounding;

	                    inputObserver.onNext({
	                        type: _events.BAR_MOUSE_MOVE,
	                        offset: offset
	                    });
	                } else {
	                    inputObserver.onNext({
	                        type: _events.BAR_MOUSE_LEAVE
	                    });
	                }
	            };

	            var barMouseLeave = function barMouseLeave(e) {
	                inputObserver.onNext({
	                    type: _events.BAR_MOUSE_LEAVE
	                });
	            };

	            var touchHandler = function touchHandler(e) {
	                e.preventDefault();
	                e.stopPropagation();

	                var touch = e.changedTouches[0];

	                var type;
	                switch (e.type) {
	                    case "touchstart":
	                        type = _events.BAR_TOUCH_START;break;
	                    case "touchend":
	                        type = _events.BAR_TOUCH_END;break;
	                }

	                var barElement = React.findDOMNode(_this2);
	                var boundingRect = barElement.getBoundingClientRect();

	                var _ref3 = direction === 'horizontal' ? [touch.pageX, boundingRect.left + window.scrollX] : [touch.pageY, boundingRect.top + window.scrollY];

	                var _ref32 = _slicedToArray(_ref3, 2);

	                var page = _ref32[0];
	                var bounding = _ref32[1];

	                var offset = page - bounding;

	                inputObserver.onNext({
	                    type: type,
	                    touchId: touch.identifier,
	                    coords: { x: touch.clientX, y: touch.clientY },
	                    offset: offset
	                });
	            };

	            return React.createElement(
	                "div",
	                { className: ["time-bar", direction].join(" "),
	                    style: direction === "horizontal" ? { width: width } : { height: width },
	                    onMouseMove: barMouseMove,
	                    onMouseLeave: barMouseLeave,
	                    onTouchStart: touchHandler,
	                    onTouchEnd: touchHandler },
	                intervalPreview,
	                mappedIntervals
	            );
	        }
	    });
	}

	;

	var TimeBar = window && window.document ? getTimeBarComponent({ capturedMouseEvents: (0, _mouseEventCapturing.captureMouseEventsOnDomNode)(window.document) }) : null;
	exports.TimeBar = TimeBar;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.mergeInputs = mergeInputs;
	exports.getRemovedIds = getRemovedIds;

	var rx = __webpack_require__(3),
	    mergeObservables = rx.Observable.merge;

	var noop = rx.helpers.noop;

	exports.noop = noop;

	function mergeInputs(inputObservables) {
	    return mergeObservables.apply(null, inputObservables);
	}

	function getRemovedIds(oldIntervals, newIntervals) {
	    var removed = [];
	    outer: for (var i = 0, ii = oldIntervals.size; i < ii; i++) {
	        var oldId = oldIntervals.get(i).id;
	        for (var j = 0, jj = newIntervals.size; j < jj; j++) {
	            if (oldId == newIntervals.get(j).id) {
	                continue outer;
	            }
	        }
	        removed.push(oldId);
	    }
	    return removed;
	}

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = require("rx");

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	exports.intervalsToImmutable = intervalsToImmutable;
	exports.propsToImmutable = propsToImmutable;
	exports.isDraggingAction = isDraggingAction;

	function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

	var _functionsUtils = __webpack_require__(2);

	var Immutable = __webpack_require__(5);

	var Interval = new Immutable.Record({
	    id: null,
	    from: null,
	    to: null,
	    className: ""
	});

	exports.Interval = Interval;
	var Coordinates = new Immutable.Record({
	    x: 0,
	    y: 0
	});

	exports.Coordinates = Coordinates;

	function intervalsToImmutable(intervalsArray) {
	    return Immutable.fromJS(intervalsArray, function (key, value) {
	        if (key === "") {
	            return new Immutable.List(value);
	        } else {
	            return new Interval(value);
	        }
	    });
	}

	var Props = new Immutable.Record({
	    max: null,
	    width: null,
	    onStartChange: null,
	    onEndChange: null,
	    onIntervalClick: null,
	    onIntervalTap: null,
	    onIntervalLongPress: null,
	    onIntervalDrag: null,
	    onDragEnd: null,
	    onLongPress: null,
	    onDoubleLongPress: null,
	    onTap: null,
	    longPressInterval: 300,
	    mouseMoveRadius: 10,
	    touchMoveRadius: 10,
	    intervals: new Immutable.List([]),
	    intervalContentGenerator: null,
	    previewBoundsGenerator: null,
	    onDoubleTap: null,
	    onIntervalNew: null,
	    direction: 'horizontal'
	});

	exports.Props = Props;

	function propsToImmutable(propsObject) {
	    var intervals = propsObject.intervals;

	    var otherProps = _objectWithoutProperties(propsObject, ["intervals"]);

	    return new Props(_extends({
	        intervals: intervalsToImmutable(intervals)
	    }, otherProps));
	}

	var TimeBarState = new Immutable.Record({
	    action: null,
	    // the following are digested props
	    max: 1440,
	    width: 400,
	    direction: 'horizontal',
	    onStartChange: _functionsUtils.noop,
	    onEndChange: _functionsUtils.noop,
	    onIntervalClick: _functionsUtils.noop,
	    onIntervalTap: _functionsUtils.noop,
	    onIntervalLongPress: _functionsUtils.noop,
	    onIntervalDrag: _functionsUtils.noop,
	    onDragEnd: _functionsUtils.noop,
	    onLongPress: _functionsUtils.noop,
	    onDoubleLongPress: _functionsUtils.noop,
	    onTap: _functionsUtils.noop,
	    longPressInterval: 300,
	    mouseMoveRadius: 2,
	    touchMoveRadius: 2,
	    intervals: null,
	    intervalContentGenerator: _functionsUtils.noop,
	    previewBoundsGenerator: _functionsUtils.noop,
	    onDoubleTap: _functionsUtils.noop,
	    onIntervalNew: _functionsUtils.noop
	});

	exports.TimeBarState = TimeBarState;
	var PreviewAction = new Immutable.Record({
	    offset: null
	});

	exports.PreviewAction = PreviewAction;
	var MouseDraggingAction = new Immutable.Record({
	    intervalId: null, // the id of the dragged interval
	    side: "both", // one of: "left", "right", "both"
	    initialCoords: new Coordinates(), // the coordinates of the mousedown that initiated the drag
	    timeBeforeDrag: null, // the value of the property modified by the drag before the drag started
	    movedSinceMouseDown: false, // a drag starts when the use moves the mouse after a mousedown otherwise it's a click
	    capturedMouseEvents: null
	});

	exports.MouseDraggingAction = MouseDraggingAction;
	var TouchDraggingAction = new Immutable.Record({
	    intervalId: null, // the id of the dragged interval
	    side: "both", // one of: "left", "right", "both"
	    touchId: null,
	    longPressTimeoutId: null, // return value of setTimeout
	    t0: null, // date object with time of touchstart
	    initialCoords: new Coordinates(), // the coordinates of the mousedown that initiated the drag
	    timeBeforeDrag: null, // the value of the property modified by the drag before the drag started
	    movedSinceTouchStart: false // a drag starts when the use moves the mouse after a mousedown otherwise it's a click
	});

	exports.TouchDraggingAction = TouchDraggingAction;

	function isDraggingAction(action) {
	    return action instanceof MouseDraggingAction || action instanceof TouchDraggingAction;
	}

	// BAR TOUCH EVENT HANDLING

	var FirstPressed = new Immutable.Record({
	    longPressTimeoutId: null,
	    offset: null
	});

	exports.FirstPressed = FirstPressed;
	var FirstReleased = new Immutable.Record({
	    singleTapTimeoutId: null
	});

	exports.FirstReleased = FirstReleased;
	var SecondPressed = new Immutable.Record({
	    longPressTimeoutId: null
	});
	exports.SecondPressed = SecondPressed;

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = require("immutable");

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	    value: true
	});

	var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

	exports.processTimeBarTouchEvent = processTimeBarTouchEvent;
	exports.deltaFunction = deltaFunction;

	var _state = __webpack_require__(4);

	var _functionsGlobalCursor = __webpack_require__(7);

	var _functionsUtils = __webpack_require__(2);

	var _o1map = __webpack_require__(8);

	var _events = __webpack_require__(9);

	var _component = __webpack_require__(1);

	var stateExitClearTimeoutHooks = new _o1map.O1Map().set(_state.FirstPressed, function (state, input, nextState) {
	    if (input.type !== _events.BAR_LONG_PRESS) clearTimeout(state.action.longPressTimeoutId);
	}).set(_state.FirstReleased, function (state, input, nextState) {
	    if (input.type !== _events.BAR_SINGLE_TAP) clearTimeout(state.action.singleTapTimeoutId);
	}).set(_state.SecondPressed, function (state, input, nextState) {
	    if (input.type !== _events.BAR_LONG_PRESS) clearTimeout(state.action.longPressTimeoutId);
	}).set(_state.MouseDraggingAction, function (state, input, nextState) {
	    var _state$action = state.action;
	    var movedSinceMouseDown = _state$action.movedSinceMouseDown;
	    var capturedMouseEvents = _state$action.capturedMouseEvents;
	    var longPressTimeoutId = _state$action.longPressTimeoutId;

	    if (input.type !== _events.INTERVAL_LONG_PRESS) {
	        clearTimeout(longPressTimeoutId);
	    }
	    if (input.type !== _events.GLOBAL_MOUSE_UP) {
	        if (movedSinceMouseDown) {
	            (0, _functionsGlobalCursor.unsetCursorToWholeDocument)(window.document);
	        }
	        capturedMouseEvents.pause();
	    }
	}).set(_state.TouchDraggingAction, function (state, input, nextState) {
	    var _state$action2 = state.action;
	    var intervalId = _state$action2.intervalId;
	    var touchId = _state$action2.touchId;
	    var movedSinceTouchStart = _state$action2.movedSinceTouchStart;
	    var longPressTimeoutId = _state$action2.longPressTimeoutId;
	    var onDragEnd = state.onDragEnd;

	    if (input.type !== _events.INTERVAL_LONG_PRESS) {
	        clearTimeout(longPressTimeoutId);
	    }
	    if (touchId === input.touchId) {
	        if (movedSinceTouchStart) {
	            onDragEnd(intervalId);
	        }
	    }
	});

	exports.stateExitClearTimeoutHooks = stateExitClearTimeoutHooks;
	function getCursorName(direction, side) {
	    return ({
	        horizontal: {
	            left: "w-resize",
	            right: "e-resize",
	            whole: "ew-resize"
	        },
	        vertical: {
	            left: "n-resize",
	            right: "s-resize",
	            whole: "ns-resize"
	        }
	    })[direction][side];
	}

	function computeDistance(oldCoords, newCoords) {
	    var deltaX = oldCoords.x - newCoords.clientX;
	    var deltaY = oldCoords.y - newCoords.clientY;
	    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
	}

	function processTimeBarTouchEvent(state, input, stream) {
	    var action = state.action;
	    var onIntervalNew = state.onIntervalNew;
	    var onDoubleTap = state.onDoubleTap;
	    var onLongPress = state.onLongPress;
	    var onTap = state.onTap;
	    var onDoubleLongPress = state.onDoubleLongPress;
	    var onIntervalNew = state.onIntervalNew;
	    var previewBoundsGenerator = state.previewBoundsGenerator;
	    var max = state.max;
	    var width = state.width;
	    var intervals = state.intervals;
	    var coords = input.coords;

	    var newState = state;

	    if (action instanceof _state.FirstPressed && input.type === _events.BAR_TOUCH_END) {
	        if (onDoubleTap === _functionsUtils.noop) {
	            newState = state.set("action", null);
	            onTap();
	        } else {
	            newState = state.set("action", new _state.FirstReleased({
	                singleTapTimeoutId: setTimeout(function () {
	                    // single-tap timeout
	                    stream.onNext({
	                        type: _events.BAR_SINGLE_TAP,
	                        touchId: input.touchId
	                    });
	                }, 300)
	            }));
	        }
	    } else if (action instanceof _state.FirstPressed && input.type === _events.BAR_LONG_PRESS) {
	        newState = state.set("action", null);
	        if (onLongPress === _component.CREATE_INTERVAL) {
	            var offset = action.offset;
	            var startTime = max * offset / width;
	            var bounds = previewBoundsGenerator(startTime, max, intervals.toJS());
	            if (bounds) {
	                onIntervalNew(bounds);
	            }
	        } else {
	            onLongPress();
	        }
	    } else if (action instanceof _state.FirstReleased && input.type === _events.BAR_SINGLE_TAP) {
	        newState = state.set("action", null);
	        onTap();
	    } else if (action instanceof _state.FirstReleased && input.type === _events.BAR_TOUCH_START) {
	        newState = state.set("action", new _state.SecondPressed({
	            longPressTimeoutId: setTimeout(function () {
	                // longpress
	                stream.onNext({
	                    type: _events.BAR_LONG_PRESS,
	                    touchId: input.touchId
	                });
	            }, 600)
	        }));
	    } else if (action instanceof _state.SecondPressed && input.type === _events.BAR_TOUCH_END) {
	        newState = state.set("action", null);
	        onDoubleTap();
	    } else if (action instanceof _state.SecondPressed && input.type === _events.BAR_LONG_PRESS) {
	        newState = state.set("action", null);
	        onDoubleLongPress();
	    } else if (input.type === _events.BAR_TOUCH_START) {
	        newState = state.set("action", new _state.FirstPressed({
	            offset: input.offset,
	            longPressTimeoutId: setTimeout(function () {
	                stream.onNext({
	                    type: _events.BAR_LONG_PRESS,
	                    touchId: input.touchId
	                });
	            }, 600)
	        }));
	    } else {
	        console.error("Unexpected state-input combination!");
	        console.error(state.action ? state.action.toJS() : "<no action>");
	        console.error(input);
	    }
	    return newState;
	}

	function processPreviewEvent(state, input) {
	    var newState = state;

	    if (input.type === _events.BAR_MOUSE_MOVE) {
	        newState = state.set("action", new _state.PreviewAction({ offset: input.offset }));
	    } else if (state.action instanceof _state.PreviewAction && input.type === _events.BAR_MOUSE_LEAVE) {
	        newState = state.set("action", null);
	    }

	    return newState;
	}

	function mouse_drag(state, newCoords) {
	    var max = state.max;
	    var width = state.width;
	    var direction = state.direction;
	    var onStartChange = state.onStartChange;
	    var onEndChange = state.onEndChange;
	    var onIntervalDrag = state.onIntervalDrag;
	    var _state$action3 = state.action;
	    var intervalId = _state$action3.intervalId;
	    var side = _state$action3.side;
	    var timeBeforeDrag = _state$action3.timeBeforeDrag;
	    var initialCoords = _state$action3.initialCoords;
	    var movedSinceMouseDown = _state$action3.movedSinceMouseDown;

	    var _ref = direction == 'horizontal' ? [initialCoords.x, newCoords.clientX] : [initialCoords.y, newCoords.clientY];

	    var _ref2 = _slicedToArray(_ref, 2);

	    var oldPos = _ref2[0];
	    var newPos = _ref2[1];

	    var deltaPx = newPos - oldPos;
	    var newTime = timeBeforeDrag + max * deltaPx / width;

	    if (side === "left") {
	        onStartChange(intervalId, newTime);
	    } else if (side === "right") {
	        onEndChange(intervalId, newTime);
	    } else if (side === "whole") {
	        onIntervalDrag(intervalId, newTime);
	    }

	    if (!movedSinceMouseDown) {
	        var cursorName = getCursorName(direction, side);
	        (0, _functionsGlobalCursor.setCursorToWholeDocument)(window.document, cursorName);

	        var newDraggingAction = state.action.set("movedSinceMouseDown", true);
	        var newState = state.set("action", newDraggingAction);
	        return newState;
	    } else {
	        return state;
	    }
	}

	function processIntervalMouseEvent(state, input, env) {
	    var action = state.action;
	    var onIntervalClick = state.onIntervalClick;
	    var onDragEnd = state.onDragEnd;
	    var onLongPress = state.onLongPress;

	    var newState = state;

	    if (input.type === _events.INTERVAL_MOUSE_DOWN) {
	        var intervalId = input.intervalId;
	        var side = input.side;
	        var initialCoords = input.initialCoords;
	        var timeBeforeDrag = input.timeBeforeDrag;

	        env.capturedMouseEvents.resume();
	        newState = state.set("action", new _state.MouseDraggingAction({
	            intervalId: intervalId,
	            side: side,
	            initialCoords: initialCoords,
	            timeBeforeDrag: timeBeforeDrag,
	            movedSinceMouseDown: false,
	            capturedMouseEvents: env.capturedMouseEvents
	        }));
	    } else if (input.type === _events.GLOBAL_MOUSE_MOVE && action instanceof _state.MouseDraggingAction) {
	        newState = mouse_drag(state, input);
	    } else if (input.type === _events.GLOBAL_MOUSE_UP && action instanceof _state.MouseDraggingAction) {
	        var intervalId = action.intervalId;
	        var movedSinceMouseDown = action.movedSinceMouseDown;
	        var capturedMouseEvents = action.capturedMouseEvents;

	        if (!movedSinceMouseDown) {
	            onIntervalClick(intervalId, null);
	        } else {
	            (0, _functionsGlobalCursor.unsetCursorToWholeDocument)(window.document);
	            onDragEnd(intervalId);
	        }
	        capturedMouseEvents.pause();
	        newState = state.set("action", null);
	    }

	    return newState;
	}

	function touch_drag(state, touchEvent) {
	    var max = state.max;
	    var width = state.width;
	    var direction = state.direction;
	    var onStartChange = state.onStartChange;
	    var onEndChange = state.onEndChange;
	    var onIntervalDrag = state.onIntervalDrag;
	    var touchMoveRadius = state.touchMoveRadius;
	    var _state$action4 = state.action;
	    var intervalId = _state$action4.intervalId;
	    var side = _state$action4.side;
	    var touchId = _state$action4.touchId;
	    var timeBeforeDrag = _state$action4.timeBeforeDrag;
	    var initialCoords = _state$action4.initialCoords;
	    var movedSinceTouchStart = _state$action4.movedSinceTouchStart;

	    if (touchEvent.touchId !== touchId) {
	        // TODO unify where touchId is checked
	        return state;
	    }

	    var _ref3 = direction == 'horizontal' ? [initialCoords.x, touchEvent.clientX] : [initialCoords.y, touchEvent.clientY];

	    var _ref32 = _slicedToArray(_ref3, 2);

	    var oldPos = _ref32[0];
	    var newPos = _ref32[1];

	    var deltaPx = newPos - oldPos;
	    var newTime = timeBeforeDrag + max * deltaPx / width;

	    var newState = state;

	    if (!movedSinceTouchStart && computeDistance(initialCoords, touchEvent) > touchMoveRadius) {
	        var newDraggingAction = state.action.set("movedSinceTouchStart", true);
	        newState = state.set("action", newDraggingAction);
	    }

	    if (movedSinceTouchStart) {
	        if (side === "left") {
	            onStartChange(intervalId, newTime);
	        } else if (side === "right") {
	            onEndChange(intervalId, newTime);
	        } else if (side === "whole") {
	            onIntervalDrag(intervalId, newTime);
	        }
	    }

	    return newState;
	}

	function processIntervalTouchEvent(state, input, stream) {
	    var action = state.action;
	    var onIntervalClick = state.onIntervalClick;
	    var onIntervalTap = state.onIntervalTap;
	    var onDragEnd = state.onDragEnd;
	    var onLongPress = state.onLongPress;
	    var onIntervalLongPress = state.onIntervalLongPress;

	    var newState = state;

	    if (input.type === _events.INTERVAL_TOUCH_START) {
	        var intervalId = input.intervalId;
	        var side = input.side;
	        var initialCoords = input.initialCoords;
	        var timeBeforeDrag = input.timeBeforeDrag;
	        var touchId = input.touchId;

	        var longPressTimeoutId = setTimeout(function () {
	            stream.onNext({
	                type: _events.INTERVAL_LONG_PRESS,
	                touchId: touchId
	            });
	        }, state.longPressInterval);
	        newState = state.set("action", new _state.TouchDraggingAction({
	            intervalId: intervalId,
	            side: side,
	            touchId: touchId,
	            longPressTimeoutId: longPressTimeoutId,
	            t0: new Date(),
	            initialCoords: initialCoords,
	            timeBeforeDrag: timeBeforeDrag,
	            movedSinceTouchStart: false
	        }));
	    } else if (action instanceof _state.TouchDraggingAction && input.type === _events.INTERVAL_TOUCH_MOVE) {
	        newState = touch_drag(state, input);
	    } else if (action instanceof _state.TouchDraggingAction && input.type === _events.INTERVAL_TOUCH_END) {
	        var intervalId = action.intervalId;
	        var touchId = action.touchId;
	        var movedSinceTouchStart = action.movedSinceTouchStart;

	        if (touchId === input.touchId) {
	            newState = state.set("action", null);
	            if (!movedSinceTouchStart) {
	                onIntervalTap(intervalId, null);
	            } else {
	                onDragEnd(intervalId);
	            }
	        }
	    } else if (action instanceof _state.TouchDraggingAction && input.type === _events.INTERVAL_LONG_PRESS) {
	        if (action.touchId === input.touchId && !state.action.movedSinceTouchStart && state.onIntervalLongPress !== _functionsUtils.noop) {
	            newState = state.set("action", null);
	            onIntervalLongPress(action.intervalId);
	        }
	    }

	    return newState;
	}

	function deltaFunction(state, input, stream, environment, terminate) {
	    var action = state.action;
	    var onIntervalClick = state.onIntervalClick;
	    var onDragEnd = state.onDragEnd;
	    var onLongPress = state.onLongPress;

	    var newState = state;

	    // SPECIAL INPUTS

	    if (input.type === _events.TERMINATE) {
	        newState = state.set("action", null);
	        terminate();
	    } else if (input.type === _events.PROPERTY_CHANGE) {
	        var newProps = input.newProps;

	        if ((0, _state.isDraggingAction)(action)) {
	            var intervalId = action.intervalId;

	            var removedElements = (0, _functionsUtils.getRemovedIds)(state.intervals, newProps.intervals);
	            if (~removedElements.indexOf(intervalId)) {
	                newState = state.set("action", null);
	            }
	        }
	        newState = newState.merge(newProps);

	        // BY INITIAL INPUT
	    } else if (input.type === _events.BAR_TOUCH_START) {
	            newState = processTimeBarTouchEvent(state, input, stream);
	        } else if (input.type === _events.BAR_MOUSE_MOVE) {
	            newState = processPreviewEvent(state, input);
	        } else if (input.type === _events.INTERVAL_MOUSE_DOWN) {
	            newState = processIntervalMouseEvent(state, input, environment);
	        } else if (input.type === _events.INTERVAL_TOUCH_START) {
	            newState = processIntervalTouchEvent(state, input, stream);

	            // BY STATE
	        } else if (state.action instanceof _state.FirstPressed || state.action instanceof _state.FirstReleased || state.action instanceof _state.SecondPressed) {
	                newState = processTimeBarTouchEvent(state, input, stream);
	            } else if (state.action instanceof _state.PreviewAction) {
	                newState = processPreviewEvent(state, input);
	            } else if (state.action instanceof _state.MouseDraggingAction) {
	                newState = processIntervalMouseEvent(state, input, environment);
	            } else if (state.action instanceof _state.TouchDraggingAction) {
	                newState = processIntervalTouchEvent(state, input, stream);

	                // ERROR CASES
	            } else if (input.type === _events.BAR_TOUCH_END) {
	                    /**
	                     * residual touch
	                     *
	                     * this happens for example after a longpress
	                     *
	                     * it would be better to set a special state when
	                     * we transit to the null action carrying the information
	                     * that we will transit into the default state as soon as
	                     * the touch ends
	                     */
	                    //console.log("residual touch");
	                } else {
	                        console.error("unexpected type of input; ignoring");
	                    }

	    if ((0, _events.isMouseEvent)(input.type)) {
	        console.log("");
	        console.log("GOT MOUSE EVENT!:");
	        console.log("-----------------");
	        console.log("input:");
	        console.log(input);
	        console.log("new state:");
	        console.log(newState.toJS());
	        console.log("");
	    } else {
	        console.log(input.type);
	    }

	    return newState;
	}

/***/ },
/* 7 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.setCursorToWholeDocument = setCursorToWholeDocument;
	exports.unsetCursorToWholeDocument = unsetCursorToWholeDocument;

	function setCursorToWholeDocument(document, cursorName) {
	    var head = document.head;
	    var element = document.createElement("style");
	    element.id = "drag-style";
	    var text = document.createTextNode("* { cursor: " + cursorName + " !important; } ");
	    element.appendChild(text);
	    head.appendChild(element);
	}

	function unsetCursorToWholeDocument(document) {
	    var element = document.getElementById("drag-style");
	    element.parentNode.removeChild(element);
	}

/***/ },
/* 8 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var c = 0;

	var O1Map = (function () {
	    function O1Map() {
	        _classCallCheck(this, O1Map);

	        // this will use es6 symbols in the future
	        this.symbol = "__o1map_" + c++;
	    }

	    _createClass(O1Map, [{
	        key: "get",
	        value: function get(key) {
	            return key[this.symbol];
	        }
	    }, {
	        key: "set",
	        value: function set(key, value) {
	            key[this.symbol] = value;
	            return this;
	        }
	    }]);

	    return O1Map;
	})();

	exports.O1Map = O1Map;

/***/ },
/* 9 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.isMouseEvent = isMouseEvent;
	var TERMINATE = "<TERMINATE>";
	exports.TERMINATE = TERMINATE;
	var PROPERTY_CHANGE = "<PROPERTY-CHANGE>";

	exports.PROPERTY_CHANGE = PROPERTY_CHANGE;
	var BAR_TOUCH_START = "<BAR-TOUCH-START-EVENT>";
	exports.BAR_TOUCH_START = BAR_TOUCH_START;
	var BAR_TOUCH_END = "<BAR-TOUCH-END-EVENT>";
	exports.BAR_TOUCH_END = BAR_TOUCH_END;
	var BAR_LONG_PRESS = "<BAR-LONG-PRESS-EVENT>";
	exports.BAR_LONG_PRESS = BAR_LONG_PRESS;
	var BAR_SINGLE_TAP = "<BAR-SINGLE-TAP-EVENT>";

	exports.BAR_SINGLE_TAP = BAR_SINGLE_TAP;
	var BAR_MOUSE_MOVE = "<BAR-MOUSE-MOVE>";
	exports.BAR_MOUSE_MOVE = BAR_MOUSE_MOVE;
	var BAR_MOUSE_LEAVE = "<BAR-MOUSE-LEAVE>";

	exports.BAR_MOUSE_LEAVE = BAR_MOUSE_LEAVE;
	var INTERVAL_MOUSE_DOWN = "<INTERVAL-MOUSE-DOWN>";
	exports.INTERVAL_MOUSE_DOWN = INTERVAL_MOUSE_DOWN;
	var GLOBAL_MOUSE_MOVE = "<GLOBAL-MOUSE-MOVE>";
	exports.GLOBAL_MOUSE_MOVE = GLOBAL_MOUSE_MOVE;
	var GLOBAL_MOUSE_UP = "<GLOBAL-MOUSE-UP>";

	exports.GLOBAL_MOUSE_UP = GLOBAL_MOUSE_UP;
	var INTERVAL_TOUCH_START = "<INTERVAL-TOUCH-START>";
	exports.INTERVAL_TOUCH_START = INTERVAL_TOUCH_START;
	var INTERVAL_TOUCH_MOVE = "<INTERVAL-TOUCH-MOVE>";
	exports.INTERVAL_TOUCH_MOVE = INTERVAL_TOUCH_MOVE;
	var INTERVAL_TOUCH_END = "<INTERVAL-TOUCH-END>";
	exports.INTERVAL_TOUCH_END = INTERVAL_TOUCH_END;
	var INTERVAL_LONG_PRESS = "<INTERVAL-LONG-PRESS>";

	exports.INTERVAL_LONG_PRESS = INTERVAL_LONG_PRESS;

	function isMouseEvent(e) {
	    return !! ~[BAR_MOUSE_MOVE, BAR_MOUSE_LEAVE, INTERVAL_MOUSE_DOWN, GLOBAL_MOUSE_MOVE, GLOBAL_MOUSE_UP].indexOf(e);
	}

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.captureMouseEventsOnDomNode = captureMouseEventsOnDomNode;

	var _events = __webpack_require__(9);

	/**
	 * Returns an observable that captures and stops the propagation of all the mouseups and mousemoves on the passed domNode.
	 */

	var rx = __webpack_require__(3);

	__webpack_require__(11);

	function captureMouseEventsOnDomNode(domNode) {
	    var mouseUps = rx.DOM.fromEvent(domNode, 'mouseup', null, true).map(function (e) {
	        e.preventDefault();
	        e.stopPropagation();
	        return {
	            type: _events.GLOBAL_MOUSE_UP,
	            clientX: e.clientX,
	            clientY: e.clientY
	        };
	    });
	    var mouseMoves = rx.DOM.fromEvent(domNode, 'mousemove', null, true).map(function (e) {
	        e.preventDefault();
	        e.stopPropagation();
	        return {
	            type: _events.GLOBAL_MOUSE_MOVE,
	            clientX: e.clientX,
	            clientY: e.clientY
	        };
	    });

	    var inputStreams = rx.Observable.merge([mouseUps, mouseMoves]);
	    return inputStreams;
	}

/***/ },
/* 11 */
/***/ function(module, exports) {

	module.exports = require("rx-dom");

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.defaultPreviewBoundsGenerator = defaultPreviewBoundsGenerator;

	var React = __webpack_require__(13);

	function defaultPreviewBoundsGenerator(startTime, max, intervals) {
	    var intervalPreviewWidth = 60;

	    var prevInterval, nextInterval;
	    for (var i = 0, interval; interval = intervals[i]; i++) {
	        if (interval.to <= startTime) prevInterval = interval;
	        if (interval.from > startTime) {
	            nextInterval = interval;
	            break;
	        }
	    }

	    var minStartTime = prevInterval ? prevInterval.to : 0;
	    var maxEndTime = nextInterval ? nextInterval.from : max;

	    if (intervalPreviewWidth > maxEndTime - minStartTime) {
	        return null;
	    } else {
	        var startTimeUnbounded = startTime - intervalPreviewWidth / 2;
	        var start, end;
	        if (startTimeUnbounded < minStartTime) {
	            start = minStartTime;
	            end = start + intervalPreviewWidth;
	        } else {
	            var endTimeUnbounded = startTime + intervalPreviewWidth / 2;
	            end = endTimeUnbounded > maxEndTime ? maxEndTime : endTimeUnbounded;
	            start = end - intervalPreviewWidth;
	        }
	        return { from: start, to: end };
	    }
	}

/***/ },
/* 13 */
/***/ function(module, exports) {

	module.exports = require("react");

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag

	// load the styles
	var content = __webpack_require__(15);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(17)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../node_modules/css-loader/index.js!./../node_modules/less-loader/index.js!./styles.less", function() {
				var newContent = require("!!./../node_modules/css-loader/index.js!./../node_modules/less-loader/index.js!./styles.less");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(16)();
	// imports


	// module
	exports.push([module.id, "/* VARIABLES */\n/* MIXINS */\n/* TIME-BAR */\n.time-bar {\n  position: relative;\n  background: #eeeeee;\n  display: inline-block;\n  box-sizing: border-box;\n  height: 30px;\n  width: 30px;\n  cursor: normal;\n  -moz-user-select: none;\n  -webkit-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n/* NEW INTERVAL */\n.new-interval {\n  position: absolute;\n  display: inline-block;\n  text-align: center;\n  line-height: 30px;\n  box-sizing: border-box;\n  top: 0;\n  border: 2px solid #cccccc;\n  -moz-user-select: none;\n  -webkit-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n  cursor: pointer;\n  font-weight: bold;\n}\n.horizontal .new-interval {\n  height: 100%;\n  width: 30px;\n}\n.vertical .new-interval {\n  height: 30px;\n  width: 100%;\n}\n/* INTERVAL */\n.interval {\n  position: absolute;\n  display: inline-block;\n  text-align: center;\n  line-height: 30px;\n  box-sizing: border-box;\n  top: 0;\n  height: 100%;\n  width: 100%;\n  border: 2px solid #cccccc;\n  -moz-user-select: none;\n  -webkit-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n  /* VERY LAGGY & CPU intensive\n    transition: @movement-duration left ease-out, @movement-duration width ease-out;\n    will-change: left, width; */\n}\n.interval-content {\n  cursor: default;\n  -moz-user-select: none;\n  -webkit-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n/* HANDLES */\n.interval-handle {\n  position: absolute;\n  display: block;\n  box-sizing: border-box;\n  margin: -2px;\n  -moz-user-select: none;\n  -webkit-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n.horizontal .interval-handle {\n  position: absolute;\n  display: block;\n  box-sizing: border-box;\n  top: 0;\n  height: auto;\n  bottom: 0;\n  width: 8px;\n  margin: -2px;\n  -moz-user-select: none;\n  -webkit-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n.horizontal .interval-handle-left {\n  left: 0;\n  cursor: w-resize;\n  border-left: 2px solid #cccccc;\n}\n.horizontal .interval-handle-right {\n  right: 0;\n  cursor: e-resize;\n  border-right: 2px solid #cccccc;\n}\n.vertical .interval-handle {\n  left: 0;\n  width: auto;\n  right: 0;\n  height: 8px;\n  margin: -2px;\n  -moz-user-select: none;\n  -webkit-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n.vertical .interval-handle-left {\n  top: 0;\n  cursor: n-resize;\n  border-top: 2px solid #cccccc;\n}\n.vertical .interval-handle-right {\n  bottom: 0;\n  cursor: s-resize;\n  border-bottom: 2px solid #cccccc;\n}\n", ""]);

	// exports


/***/ },
/* 16 */
/***/ function(module, exports) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	// css base code, injected by the css-loader
	module.exports = function() {
		var list = [];

		// return the list of modules as css string
		list.toString = function toString() {
			var result = [];
			for(var i = 0; i < this.length; i++) {
				var item = this[i];
				if(item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};

		// import a list of modules into the list
		list.i = function(modules, mediaQuery) {
			if(typeof modules === "string")
				modules = [[null, modules, ""]];
			var alreadyImportedModules = {};
			for(var i = 0; i < this.length; i++) {
				var id = this[i][0];
				if(typeof id === "number")
					alreadyImportedModules[id] = true;
			}
			for(i = 0; i < modules.length; i++) {
				var item = modules[i];
				// skip already imported module
				// this implementation is not 100% perfect for weird media query combinations
				//  when a module is imported multiple times with different media queries.
				//  I hope this will never occur (Hey this way we have smaller bundles)
				if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
					if(mediaQuery && !item[2]) {
						item[2] = mediaQuery;
					} else if(mediaQuery) {
						item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
					}
					list.push(item);
				}
			}
		};
		return list;
	};


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var stylesInDom = {},
		memoize = function(fn) {
			var memo;
			return function () {
				if (typeof memo === "undefined") memo = fn.apply(this, arguments);
				return memo;
			};
		},
		isOldIE = memoize(function() {
			return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
		}),
		getHeadElement = memoize(function () {
			return document.head || document.getElementsByTagName("head")[0];
		}),
		singletonElement = null,
		singletonCounter = 0;

	module.exports = function(list, options) {
		if(false) {
			if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
		}

		options = options || {};
		// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
		// tags it will allow on a page
		if (typeof options.singleton === "undefined") options.singleton = isOldIE();

		var styles = listToStyles(list);
		addStylesToDom(styles, options);

		return function update(newList) {
			var mayRemove = [];
			for(var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var domStyle = stylesInDom[item.id];
				domStyle.refs--;
				mayRemove.push(domStyle);
			}
			if(newList) {
				var newStyles = listToStyles(newList);
				addStylesToDom(newStyles, options);
			}
			for(var i = 0; i < mayRemove.length; i++) {
				var domStyle = mayRemove[i];
				if(domStyle.refs === 0) {
					for(var j = 0; j < domStyle.parts.length; j++)
						domStyle.parts[j]();
					delete stylesInDom[domStyle.id];
				}
			}
		};
	}

	function addStylesToDom(styles, options) {
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			if(domStyle) {
				domStyle.refs++;
				for(var j = 0; j < domStyle.parts.length; j++) {
					domStyle.parts[j](item.parts[j]);
				}
				for(; j < item.parts.length; j++) {
					domStyle.parts.push(addStyle(item.parts[j], options));
				}
			} else {
				var parts = [];
				for(var j = 0; j < item.parts.length; j++) {
					parts.push(addStyle(item.parts[j], options));
				}
				stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
			}
		}
	}

	function listToStyles(list) {
		var styles = [];
		var newStyles = {};
		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var id = item[0];
			var css = item[1];
			var media = item[2];
			var sourceMap = item[3];
			var part = {css: css, media: media, sourceMap: sourceMap};
			if(!newStyles[id])
				styles.push(newStyles[id] = {id: id, parts: [part]});
			else
				newStyles[id].parts.push(part);
		}
		return styles;
	}

	function createStyleElement() {
		var styleElement = document.createElement("style");
		var head = getHeadElement();
		styleElement.type = "text/css";
		head.appendChild(styleElement);
		return styleElement;
	}

	function createLinkElement() {
		var linkElement = document.createElement("link");
		var head = getHeadElement();
		linkElement.rel = "stylesheet";
		head.appendChild(linkElement);
		return linkElement;
	}

	function addStyle(obj, options) {
		var styleElement, update, remove;

		if (options.singleton) {
			var styleIndex = singletonCounter++;
			styleElement = singletonElement || (singletonElement = createStyleElement());
			update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
			remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
		} else if(obj.sourceMap &&
			typeof URL === "function" &&
			typeof URL.createObjectURL === "function" &&
			typeof URL.revokeObjectURL === "function" &&
			typeof Blob === "function" &&
			typeof btoa === "function") {
			styleElement = createLinkElement();
			update = updateLink.bind(null, styleElement);
			remove = function() {
				styleElement.parentNode.removeChild(styleElement);
				if(styleElement.href)
					URL.revokeObjectURL(styleElement.href);
			};
		} else {
			styleElement = createStyleElement();
			update = applyToTag.bind(null, styleElement);
			remove = function() {
				styleElement.parentNode.removeChild(styleElement);
			};
		}

		update(obj);

		return function updateStyle(newObj) {
			if(newObj) {
				if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
					return;
				update(obj = newObj);
			} else {
				remove();
			}
		};
	}

	var replaceText = (function () {
		var textStore = [];

		return function (index, replacement) {
			textStore[index] = replacement;
			return textStore.filter(Boolean).join('\n');
		};
	})();

	function applyToSingletonTag(styleElement, index, remove, obj) {
		var css = remove ? "" : obj.css;

		if (styleElement.styleSheet) {
			styleElement.styleSheet.cssText = replaceText(index, css);
		} else {
			var cssNode = document.createTextNode(css);
			var childNodes = styleElement.childNodes;
			if (childNodes[index]) styleElement.removeChild(childNodes[index]);
			if (childNodes.length) {
				styleElement.insertBefore(cssNode, childNodes[index]);
			} else {
				styleElement.appendChild(cssNode);
			}
		}
	}

	function applyToTag(styleElement, obj) {
		var css = obj.css;
		var media = obj.media;
		var sourceMap = obj.sourceMap;

		if(media) {
			styleElement.setAttribute("media", media)
		}

		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			while(styleElement.firstChild) {
				styleElement.removeChild(styleElement.firstChild);
			}
			styleElement.appendChild(document.createTextNode(css));
		}
	}

	function updateLink(linkElement, obj) {
		var css = obj.css;
		var media = obj.media;
		var sourceMap = obj.sourceMap;

		if(sourceMap) {
			// http://stackoverflow.com/a/26603875
			css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
		}

		var blob = new Blob([css], { type: "text/css" });

		var oldSrc = linkElement.href;

		linkElement.href = URL.createObjectURL(blob);

		if(oldSrc)
			URL.revokeObjectURL(oldSrc);
	}


/***/ },
/* 18 */
/***/ function(module, exports) {

	module.exports = require("angular");

/***/ }
/******/ ])));