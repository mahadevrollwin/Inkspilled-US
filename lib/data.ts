export type InkName = "red" | "green" | "blue";

export type WorkItem = {
  id: string;
  t: string;
  k: string;
  ink: InkName;
  year: string;
  client: string;
  services: string[];
  brief: string;
  idea: string;
  made: string[];
  frames: string[];
};

export type ServiceItem = {
  id: string;
  name: string;
  ink: InkName;
  image: string;
  desc: string;
  tags: string;
  intro: string;
  includes: string[];
  formats: string[];
  related: string[];
};

export type PostBlock = ["p" | "h" | "q" | "fig", string];

export type PostItem = {
  id: string;
  title: string;
  cat: string;
  date: string;
  read: number;
  ink: InkName;
  pal: InkName;
  body: PostBlock[];
};

export const WORK: WorkItem[] = [
  {
    id: "launch",
    t: "Product launch film",
    k: "Brand film",
    ink: "red",
    year: "2026",
    client: "Consumer tech brand, Dubai",
    services: ["Direction", "Production", "Edit", "Social cutdowns"],
    brief:
      "A consumer tech brand needed a 90-second film to introduce its first product in the Gulf, ready for launch day across TV, YouTube and Instagram.",
    idea:
      "One unbroken camera move that follows the product from a pencil sketch to the street, so the film itself feels like the product being made.",
    made: [
      "90-second hero film",
      "6 cutdowns, 6 to 30 seconds",
      "Launch-day social kit in Arabic and English",
      "Out-of-home motion posters",
    ],
    frames: ["Opening sketch sequence", "The single-take move", "Street finale"],
  },
  {
    id: "ramadan",
    t: "Ramadan campaign",
    k: "Ads & social",
    ink: "green",
    year: "2026",
    client: "Retail group, UAE",
    services: ["Campaign idea", "Ads", "Social", "Arabic and English copy"],
    brief:
      "A retail group wanted one campaign that could run for all thirty nights of Ramadan without repeating itself.",
    idea:
      "A lantern that fills with a little more ink each evening, counting down to Eid across TV, social and in-store screens.",
    made: ["30-second TV spot", "30 nightly reels", "In-store screen loops", "Eid finale film"],
    frames: ["Night one lantern", "Night fifteen lantern", "The Eid reveal"],
  },
  {
    id: "rebrand",
    t: "Restaurant rebrand",
    k: "Identity",
    ink: "blue",
    year: "2025",
    client: "Family restaurant group",
    services: ["Identity", "Motion system", "Menu design", "Signage"],
    brief:
      "A family restaurant chain had outgrown its twenty-year-old logo and needed an identity that worked on screens as well as on the menu.",
    idea: "A mark drawn from the steam rising off the signature dish, built to move from day one.",
    made: ["Logo and animated logo", "Type and colour system", "Menus and packaging", "Digital and street signage"],
    frames: ["Steam mark studies", "Animated logo", "Menu system"],
  },
  {
    id: "fashion",
    t: "Fashion week reels",
    k: "Social",
    ink: "red",
    year: "2025",
    client: "Designer label",
    services: ["On-site shoot", "Same-day edit", "Grade", "Social"],
    brief: "A designer label needed same-day content from four runway shows, posted before the after-party ended.",
    idea: "Shoot vertical, cut on the beat of the show music, and publish within hours from an on-site edit suite.",
    made: ["40 reels in 4 days", "Runway recap film", "Press reel", "Behind-the-scenes stories"],
    frames: ["Backstage", "On the runway", "The recap edit"],
  },
  {
    id: "waterfront",
    t: "Waterfront residences",
    k: "Brand film",
    ink: "blue",
    year: "2025",
    client: "Real estate developer",
    services: ["Brand film", "Aerial", "CGI", "Digital ads"],
    brief: "A developer was selling off-plan homes that did not exist yet and needed buyers to picture living there.",
    idea: "Blend real drone footage of the coastline with CGI so buyers see the view from their own balcony.",
    made: ["Sales film", "Sales-centre screen loop", "Digital ad set", "Broker presentation film"],
    frames: ["Coastline aerial", "The balcony view in CGI", "Sales-centre loop"],
  },
];

export const SERVICES: ServiceItem[] = [
  {
    id: "ads",
    name: "Ads",
    ink: "red",
    image: "/services/ads.jpg",
    desc: "Spots cut for every screen and every second.",
    tags: "TV · Digital · OOH",
    intro:
      "We write, shoot and cut ads that work in the first second and still hold up at thirty. Every campaign is planned for each placement from the start, so nothing is a crop of something else.",
    includes: [
      "Concept and script",
      "Storyboards and animatics",
      "Production and direction",
      "Edit, grade and sound",
      "Versions for every placement",
      "Arabic and English adaptations",
    ],
    formats: ["16:9", "9:16", "1:1", "4:5", "6 s", "15 s", "30 s", "60 s"],
    related: ["ramadan", "launch"],
  },
  {
    id: "films",
    name: "Brand films",
    ink: "green",
    image: "/services/films.jpg",
    desc: "Launches, manifestos and founder stories.",
    tags: "Direction · Shoot · Edit",
    intro:
      "A brand film is the piece of work people remember. We develop the story with you, direct the shoot and finish it in-house, so the idea stays intact from first draft to final grade.",
    includes: [
      "Story development",
      "Treatment and casting",
      "Direction and cinematography",
      "Aerial and CGI",
      "Edit, grade, sound and music",
      "Cutdowns for social",
    ],
    formats: ["16:9", "2.39:1", "9:16", "60 s", "90 s", "3 min"],
    related: ["launch", "waterfront"],
  },
  {
    id: "identity",
    name: "Identity",
    ink: "blue",
    image: "/services/identity.jpg",
    desc: "Logos and systems designed to animate.",
    tags: "Logo · Type · Motion",
    intro:
      "We design identities with motion built in. The logo, type and colour are tested moving on screen before they are tested on paper, so the brand behaves the same everywhere it appears.",
    includes: [
      "Brand strategy workshop",
      "Logo and animated logo",
      "Typography and colour system",
      "Motion guidelines",
      "Packaging and print",
      "Arabic and English lockups",
    ],
    formats: ["Logo suite", "Motion toolkit", "Brand guidelines", "Templates"],
    related: ["rebrand", "launch"],
  },
  {
    id: "social",
    name: "Social",
    ink: "red",
    image: "/services/social.jpg",
    desc: "Monthly content that keeps the brand alive.",
    tags: "Reels · Community",
    intro:
      "We plan, shoot and publish a month of content at a time, built around what your audience actually watches. One production day can feed a whole calendar.",
    includes: [
      "Monthly content calendar",
      "Reels, Shorts and TikTok",
      "Static and carousel design",
      "Community management",
      "Monthly reporting",
      "Creator shoots",
    ],
    formats: ["9:16", "1:1", "4:5", "Stories", "Reels", "Carousels"],
    related: ["fashion", "ramadan"],
  },
  {
    id: "editing",
    name: "Editing",
    ink: "green",
    image: "/services/editing.jpg",
    desc: "Edit, grade, sound and motion graphics.",
    tags: "Post-production",
    intro:
      "Bring us your footage and we turn it into a finished film. Editors, colourists, sound designers and motion designers work under one roof, so changes move fast.",
    includes: [
      "Offline and online edit",
      "Colour grading",
      "Sound design and mix",
      "Motion graphics and titles",
      "Arabic and English subtitles",
      "Broadcast and social deliverables",
    ],
    formats: ["4K masters", "Broadcast specs", "Social versions", "Subtitles"],
    related: ["fashion", "launch"],
  },
];

export const PROCESS: [string, string][] = [
  ["Brief", "We agree the goal, the audience and where the work will run."],
  ["Treatment", "A written and visual plan, approved before anything is shot."],
  ["Production", "Casting, locations, crew and the shoot itself."],
  ["Post", "Edit, grade, sound and motion, with two rounds of changes."],
  ["Delivery", "Masters and every version, named and ready to publish."],
];

export const POSTS: PostItem[] = [
  {
    id: "identity",
    title: "Why motion should lead your brand identity",
    cat: "Identity",
    date: "Oct 2026",
    read: 6,
    ink: "blue",
    pal: "blue",
    body: [
      ["p", "Most identities are still designed as a still image first. The logo is drawn, the colours are picked and the guidelines are printed, and only at the end does someone ask how it should move. By then the hard decisions are made, and motion becomes decoration."],
      ["p", "Yet most people now meet a brand on a screen, not on a business card. They see it for a second in a story, a pre-roll ad or an app’s splash screen. If the identity only works when it holds still, it is not working where it matters."],
      ["h", "Start with a gesture"],
      ["p", "We begin every identity project by asking how the brand moves before we ask how it looks. Is it quick or patient? Does it build up or reveal? A sports brand might snap into place; a hospitality brand might unfold slowly, like a door opening."],
      ["p", "That gesture then shapes the drawing. A mark designed to rotate needs balance around its centre. A wordmark that writes itself needs a stroke order. These choices are cheap to make early and expensive to retrofit."],
      ["q", "If the identity only works when it holds still, it is not working where it matters."],
      ["h", "Test it moving"],
      ["p", "Before we present a logo, we put it in motion at the real sizes it will live at: a 6-second bumper, a vertical story, a loading icon. Small problems show up immediately. Thin strokes flicker, details vanish, and spacing that looked generous in a PDF feels cramped at speed."],
      ["fig", "Logo studies tested as a 6-second bumper"],
      ["h", "What you get"],
      ["p", "A motion-led identity ships with more than a logo file. It includes animated versions of the mark, timing rules, transitions and templates your team can use. The result is a brand that feels the same in a TV spot, a reel and on the shop sign."],
    ],
  },
  {
    id: "oneday",
    title: "Shooting for Reels, Shorts and TikTok in one day",
    cat: "Production",
    date: "Sep 2026",
    read: 5,
    ink: "red",
    pal: "red",
    body: [
      ["p", "Vertical video is no longer the afterthought of a shoot. For many brands it is the main event, and the landscape film is the cutdown. Planning for that changes how a production day runs."],
      ["h", "Plan the edit before the shoot"],
      ["p", "We write the shot list for the vertical frame first. Every scene is framed with the important action in the middle third, where it survives both 9:16 and 4:5 crops. Wide shots are planned separately rather than hoping they can be cropped later."],
      ["h", "Batch by setup, not by video"],
      ["p", "A single day can produce a month of content if the schedule is built around setups instead of individual posts. We light one setup, then shoot every piece that needs it: a product hero, a talking head, a tutorial and three hooks for testing."],
      ["q", "Shoot hooks in threes. The first second decides whether anyone sees the rest."],
      ["h", "Capture the first second three ways"],
      ["p", "The opening of a short video decides whether people keep watching. We film at least three different openings for every idea, such as a question, a close-up and a movement, so the edit team can test which one holds attention."],
      ["fig", "One setup, four pieces of content"],
      ["h", "Edit the same day"],
      ["p", "An on-site editor starts assembling while the shoot continues. By the end of the day the client has rough cuts of the first posts, and any missing shots can be picked up before the set is struck."],
    ],
  },
  {
    id: "bilingual",
    title: "Designing bilingual Arabic and English motion type",
    cat: "Typography",
    date: "Aug 2026",
    read: 7,
    ink: "green",
    pal: "green",
    body: [
      ["p", "In the UAE most campaigns run in Arabic and English, often on the same screen. Animating type in two scripts that read in opposite directions is one of the most interesting problems in motion design, and one of the easiest to get wrong."],
      ["h", "Respect the reading direction"],
      ["p", "English reads left to right and Arabic reads right to left. An animation that reveals text from the left feels natural in English and backwards in Arabic. We mirror the direction of reveals, wipes and camera moves for each language instead of reusing one animation."],
      ["h", "Pair typefaces by colour, not by shape"],
      ["p", "Arabic and Latin letters are built differently, so a perfect match is impossible. Instead we pair fonts that have a similar weight and texture on the page, so neither language looks louder than the other."],
      ["q", "Neither language should look like a translation of the other."],
      ["h", "Keep the joins intact"],
      ["p", "Arabic letters connect to each other, and many animation tricks break those connections. Animating letter by letter or adding letter spacing splits words apart and makes them hard to read. We animate whole words, or use masks that reveal connected strokes together."],
      ["fig", "Matched reveal directions for Arabic and English"],
      ["h", "Plan the layout for both"],
      ["p", "Arabic text often needs more vertical space and less horizontal space than English. We design layouts that hold either script comfortably, rather than squeezing Arabic into a box that was drawn for English."],
    ],
  },
  {
    id: "firstsecond",
    title: "What a 15-second ad needs in its first second",
    cat: "Ads",
    date: "Jul 2026",
    read: 4,
    ink: "red",
    pal: "blue",
    body: [
      ["p", "Most people decide whether to watch an ad in its first second. On social platforms they can scroll past it, and before a video they are waiting for the skip button. That second has to do more work than any other."],
      ["h", "Show the brand early"],
      ["p", "If the ad is skipped after two seconds, it should still have done its job. We put the brand, the product or a distinctive brand asset on screen within the first second, rather than saving it for an end card most people never see."],
      ["h", "Start with movement"],
      ["p", "A static first frame looks like a paused video. Opening on motion, such as a pour, a turn or a reveal, gives the eye something to follow and signals that something is about to happen."],
      ["q", "The end card is the part of the ad that the fewest people see."],
      ["h", "Design for sound off"],
      ["p", "Many people watch with the sound off. The first second has to make sense without audio, so we use clear visuals and large on-screen text rather than relying on a voiceover to set the scene."],
      ["fig", "Three openings tested for the same 15-second spot"],
      ["h", "Test more than one opening"],
      ["p", "We cut every ad with several different first seconds and let the platform data choose. The rest of the ad can stay the same; small changes at the start often make the biggest difference."],
    ],
  },
];

export const pad = (n: number) => String(n).padStart(2, "0");

export const findWork = (id: string) => WORK.find((item) => item.id === id);
export const findService = (id: string) => SERVICES.find((item) => item.id === id);
export const findPost = (id: string) => POSTS.find((item) => item.id === id);
