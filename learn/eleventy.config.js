import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import { HtmlBasePlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
  const md = markdownIt().use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.headerLink(), // makes the heading itself a link
  });
  eleventyConfig.setLibrary("md", md);
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPassthroughCopy("styles");
}
