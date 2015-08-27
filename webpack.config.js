module.exports = {
    entry: {
        "time-bar": "./src/main.js",
        tests: "./test/main.js"
    },
    output: {
        path: "./build/",
        filename: "[name].js"
    },
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
