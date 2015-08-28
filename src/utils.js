
var _ = require("lodash");

export function objectAssign(target, props) {
    for (var i in props) {
        target[i] = props[i];
    }
    return target;
}

export function arrayEqual(xs, ys) {
    var length = xs.length;
    if (length !== ys.length) {
        return false;
    }
    for (var i = 0; i < length; i++) {
        if (xs[i] !== ys[i]) {
            return false;
        }
    }
    return true;
}

export var cloneDeep = _.cloneDeep;
