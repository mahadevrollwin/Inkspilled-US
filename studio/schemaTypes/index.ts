import { post } from "./post";
import { service } from "./service";
import { siteSettings } from "./siteSettings";
import { work } from "./work";

export const SINGLETONS = ["siteSettings"];

export const schemaTypes = [siteSettings, work, service, post];
