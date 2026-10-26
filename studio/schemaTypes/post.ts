import { defineArrayMember, defineField, defineType } from "sanity";
import { imageField, inkField } from "./fields";

export const post = defineType({
  name: "post",
  title: "Journal post",
  type: "document",
  orderings: [{ title: "Newest first", name: "dateDesc", by: [{ field: "date", direction: "desc" }] }],
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      type: "slug",
      description: "Used in the URL: /journal/<slug>",
      options: { source: "title", maxLength: 60 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "category", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "date", type: "date", options: { dateFormat: "MMM YYYY" }, validation: (rule) => rule.required() }),
    defineField({ name: "readMinutes", title: "Read time (minutes)", type: "number", initialValue: 5 }),
    inkField(),
    inkField("pal", "Hover palette"),
    imageField("image", "Image", "Shown in the hover blob on the journal list and the post hero."),
    defineField({
      name: "body",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Paragraph", value: "normal" },
            { title: "Heading", value: "h2" },
            { title: "Pull quote", value: "blockquote" },
          ],
          lists: [],
          marks: { decorators: [], annotations: [] },
        }),
        defineArrayMember({
          type: "object",
          name: "figure",
          title: "Figure",
          fields: [defineField({ name: "caption", type: "string", validation: (rule) => rule.required() }), imageField("image", "Image")],
          preview: { select: { title: "caption", media: "image" } },
        }),
      ],
    }),
  ],
  preview: { select: { title: "title", subtitle: "category", media: "image" } },
});
