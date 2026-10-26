import { defineArrayMember, defineField, defineType } from "sanity";
import { imageField, inkField, orderField, orderings } from "./fields";

export const service = defineType({
  name: "service",
  title: "Service",
  type: "document",
  orderings,
  fields: [
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      type: "slug",
      description: "Used in the URL: /services/<slug>",
      options: { source: "name", maxLength: 60 },
      validation: (rule) => rule.required(),
    }),
    inkField(),
    imageField("image", "Image", "Blended into the ink on the homepage row and the service page."),
    defineField({ name: "desc", title: "Short description", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "tags", title: "Tags line", description: "For example “TV · Digital · OOH”.", type: "string" }),
    defineField({ name: "intro", title: "Intro", type: "text", rows: 4 }),
    defineField({ name: "includes", title: "What's included", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({ name: "formats", title: "Formats", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({
      name: "related",
      title: "Related work",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "work" }] })],
    }),
    orderField,
  ],
  preview: { select: { title: "name", subtitle: "desc", media: "image" } },
});
