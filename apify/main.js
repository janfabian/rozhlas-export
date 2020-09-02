const Apify = require("apify");
const { log } = Apify.utils;

const url = "https://hledani.rozhlas.cz/iradio/?query=&reader=&offset=0";

Apify.main(async () => {
  const { categories, last24hours } = await Apify.getInput();
  console.log({ categories, last24hours });

  const requestQueue = await Apify.openRequestQueue();
  await Promise.all(
    categories.map((category) => {
      const u = new URL(url);
      u.searchParams.append("porad[]", category);

      if (last24hours) {
        u.searchParams.append("dateLimit", "TL_1D");
      }

      return requestQueue.addRequest({
        url: u.toString(),
        userData: { isCategory: true },
      });
    })
  );

  const crawler = new Apify.CheerioCrawler({
    requestQueue,
    minConcurrency: 10,
    maxConcurrency: 50,
    maxRequestRetries: 1,
    handlePageTimeoutSecs: 30,
    maxRequestsPerCrawl: 5000,
    handlePageFunction: async ({ request, $ }) => {
      console.log(request.url);
      const { isCategory, isEpisode } = request.userData;

      if (isCategory) {
        const episodeUrls = [];
        $("#box-results h3 a").each((index, el) => {
          episodeUrls.push($(el).prop("href"));
        });

        await Promise.all(
          episodeUrls.map((url) =>
            requestQueue.addRequest({
              url,
              userData: { isEpisode: true },
              keepUrlFragment: true,
            })
          )
        );
      }

      if (isEpisode) {
        const part = request.url.split("=")[1];
        const fileUrl = $(`#file-serial-player [part=${part}] a`).prop("href");
        let [authors, name] = $("h1").text().split(":");

        if (!name) {
          name = authors;
          authors = "";
        }

        authors = authors.split(" a ").map((author) => author.trim());

        await Apify.pushData({
          url: request.url,
          part,
          partUrl: fileUrl,
          name: name.trim(),
          authors,
        });
      }
    },

    handleFailedRequestFunction: async ({ request }) => {
      log.debug(`Request ${request.url} failed twice.`);
    },
  });

  await crawler.run();
});
