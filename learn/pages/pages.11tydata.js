// Returns the path of a page relative to the /pages directory.
function getPagesRelativePath(data) {
  const inputPathRaw = data?.page?.inputPath || "";
  const inputPath = inputPathRaw.replaceAll("\\", "/");

  if (inputPath.startsWith("./pages/")) {
    return inputPath.slice("./pages/".length);
  }
  if (inputPath.startsWith("pages/")) {
    return inputPath.slice("pages/".length);
  }

  return "";
}

// Converts a relative markdown path to a clean slug used by navigation.
function getPageSlug(relativePath) {
  if (relativePath === "index.md") {
    return "index";
  }
  if (relativePath.endsWith("/index.md")) {
    return relativePath.slice(0, -"/index.md".length);
  }
  return relativePath.replace(/\.md$/i, "");
}

export default {
  eleventyComputed: {
    // Generates URL output paths from files in /pages while allowing explicit front-matter overrides.
    permalink: function (data) {
      if (data?.permalink) {
        return data.permalink;
      }

      const relativePath = getPagesRelativePath(data);
      if (!relativePath.toLowerCase().endsWith(".md")) {
        return data?.permalink;
      }

      if (relativePath === "index.md") {
        return "index.html";
      }

      if (relativePath.endsWith("/index.md")) {
        return `${relativePath.slice(0, -"index.md".length)}index.html`;
      }

      return relativePath.replace(/\.md$/i, "/index.html");
    },
    // Adds default navigation metadata so pages appear in the sidebar unless already configured.
    eleventyNavigation: function (data) {
      if (data?.eleventyNavigation?.key) {
        return data.eleventyNavigation;
      }

      const relativePath = getPagesRelativePath(data);
      if (!relativePath.toLowerCase().endsWith(".md")) {
        return data?.eleventyNavigation;
      }

      const slug = getPageSlug(relativePath);
      const key = data?.title || slug;

      return {
        key,
        order: slug === "index" ? 0 : undefined,
      };
    },
  },
};
