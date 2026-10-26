import { defineArrayMember, defineField, defineType } from "sanity";
import { imageField } from "./fields";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    imageField("aboutImage", "About panel image", "Blended into the red ink in the homepage About section."),
    defineField({
      name: "process",
      title: "Process steps",
      description: "Shown on every service page.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "step",
          fields: [
            defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "text", type: "string", validation: (rule) => rule.required() }),
          ],
          preview: { select: { title: "title", subtitle: "text" } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
