const path = require("path");

module.exports = {
  mode: "production",
  entry: "./index.js",
  experiments: {
    outputModule: true,
  },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "build"),
    library: { type: "module" },
  },
};
