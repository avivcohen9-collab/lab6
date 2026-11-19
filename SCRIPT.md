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

## Scene 2 — The problem (~25s)

**On screen:** A grid of song tiles fills in, labeled "Shazam's library: millions of songs". Your short recording's waveform flies in from where the phone was, and a big "?" between them asks "which one?". The "?" becomes an arrow and a scanner checks the tiles one by one while a counter crawls: "FAR TOO SLOW". Then café noise (chatter bubbles, a clinking cup) gets added to the recorded clip, and its waveform turns jagged. The noisy wave slides onto the original: they don't match, red ✗.

**Narration:**
> Behind the scenes, Shazam has a library of millions of songs. Its job is to find the one your short recording came from. The obvious idea is to compare the raw sound wave against every song. But that would be far too slow. And in a noisy café, chatter and clinking cups change the shape of the sound wave, so it would never match the original recording.

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

## Scene 5 — Fingerprint hashes (~26s)

**On screen:** Picks up on Scene 4's exact last frame (the white stars on the night sky, "Step 2: Keep the peaks", "Constellation map" caption). The title changes to "Step 3: Fingerprints". One star grows and glows with a pulsing ring as the anchor, and the others dim. A dashed "target zone" box appears to its right (ahead in time), and lines draw from the anchor to the stars inside it. The camera zooms into one pair: "f1" and "f2" badges pop onto the two stars, dashed lines drop to a time axis, and a Δt bracket spans the gap. The three labels slide into a chip `[ f1 | f2 | Δt ] → #3A7F`. A copy of the pair slides far to the right (recorded later). Its "starts at 0:03" / "starts at 0:41" timestamps get struck out while both Δt brackets glow green. The copy builds the identical `#3A7F` chip, with "=" and a green ✓ ("Same fingerprint, any start time"). The camera zooms back out, and #3A7F flies to the top of a "fingerprints" stack at the right edge. Seven more anchors quickly fire lines to their neighbours, and each shoots a hash chip into the stack, which ends with 8 chips.

**Narration:**
> But a star map is still hard to search. So Shazam picks one star as an anchor, and pairs it with a few nearby stars just ahead of it. Each pair becomes a tiny fingerprint: the two pitches, and the time gap between them. Because it uses the gap, not the exact time, the fingerprint is the same no matter when you started recording. Shazam does this for every star, and gets a whole stack of fingerprints.

---

## Scene 6 — Database lookup (~10s)

**On screen:** The hash chips fly into a large index or table (rows of hashes → song IDs). Matching rows flash. Song titles light up: several songs get a few hits each.

**Narration:**
> These fingerprints are looked up in a giant index, built ahead of time from every song in the catalog. The lookup is instant, like finding a word in a dictionary.

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
