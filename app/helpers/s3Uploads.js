const path                                                    = require("path");
const config                                                  = require("config");
const AWS                                                     = require("aws-sdk");
const { sendResponse }                                        = require("../helpers/utalityFunctions");
const fs                                                      = require("fs");
const { randomInt } = require("crypto");

AWS.config.update({
  accessKeyId: config.s3Bucket.accessKey,
  secretAccessKey: config.s3Bucket.secretKey,
});

const s3 = new AWS.S3();

const uploadOns3 = async (params) => {
  return new Promise((resolve) => {
    s3.upload(params, (err, data) => {
      if (err) {
        console.error("Error uploading image:", err);
        return resolve({
          status: false,
          message: err,
        });
      } else {
        return resolve({
          status: true,
          message: data,
        });
      }
    });
  });
};


const uploadSingleFileOnS3 = async (fileObjArray, pathFolder) => {
  console.log("🚀 ~ uploadSingleFileOnS3 ~ fileObjArray:", fileObjArray);
  console.log("🚀 ~ uploadSingleFileOnS3 ~ pathFolder:", pathFolder);
  try {
    const fileObj = fileObjArray[0]; // Assuming only one file is uploaded
    const fileExtension = path.extname(fileObj.originalname);
    const fileUrl = randomInt(16) + fileExtension;
    const uploadPath = pathFolder + "/" + fileUrl;

    const params = {
      Bucket: config.s3Bucket.bucketName,
      Key: uploadPath,
      Body: fileObj.buffer,
      ContentType: fileObj.mimetype,
    };

    const uploadResult = await uploadOns3(params);
    if (uploadResult.status) {
      return fileUrl;
    } else {
      throw new Error(uploadResult.message);
    }
  } catch (error) {
    console.log(error);
    return [];
  }
};


const uploadMultipleFilesOnS3 = async (fileObjArray, pathFolder) => {
  try {
    const uploadedFiles = [];

    for (let i = 0; i < fileObjArray.length; i++) {
      const fileObj = fileObjArray[i];
      const fileExtension = path.extname(fileObj.originalname);
      let fileUrl = uid(16) + fileExtension;
      const uploadPath = pathFolder + "/" + fileUrl;

      const params = {
        Bucket: config.s3Bucket.bucketName,
        Key: uploadPath,
        Body: fileObj.buffer,
        ContentType: fileObj.mimetype,
      };

      const uploadResult = await uploadOns3(params);
      if (uploadResult.status) {
        fileUrl = `${config.BaseUrl}${uploadPath}`;
        uploadedFiles.push(fileUrl);
      } else {
        return res.status(500).send(sendResponse(1000, "Error uploading file.", false, error.message)
        );
      }
    }

    return uploadedFiles;
  } catch (error) {
    console.log(error);
    return [];
  }
};


// Helper function to generate pre-signed URL
const getPresignedUrl = (key) => {
  const params = {
    Bucket: config.s3Bucket.bucketName,
    Key: key,
    Expires: config.signedUrlsExpiry // URL expiration time 4 hours
  };
  return s3.getSignedUrlPromise('getObject', params);
};


async function uploadZoomMeetingToS3(filePath, key) {
  const fileContent = fs.readFileSync(filePath);
  const params = {
    Bucket: config.s3Bucket.bucketName,
    Key: key,
    Body: fileContent,
  };

  try {
    const data = await s3.upload(params).promise();
    console.log("🚀 ~ uploadToS3 ~ data:", data);
    return data.Location;
  } catch (error) {
    console.error("Error uploading to S3:", error.message);
    throw error;
  }
}

module.exports = {
  uploadOns3,
  uploadSingleFileOnS3,
  uploadMultipleFilesOnS3,
  getPresignedUrl,
  uploadZoomMeetingToS3,
};
