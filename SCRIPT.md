# How Shazam Recognizes a Song

**Takeaway (what the viewer should understand after one minute):**
Shazam doesn't compare raw sound. It turns audio into a sparse "star map" of loud peaks, hashes pairs of peaks into fingerprints, and finds the song whose fingerprints line up in time.

**Target length:** ~75 seconds (8 scenes)
**Narration:** Kokoro TTS, English
**Visuals:** drawn in code (Remotion / SVG), no generated images

---

## Scene 1 — Hook (~8s)

**On screen:** A phone with the Shazam-style listening button, pulsing rings. Music notes drift in from the side. After a beat, a "song found" card pops up. A small timer counts 0 → 3s.

**Narration:**
> Have you ever wondered how Shazam recognizes a song this fast? You hold up your phone, and in about three seconds, you have the answer.

---

## Scene 2 — The problem (~27s)

**On screen:** A grid of song tiles fills in, labeled "Shazam's library: millions of songs". Your short recording's waveform flies in from where the phone was, and a big "?" between them asks "which one?". The "?" becomes an arrow and a scanner checks the tiles one by one while a counter crawls: "FAR TOO SLOW". Then café noise (chatter bubbles, a clinking cup) gets added to the recorded clip, and its waveform turns jagged. The noisy wave slides onto the original: they don't match, red ✗. Everything clears and a big question appears: "So **how** does it work?"

**Narration:**
> Behind the scenes, Shazam has a library of millions of songs. Its job is to find the one your short recording came from. The obvious idea is to compare the raw sound wave against every song. But that would be far too slow. And in a noisy café, chatter and clinking cups change the shape of the sound wave, so it would never match the original recording. So how does it work?

---

## Scene 3 — Spectrogram (~10s)

**On screen:** The waveform sweeps into a spectrogram, a grid that fills in column by column. Axis labels appear: "time →" along the bottom, "pitch ↑" up the side. Bright cells glow where the sound is loud.

**Narration:**
> So first, Shazam turns the sound into a picture called a spectrogram. Time runs left to right, pitch goes bottom to top, and brightness shows how loud each frequency is.

---

## Scene 4 — Constellation map (~16s)

**On screen:** Picks up on Scene 3's exact final spectrogram. Faint café-noise speckles appear over it. The title changes to "Step 2: Keep the peaks", the legend fades, the dim cells fade away (quietest first), and the local-maximum cells shrink into glowing white dots. The noise speckles flicker and vanish while the dots stay and pulse once. Then the background darkens to a night sky, the axes fade, the dots twinkle, and a "Constellation map" caption appears.

**Narration:**
> But that picture is still full of detail, and the café noise is in there too. So Shazam keeps only the loudest peaks, the brightest points. Background noise is quieter, so these peaks survive it. Together, they look like a map of stars.

---

## Scene 5 — Fingerprint hashes (~8s)

**On screen:** One anchor star highlights and draws lines to a few nearby stars. One pair is zoomed in, and a label builds up: `[ f1 | f2 | Δt ]` → `hash: 3A7F…`. Several more pairs quickly turn into hash chips.

**Narration:**
> Next, it pairs nearby peaks. Each pair becomes a tiny fingerprint: the two frequencies and the time between them.

---

## Scene 6 — Database lookup (~20s)

**On screen:** Title "Step 4: Lookup". The stack of fingerprint chips that Scene 5 ends with slides to the left ("Your fingerprints"). A "Giant index" table builds row by row ("built ahead of time from every song in the library"), sorted by hash. The first chip flies straight to its row: "found in 0.001s". Caption: "Sorted like a dictionary: jump straight to the entry, no scanning". The rest of the chips fire in quick succession, and unrelated rows dim. Each hit row then reveals its songs, then the exact timestamp in each song (e.g. "Midnight Drive @ 0:42.1", "Ocean Lights @ 1:05.3"). Midnight Drive and Ocean Lights both collect several hits, which sets up Scene 7.

**Narration:**
> Now Shazam looks up each fingerprint in a giant index. It was built ahead of time, by fingerprinting every song in its library. Finding a fingerprint there is instant, like looking up a word in a dictionary. Each one points to the songs that contain it, and the exact moment it appears in each song.

---

## Scene 7 — Time alignment (~10s)

**On screen:** A histogram per candidate song, with "time offset" on the x-axis and "matches" on the y-axis. Wrong songs show low scattered bars. The correct song shows one tall spike, and it's highlighted with a ✓.

**Narration:**
> Many songs share some fingerprints by chance. But for the right song, the matches all line up at the same time offset. That spike is the answer.

---

## Scene 8 — Outro (~9s)

**On screen:** A quick recap strip: sound → spectrogram → stars → fingerprints → match ✓. It ends back on the phone showing the found song.

**Narration:**
> Just a few strong peaks, turned into fingerprints, and matched in a split second. That is how Shazam names a song before the chorus even starts.
