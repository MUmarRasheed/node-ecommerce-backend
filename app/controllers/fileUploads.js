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
        url: `${config.apiUrl}uploads/${element.filename}`
      })
    }
    console.log('resultArray', resultArray)
    return res.status(200).json(sendResponse(1037, messages[1037], true, resultArray));
 
    } catch (error) {
      console.error(error);
      return res.status(500).json(sendResponse(1000, messages[1000], false, error));
    }
}

const folderMapping = {
  "productImage": "Products/Images",
  "productThumbnail": "Products/Thumbnails",
  "categoryImage": "Categories/Images",
  "categoryThumbnail": "Categories/Thumbnails",
  "categoryIcon": "Categories/Icons",
  "subcategoryImage": "Subcategories/Images",
  "subcategoryIcon": "Subcategories/Icons",
  "shopLogo": "Shops/Logos",
  "shopBanner": "Shops/Banners",
  "userProfilePhoto": "Profiles/UserProfilePhotos",
  "userCoverPhoto": "Profiles/CoverPhotos"
};

const uploadOnS3Api = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
  }

  try {
    let files;
    if (typeof req.files !== "undefined" && req.files.length > 0) {
      const fieldname = req.files[0].fieldname;
      const folder = folderMapping[fieldname];

      if (folder) {
        files = await uploadMultipleFilesOnS3(req.files, folder);

        files = files.map(file => ({ url: file }));

        return res.status(200).json(sendResponse(1037, messages[1037], true, files));
      } else {
        return res.status(400).send(sendResponse(1000, "Unsupported file type.", false));
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
