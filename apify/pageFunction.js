/* eslint-disable no-undef */

module.exports = async function pageFunction(context) {
  const $ = context.jQuery;
  const part = window.location.hash.split("=")[1];
  const partUrl = $("#file-serial-player [part=8] a").prop("href");

  return {
    url: context.request.url,
    part,
    partUrl,
  };
};
