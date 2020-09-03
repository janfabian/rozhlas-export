"use strict";
const superagent = require("superagent");
const AWS = require("aws-sdk");
const sns = new AWS.SNS({ apiVersion: "2010-03-31" });
const apifyDatasetGetUrl = (id) =>
  `https://api.apify.com/v2/datasets/${id}/items`;

module.exports.handler = async (event) => {
  const { resource } = JSON.parse(event.body);
  const { defaultDatasetId } = resource;
  const { body: episodes } = await superagent.get(
    apifyDatasetGetUrl(defaultDatasetId)
  );

  const published = await Promise.all(
    episodes
      .filter((e) => e.partUrl && e.name)
      .map((episode) => {
        const params = {
          Message: "new episode",
          TopicArn: process.env.NewEpisodesTopicARN,
          MessageAttributes: {
            Authors: {
              DataType: "String.Array",
              StringValue: JSON.stringify(episode.authors),
            },
            Category: {
              DataType: "String",
              StringValue: episode.category,
            },
            Name: {
              DataType: "String",
              StringValue: episode.name,
            },
            PartUrl: {
              DataType: "String",
              StringValue: episode.partUrl,
            },
            ...(episode.part
              ? {
                  Part: {
                    DataType: "Number",
                    StringValue: episode.part,
                  },
                }
              : {}),
          },
        };

        return sns.publish(params).promise();
      })
  );

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Published",
        published,
      },
      null,
      2
    ),
  };
};
