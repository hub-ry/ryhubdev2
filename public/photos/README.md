# Home page photos

The rotating gallery on `ryhub.dev` (the home page) loads images from this folder.
Drop your photos here with these exact filenames:

- `cuneiform.PNG` — clay cuneiform tablet
- `purdue_snow.jpg` — snowy Purdue campus at night
- `berkeley.jpeg` — campanile at Berkeley
- `moline_sky.jpeg` — purple sky over Moline

To add, remove, or reorder photos, edit the `PHOTOS` array in `src/Home.jsx`
(each entry is `{ src: '/photos/<file>', alt: '<description>' }`).

Any image format works (jpg/png/webp); just match the filename to what's in `PHOTOS`.
