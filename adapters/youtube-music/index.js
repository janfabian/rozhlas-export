const { config } = require("dotenv");
const path = require("path");
const NodeID3 = require("node-id3");

const { createPlaylist, uploadSong } = require("./ytm-api");

(async () => {
  config({
    path: path.resolve(__dirname, ".env"),
  });
  try {
    const filepath = path.resolve(__dirname, "sample.mp3");
    NodeID3.write(
      {
        title: "title",
        artist: "artist",
        album: "album name",
        TRCK: "1",
      },
      filepath
    );
    await uploadSong(filepath, "test.mp3");
  } catch (e) {
    console.error(e);
  }
})();

module.exports.handler = async (event, context) => {
  config({
    path: path.resolve(__dirname, ".env"),
  });

  const category = event.Records[0].Sns.MessageAttributes.Category.Value;
  const part = Number(event.Records[0].Sns.MessageAttributes.Part.Value);
  const authors = JSON.parse(
    event.Records[0].Sns.MessageAttributes.Authors.Value
  );
  const partUrl = event.Records[0].Sns.MessageAttributes.PartUrl.Value;
  const name = event.Records[0].Sns.MessageAttributes.Name.Value;

  console.log({ category, part, authors, partUrl, name });

  const playlist = await createPlaylist(`${name} (${authors.join(", ")})`);

  console.log(playlist);

  return {};
};
