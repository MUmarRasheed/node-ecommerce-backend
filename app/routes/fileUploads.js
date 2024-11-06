const express                         = require("express");
const loginRouter                     = express.Router();

const multer = require("multer");
const uploadFileController = require("../controllers/fileUploads");
const fs = require("fs");

/* Define THE FILE STORAGE LOCATION AND FILE NAME */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads";
    // Check if the directory exists, if not create it
    if (!fs.existsSync(uploadDir)) {
      console.log("in hereeee");
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

/* SET THE FILE UPLOAD LIMITS */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1500 // 1.5 GB in bytes
  },
});

loginRouter.post(
  "/upload-file",
  upload.array("files", 10),
  uploadFileController.uploadFile
);

loginRouter.post("/upload-file-on-s3", uploadFileController.uploadOnS3Api);

module.exports = {
  loginRouter,
};
