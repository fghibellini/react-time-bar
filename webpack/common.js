var _ = require("lodash"),
    extend = _.extend;

module.exports.commonConfig = {
    module: {
        loaders: [
            {
                test: /\.less$/,
                loader: "style!css!less"
            },
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                loader: "babel"
            }
        ]
    }
};

module.exports.applyCommonConfig = function applyCommonConfig(obj) {
    return extend(obj, module.exports.commonConfig);
};
