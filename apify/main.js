const Apify = require("apify");
const { log } = Apify.utils;

const pageFunction = require("./pageFunction");

const url =
  "https://hledani.rozhlas.cz/iradio/?query=&reader=&offset=0&dateLimit=TL_1D";

Apify.main(async () => {
  const { categories } = await Apify.getInput();
  console.log({ categories });

  const requestList = await Apify.openRequestList(
    null,
    categories.map((category) => {
      const u = new URL(url);
      u.searchParams.append("porad[]", category);

      return u.toString();
    })
  );

  const crawler = new Apify.CheerioCrawler({
    requestList,
    minConcurrency: 10,
    maxConcurrency: 50,
    maxRequestRetries: 1,
    handlePageTimeoutSecs: 30,
    maxRequestsPerCrawl: 10,
    handlePageFunction: async ({ request, $ }) => {
      console.log(request.url);

      const episodeUrls = [];
      $("#box-results h3 a").each((index, el) => {
        episodeUrls.push({
          url: $(el).prop("href"),
        });
      });

      console.log(episodeUrls);

      const input = {
        startUrls: episodeUrls,
        pageFunction,
      };

      await Apify.call("apify/web-scraper", input);
    },

    handleFailedRequestFunction: async ({ request }) => {
      log.debug(`Request ${request.url} failed twice.`);
    },
  });

  await crawler.run();
});