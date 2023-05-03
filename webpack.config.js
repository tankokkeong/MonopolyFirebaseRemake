const path = require("path");

module.exports = {
    mode: "development",
    entry : {
        login: "./src/login.js",
        register: "./src/register.js",
        home : "./src/home.js",
        room : "./src/room.js",
        rules: "./src/rules.js"
    },
    output: {
        path: path.resolve(__dirname, 'dist/build'),
        filename: '[name].js'
    },
    watch: true
}
