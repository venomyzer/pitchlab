# Profile card media

Drop your files in this folder, then write each file name in `DEVELOPER.media` in `src/config.ts`.
Leave a name empty to keep the built-in drawn version.

| Slot         | What it is                              | Good size        | Formats                       |
|--------------|-----------------------------------------|------------------|-------------------------------|
| `banner`     | Top of the card                         | 680 × 232 (3:1)  | mp4, webm, gif, png, webp, jpg |
| `avatar`     | Profile picture, cropped to a circle    | 256 × 256        | mp4, webm, gif, png, webp, jpg |
| `avatarStill` | Optional small still (e.g. 160 × 160 png) for the header button | 160 × 160 | png, webp, jpg |
| `decoration` | Frame around the avatar (see-through middle) | 288 × 288   | webm, gif, png, webp (mp4 on black also works) |
| `nameplate`  | Strip behind your name                  | 640 × 128 (5:1)  | mp4, webm, gif, png, webp     |
| `effect`     | Full-card effect, e.g. fire             | 680 × 1000 (portrait) | mp4 on black, webm, gif, png, webp |

- Videos (mp4, webm) play muted and loop forever. GIFs loop on their own.
- mp4 and jpg can't be see-through, so `decoration`, `nameplate` and `effect` files in those formats are blended
  so black becomes transparent. Fire, sparks or glow on a black background works well.
- The effect always plays over the whole card: once through, then it rests on its last frame for 5 s and repeats.
  For mp4/webm the app does the pause. An animated PNG or GIF has to carry it in the file: set it to loop forever
  and give the last frame a 5 s delay (ask Claude to do this for a new file).
- Keep each file small (under ~2 MB) so the card opens fast. Short loops (2–6 s) are plenty.
- With "reduce motion" on, videos stop on their first frame.
- Only use files you have the right to use.

Example:

```ts
media: {
  banner: 'banner.mp4',
  avatar: 'avatar.gif',
  decoration: 'decoration.webm',
  nameplate: 'nameplate.mp4',
  effect: 'fire.mp4',
},
```
