const express = require("express");
const app = express();
var cors = require('cors')
const path = require("path");

const cookieParser = require("cookie-parser");
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config({ path: "backend/config/config.env" });
}
//middlewares
app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
});
//import routes
const post = require("./routes/post");
const user = require("./routes/user");

app.use("/api/v1", post);
app.use("/api/v1", user);
module.exports = app;