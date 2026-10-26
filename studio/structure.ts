import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem().title("Site settings").id("siteSettings").child(S.document().schemaType("siteSettings").documentId("siteSettings")),
      S.divider(),
      S.documentTypeListItem("work").title("Work"),
      S.documentTypeListItem("service").title("Services"),
      S.documentTypeListItem("post").title("Journal"),
    ]);
