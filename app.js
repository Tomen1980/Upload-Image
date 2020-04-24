const express = require("express");
const app = express();
const bodyParser = require("body-parser")
const db = require("./config/db");
const PORT = process.env.PORT || 3000
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const multer = require("multer")
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream")
const methodOverride = require("method-override");

//middleware
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.set("view engine","ejs");

//init gfs 
let gfs;

db.once("open",()=>{
    //init stream
    gfs = Grid(db.db,mongoose.mongo);
    gfs.collection("uploads")
})

//create storage engine
const storage = new GridFsStorage({
    db,
    file:(req,file)=>{
        return new Promise((resolve,reject)=>{
            crypto.randomBytes(16,(err,buf)=>{
                if(err){
                    return reject(err);
                }
                const filename = buf.toString("hex") + path.extname(file.originalname)
                const fileInfo = {
                    file: filename,
                    bucketName : "uploads"
                };
                resolve(fileInfo)
            });
        });
    }
});
const upload = multer({storage});

//@route GET
//@desc Loads form
app.get("/",(req,res)=>{
    // res.render("index.ejs")
    gfs.files.find().toArray((err,files)=>{
        //check if files 
        if(!files || files.length === 0){
            res.render("index",{files:false});
        }else{
            files.map(file =>{
                if(file.contentType === "image/jpeg" ||
                 file.contentType === "image/png"
                 ){
                    file.isImage = true;
                }else{
                    file.isImage = false;
                }
            });
            res.render("index",{files:files});
        }
       
    })
});

//@route POST /upload
//@desc Uploads file to DB
app.post("/upload",upload.single("file"),(req,res)=>{
    //res.json({req.file})
    res.redirect("/")

});

// //@route GET/file
//@desc display all file object
app.get("/files",(req,res)=>{
    gfs.files.find().toArray((err,files)=>{
        //check if files 
        if(!files || files.length === 0){
            return res.status(404).json({
                err: "No files exist"
            })
        }
        //files exist
        return res.json({files})
    })
})

//@route GET/files/:filename
//@desc display single file object
app.get("/files/:filename",(req,res)=>{
    gfs.files.findOne({filename : req.params.filename},(err,file)=>{
        //chek if file
        if(!file || file.length === 0 ){
            return res.status(404).json({
                err: "No file exist"
            });
        }
        return res.json(file);
    });
});


//@route GET/image/:filename
//@desc display image file object
app.get("/image/:filename",(req,res)=>{
    gfs.files.findOne({filename : req.params.filename},(err,file)=>{
        //chek if file
        if(!file || file.length === 0 ){
            return res.status(404).json({
                err: "No file exist"
            });
        }
        // check if image
        if(file.contentType === "image/jpeg" || file.contentType === "image/png"){
            //read output to browser 
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
        }else{
            res.status(403).json({
                err:"not an image"
            })
        }
    });
});

//@route Delete /files/:id
//@desc Delet file
app.delete("/files/:id",(req,res)=>{
    gfs.remove({_id:req.params.id, root:"uploads"},(err,gridStore)=>{
        if(err){
            return res.status(404).json({err:err});
        }
        res.redirect("/")
    })
})

app.listen(PORT,(req,res)=>{
    console.log("Server berjalan" + PORT)
});
