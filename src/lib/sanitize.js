const sanitizeHtml = require("sanitize-html");

const DEFAULT_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "a",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "hr",
  "code",
  "pre",
  "span",
  "div",
];

const DEFAULT_ALLOWED_ATTRIBUTES = {
  a: ["href", "title", "target", "rel"],
};

function sanitizeRichText(input) {
  if (!input) return "";

  return sanitizeHtml(String(input), {
    allowedTags: DEFAULT_ALLOWED_TAGS,
    allowedAttributes: DEFAULT_ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
      }),
    },
  });
}

module.exports = { sanitizeRichText };

