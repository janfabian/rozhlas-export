const { config } = require("dotenv");
const path = require("path");
const NodeID3 = require("node-id3");
const https = require("https");

const { uploadSong } = require("./ytm-api");

module.exports.handler = async (event) => {
  config({
    path: path.resolve(__dirname, ".env"),
  });

  const attributes = event.Records[0].Sns.MessageAttributes;

  const category = attributes.Category.Value;
  const part = Number(attributes.Part ? attributes.Part.Value : "0");
  const authors = JSON.parse(attributes.Authors.Value);
  const partUrl = attributes.PartUrl.Value;
  const name = attributes.Name.Value;

  console.log({ category, part, authors, partUrl, name });

  const id3 = NodeID3.create({
    title: name + (part > 0 ? ` - ${part}` : ""),
    artist: Array.isArray(authors) ? authors.join(", ") : authors,
    album: name,
    genre: category,
    TRCK: part,
  });

  await new Promise((resolve, reject) =>
    https.get(partUrl, (response) =>
      uploadSong(response, `${name}.mp3`, id3).then(resolve).catch(reject)
    )
  );

  return {};
};
