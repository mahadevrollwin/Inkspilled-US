import { defineField } from "sanity";

export const inkField = (name = "ink", title = "Ink colour") =>
  defineField({
    name,
    title,
    type: "string",
    options: {
      list: [
        { title: "Red", value: "red" },
        { title: "Green", value: "green" },
        { title: "Blue", value: "blue" },
      ],
      layout: "radio",
      direction: "horizontal",
    },
    initialValue: "red",
    validation: (rule) => rule.required(),
  });

export const imageField = (name = "image", title = "Image", description?: string) =>
  defineField({
    name,
    title,
    description,
    type: "image",
    options: { hotspot: true },
    validation: (rule) => rule.required(),
  });

export const orderField = defineField({
  name: "order",
  title: "Sort order",
  description: "Lower numbers appear first on the site.",
  type: "number",
  initialValue: 10,
});

export const orderings = [
  { title: "Sort order", name: "orderAsc", by: [{ field: "order", direction: "asc" as const }] },
];
