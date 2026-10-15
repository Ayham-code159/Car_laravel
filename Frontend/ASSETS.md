# Campaign artwork

Original image generated with the built-in imagegen tool for this project. No artwork or branding was copied from the rental reference site.

Final assets:

- `public/images/hero-desktop.webp`
- `public/images/hero-mobile.webp`

`scripts/prepare-art.mjs` optimizes the source PNG into WebP and crops the mobile variation. Sharp is a development-only dependency. The original source remains in the image tool's generated-image library. Regeneration is optional; the web app only needs the committed WebP files.

Prompt used:

> Use case: ads-marketing. Create an original photorealistic cinematic automotive editorial photograph for a premium dark luxury car rental website hero. Very wide landscape composition 1792x1024 or similar. One beautiful unbranded graphite silver grand touring coupe, low sleek elegant design, photographed front three-quarter view facing left, positioned on the RIGHT HALF of the frame. Full car visible, including tires. Car occupies lower right two thirds of composition. Dramatic monumental dark concrete architectural pavilion at dusk with horizontal warm light slit, muted bronze reflections on the hood, beautiful realistic metallic paint, black alloy wheels. Almost black charcoal environment, restrained warm gold light, polished asphalt with subtle reflection, distant misty mountains on the right. Left third is dark clean atmospheric negative space suitable for white text overlay. Luxury automotive magazine campaign, real lens 50mm, low camera angle, high fidelity photography, dramatic yet readable car silhouette. No text, no letters, no logos, no badges, no watermark, no people. This is an illustrative campaign car rather than a representation of actual rental inventory.

The campaign car is illustrative. All inventory imagery is supplied exclusively by Laravel/Spatie Media Library.

General rental journey reference inspected: [auriscars.net/en](https://auriscars.net/en). Its booking/search journey informed the functional review; branding, copy, business claims, photography, and page design were not reused.

Implementation references checked: [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite), [DayPicker selection](https://daypicker.dev/docs/selection-modes/), and [Motion accessibility](https://motion.dev/docs/react-accessibility).
