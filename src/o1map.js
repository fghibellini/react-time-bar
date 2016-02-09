
var c = 0;

export class O1Map {

    constructor() {
        // this will use es6 symbols in the future
        this.symbol = "__o1map_" + c++;
    }
    
    get(key) {
        return key[this.symbol];
    }
    
    set(key, value) {
        key[this.symbol] = value;
        return this;
    }

}

