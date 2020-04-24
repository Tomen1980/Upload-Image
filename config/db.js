const mongoose = require("mongoose");
const db = mongoose.connection;

    mongoose.connect("mongodb://localhost:27017/UploadFile",{
        useNewUrlParser : true,
        useCreateIndex : true,
        useUnifiedTopology : true
    }).then(()=>{
        console.log("Database berjalan")
    }).catch(err =>{
        console.log("koneksi gagal"+err)
    });

    module.exports = db;
