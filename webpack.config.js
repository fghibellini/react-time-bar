module.exports = {
    entry: "./src/main.js",
    output: {
        path: "./build/",
        filename: "time-bar.js"
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
