const superagent = require("superagent");
const cookie = require("cookie");
const crypto = require("crypto");
const https = require("https");

const shared = {
  context: {
    client: {
      clientName: "WEB_REMIX",
      clientVersion: "0.1",
    },
  },
};

const baseUrl = "https://music.youtube.com/youtubei/v1/";

const prepareHeaders = () => {
  const headers = {
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.5",
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
    "X-Goog-AuthUser": "0",
    cookie: process.env.COOKIE,
    "x-origin": "https://music.youtube.com",
  };

  const auth =
    cookie.parse(headers.cookie)["SAPISID"] + " " + headers["x-origin"];
  const shasum = crypto.createHash("sha1", { encoding: "utf8" });
  const unixTimestamp = Math.round(new Date().getTime() / 1000);
  shasum.update(unixTimestamp + " " + auth);

  headers.Authorization =
    "SAPISIDHASH " + unixTimestamp + "_" + shasum.digest("hex");

  return headers;
};

module.exports.createPlaylist = async (albumName) => {
  const headers = prepareHeaders();

  const { body } = await superagent
    .post(baseUrl + "playlist/create")
    .set({
      ...headers,
    })
    .query({
      alt: "json",
      key: "AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30",
    })
    .send({
      ...shared,
      title: albumName,
      privacyStatus: "PRIVATE",
    });

  return body.playlistId;
};

module.exports.uploadSong = async (readstream, filename, id3) => {
  const getUploadLinkHeaders = {
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.5",
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
    "X-Goog-AuthUser": "0",
    cookie: process.env.COOKIE,
    "x-origin": "https://music.youtube.com",
  };

  const responseGetUploadLink = await superagent
    .post("https://upload.youtube.com/upload/usermusic/http?authuser=0")
    .set({
      ...getUploadLinkHeaders,
      "content-type": "application/x-www-form-urlencoded;charset=utf-8",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Protocol": "resumable",
    })
    .send({
      filename,
    });
  const uploadUrl = responseGetUploadLink.header["x-goog-upload-url"];

  const uploadHeaders = prepareHeaders();

  const status = await new Promise((resolve, reject) => {
    const req = https.request(
      uploadUrl,
      {
        method: "POST",
        headers: {
          ...uploadHeaders,
          "content-type": "application/x-www-form-urlencoded;charset=utf-8",
          "X-Goog-Upload-Command": "upload, finalize",
          "X-Goog-Upload-Offset": "0",
        },
      },
      (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`${res.statusCode}`));
        }
      }
    );
    req.write(id3);
    readstream.pipe(req);
  });

  return { status };
};
