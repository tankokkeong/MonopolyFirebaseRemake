const path = require("path");

module.exports = {
    mode: "development",
    entry : ["./src/login.js", "./src/register.js", "./src/home.js", "./src/room.js"],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    watch: true
}
