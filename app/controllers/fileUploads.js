const messages                                      = require("../messages/customMessages");
const { sendResponse }                              = require("../helpers/utalityFunctions");
const config                                        = require('config')
const { validationResult }                          = require("express-validator");
const { uploadMultipleFilesOnS3 }                   = require("../helpers/s3Uploads");


//UPLOAD Temp file
async function uploadFile(req, res) {
  try {
    let fileArray = req.files
    if (fileArray.length === 0) return res.status(400).send(sendResponse(1036, messages[1036], false, false));
    let resultArray = []

    for (const element of fileArray) {
      resultArray.push({
        url: `${config.serverApiUrl}/uploads/${element.filename}`
      })
    }
    console.log('resultArray', resultArray)
    return res.status(200).json(sendResponse(1037, messages[1037], true, resultArray));
 
    } catch (error) {
      console.error(error);
      return res.status(500).json(sendResponse(1000, messages[1000], false, error));
    }
}

const uploadOnS3Api = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
  }

  try {
    let files;
    if (typeof req.files !== "undefined" && req.files.length > 0 ) {
      const fieldname = req.files[0].fieldname;
      switch (fieldname) {
        case "image":
          files = await uploadMultipleFilesOnS3(req.files, "images");
          break;
        case "video":
          files = await uploadMultipleFilesOnS3(req.files, "videos");
          break;
        case "videoThumbnail":
          files = await uploadMultipleFilesOnS3(req.files, "VideosThumbnails");
          break
        case "banner":
          files = await uploadMultipleFilesOnS3(req.files, "Banners");
          break
        default:
          return res.status(400).send(sendResponse(1000,"Unsupported file type.", false));
      }

      files = files.map(file => ({ url: file }));

      if (files && files.length > 0) {
        return res.status(200).json(sendResponse(1037, messages[1037], true, files));
      } else {
        return res.status(400).send(sendResponse(1038, messages[1038], false));
      }
    } else {
      return res.status(400).send(sendResponse(1038, messages[1038], false));
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).send(sendResponse(1000, "Error uploading file.", false, error.message));
  }
};

module.exports = {
  uploadFile,
  uploadOnS3Api
};
