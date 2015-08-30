
function parseDec(s) {
    return parseInt(s, 10);
}

/**
 * Converts a string of format "HH:MM" to the number
 * of minutes since 00:00.
 */
export function timeStrToMinutes(str) {
    return str.split(":").map(parseDec).reduce(function(h, m) { return h*60+m; });
}

/**
 * Converts a number representing the number of minutes from midnight
 * to a string of format "HH:MM"
 */
export function minutesToStr(minutes) {
    var remainderMinutes = minutes % 60;
    return Math.floor(minutes / 60) + ":" + (remainderMinutes > 10 ? remainderMinutes : "0" + remainderMinutes );
}

/**
 * Given the min and max of a time interval and a time t
 * it returns at which percentace of that time interval t lies.
 *
 * min, max and t are strings of format "HH:MM"
 *
 * returns a number between 0 and 1
 */
export function timeToPercentil(min, max, t) {
    var minMinutes = timeStrToMinutes(min);
    var maxMinutes = timeStrToMinutes(max);
    var durationMinutes = maxMinutes - minMinutes;
    var tMinutes = timeStrToMinutes(t);
    var tFromStart = tMinutes - minMinutes;
    return tFromStart / durationMinutes;
}
