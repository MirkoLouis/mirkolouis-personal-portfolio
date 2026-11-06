// About me content: the professional photo and the short introduction beside it.
// Astro resizes the photo, converts it to WebP and strips its metadata at build time.
import professionalPhoto from "../assets/about/Prof_Photo_1_chest_level.png";

// Professional photo shown beside the introduction
export const profilePhoto = {
    image: professionalPhoto,
    alt: "Professional photo of Mark Leo Bagood",
};

// Short introduction, one string per paragraph (condensed from my LinkedIn About)
export const aboutIntro: string[] = [
    "I'm a 4th-year BSIT student at MSU-Iligan Institute of Technology who learns by building. I design and ship full-stack systems, and I run Linux as my daily driver: NixOS, configured declaratively as code.",
    "I quickly see a project's big picture (its purpose, its architecture and how the pieces fit), I read unfamiliar code fast, and I can explain how hardware, the kernel and software work together to people without a technical background.",
    "I'm looking for entry-level roles in systems administration, cloud and DevOps, backend development or technical support engineering, where I can keep going deeper into how computers work.",
];
