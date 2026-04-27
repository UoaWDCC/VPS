// START IMPORT REQUIRE WORKAROUND
// To make 11ty --serve work with JSON imports
// https://github.com/11ty/eleventy/issues/3128#issuecomment-1878745864
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
// END IMPORT REQUIRE WORKAROUND

// START JSON IMPORT WORKAROUND
// import libdocMessages from "./libdocMessages.json" with { "type": "json" };
// import libdocPackage from "../package.json" with { "type": "json" };
const libdocPackage = require("../package.json");
// END JSON IMPORT WORKAROUND

export default {
  version: function () {
    return libdocPackage.version;
  },
  // environment: process.env.MY_ENVIRONMENT || "development",
  HTMLEncode: function (str) {
    // https://stackoverflow.com/a/784765
    str = [...str];
    //    ^ es20XX spread to Array: keeps surrogate pairs
    let i = str.length,
      aRet = [];

    while (i--) {
      var iC = str[i].codePointAt(0);
      if (iC < 65 || iC > 127 || (iC > 90 && iC < 97)) {
        aRet[i] = "&#" + iC + ";";
      } else {
        aRet[i] = str[i];
      }
    }
    return aRet.join("");
  },
  slugify: function (str) {
    // https://jasonwatmore.com/vanilla-js-slugify-a-string-in-javascript
    // make lower case and trim
    let slug = str.toLowerCase().trim();
    // remove accents from charaters
    slug = slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // replace invalid chars with spaces
    slug = slug.replace(/[^a-z0-9\s-]/g, " ").trim();
    // replace multiple spaces or hyphens with a single hyphen
    slug = slug.replace(/[\s-]+/g, "-");
    return slug;
  },
  extractHtmlTagsFromString: function (string, htmlTagsListArray) {
    // https://stackoverflow.com/a/65725198
    const htmlTagsFound = [];
    string.replace(
      /<([a-zA-Z][a-zA-Z0-9_-]*)\b[^>]*>(.*?)<\/\1>/g,
      function (m, m1, m2) {
        if (htmlTagsListArray.includes(m1)) {
          // write data to result object
          htmlTagsFound.push({
            tagName: m1,
            value: m2,
          });
        }
      }
    );
    return htmlTagsFound;
  },
  generateRandomId: function (length) {
    const charactersList =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    if (typeof length != "number") length = 8;
    for (let index = 0; index < length; index++) {
      const randomIndex = Math.floor(Math.random() * charactersList.length);
      id += charactersList[randomIndex];
    }
    return id;
  },
  templates: {},
};
