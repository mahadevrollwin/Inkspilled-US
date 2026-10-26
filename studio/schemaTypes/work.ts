import { defineArrayMember, defineField, defineType } from "sanity";
import { imageField, inkField, orderField, orderings } from "./fields";

export const work = defineType({
  name: "work",
  title: "Work",
  type: "document",
  orderings,
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      type: "slug",
      description: "Used in the URL: /work/<slug>",
      options: { source: "title", maxLength: 60 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "category", title: "Category", description: "For example “Brand film”.", type: "string", validation: (rule) => rule.required() }),
    inkField(),
    imageField("image", "Cover image", "Shown on the work card and the case-study hero."),
    defineField({ name: "year", type: "string" }),
    defineField({ name: "client", type: "string" }),
    defineField({ name: "services", title: "Services", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({ name: "brief", title: "The brief", type: "text", rows: 3 }),
    defineField({ name: "idea", title: "The idea", type: "text", rows: 3 }),
    defineField({ name: "made", title: "What we made", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({
      name: "frames",
      title: "Frames",
      description: "Stills shown on the case-study page.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "frame",
          fields: [
            defineField({ name: "caption", type: "string", validation: (rule) => rule.required() }),
            imageField("image", "Image"),
          ],
          preview: { select: { title: "caption", media: "image" } },
        }),
      ],
    }),
    orderField,
  ],
  preview: { select: { title: "title", subtitle: "category", media: "image" } },
});
