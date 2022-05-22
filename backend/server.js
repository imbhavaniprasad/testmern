const app = require("./app");
const cloudinary = require("cloudinary");
const { connectDatabase } = require("./Config/database");
connectDatabase();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
app.listen(process.env.PORT || 4000, () => {
    console.log(`Server Running on ${process.env.PORT}`);
});