const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const {
  getSignedUrl: getSignedS3Url,
} = require("@aws-sdk/s3-request-presigner");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");

require("dotenv").config();

const bucketName = "audiofile12";
// const bucketName = "audioplayerbucket12";

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIARTU653BAIJWCRMUT",
    secretAccessKey: "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",
  },
});

async function getObjectUrl(key) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  const url = await getSignedS3Url(s3Client, command);
  return url;
}

// CloudFront domain name obtained from the AWS Management Console
const cloudFrontDomain = "d1bdwrkjhbwi0s.cloudfront.net";

async function getObjectUrlFromCloudFront(key) {
  const encodedKey = encodeURIComponent(key);
  const s3ObjectKey = encodedKey;
  const url = `https://${process.env.cloudfrontDistributionDomain}/${s3ObjectKey}`;
  const privateKey = process.env.Private_KEY;
  const keyPairId = process.env.KeyPairId;
  const dateLessThan = new Date(Date.now() + 600 * 1000); // any Date constructor compatible

  const signedUrl = getSignedUrl({
    url,
    keyPairId,
    dateLessThan,
    privateKey,
  });
  // const expirationTime =;

  // const policy = {
  //   Statement: [
  //     {
  //       Resource: `https://${cloudFrontDomain}/${encodedKey}`,
  //       Condition: {
  //         DateLessThan: {
  //           "AWS:EpochTime": expirationTime,
  //         },
  //       },
  //     },
  //   ],
  // };

  // const cloudFrontSigner = new signCloudFrontUrl({
  //   // No region needed for private CloudFront URL signing
  //   credentials: {
  //     privateKey: process.env.Private_KEY,
  //     keyPairId: process.env.KeyPairId, // Replace with your actual CloudFront Key Pair ID
  //   },
  // });

  // const signedUrl = await cloudFrontSigner.sign(policy, {
  //   url: `https://${cloudFrontDomain}/${encodedKey}`,
  //   expires: expirationTime,
  // });

  return signedUrl;
}

async function putObjectAudio(filename, contentType) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: `audioFiles/${filename}`,
    ContentType: contentType,
  });
  const url = await getSignedS3Url(s3Client, command);
  return url;
}

function generateRandomPassword(length = 10) {
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numericChars = "0123456789";
  const specialChars = "!@#$%^&*()_-+=[]{}|;:,.<>?";

  const allChars =
    uppercaseChars + lowercaseChars + numericChars + specialChars;

  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars.charAt(randomIndex);
  }

  return password;
}

module.exports = {
  putObjectAudio,
  getObjectUrlFromCloudFront,
  getObjectUrl,
  generateRandomPassword,
};

async function getObjectUrl(key) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  const url = await getSignedUrl(s3Client, command);
  return url;
}

// CloudFront domain name obtained from the AWS Management Console
// const cloudFrontDomain = "https://d1bdwrkjhbwi0s.cloudfront.net";

// // Function to get CloudFront URL
// async function getObjectUrlFromCloudFront(key) {
//   const encodedKey = AWS.util.uriEscapePath(key); // URL encoding the object key
//   const url = `https://${cloudFrontDomain}/${encodedKey}`;
//   return url;
// }

// async function putObjectAudio(filename, contentType) {
//   const command = new PutObjectCommand({
//     Bucket: bucketName,
//     Key: `audioFiles/${filename}`,
//     ContentType: contentType,
//   });
//   const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });
//   return url;
// }

// module.exports = { putObjectAudio, getObjectUrlFromCloudFront, getObjectUrl };
