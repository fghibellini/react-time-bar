
export function objectAssign(target, props) {
    for (var i in props) {
        target[i] = props[i];
    }
    return target;
}
