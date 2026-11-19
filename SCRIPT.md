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

## Scene 2 — The problem (~12s)

**On screen:** A clean waveform labeled "original song". Next to it, a crowd of thousands of tiny waveforms ("millions of songs"). Then café noise (chatter bubbles, a clinking cup) gets added to the recorded clip, and its waveform turns jagged. The two waveforms are overlaid: they don't match, red ✗.

**Narration:**
> Comparing raw sound against millions of songs would be far too slow. And in a noisy café, chatter and clinking cups change the shape of the sound wave, so it would never match the original recording.

---

## Scene 3 — Spectrogram (~10s)

**On screen:** The waveform sweeps into a spectrogram, a grid that fills in column by column. Axis labels appear: "time →" along the bottom, "pitch ↑" up the side. Bright cells glow where the sound is loud.

**Narration:**
> So first, Shazam turns the sound into a picture called a spectrogram. Time runs left to right, pitch goes bottom to top, and brightness shows how loud each frequency is.

---

## Scene 4 — Constellation map (~8s)

**On screen:** Everything in the spectrogram fades except the brightest local peaks, which become white dots on a dark background, like stars. The faint noise disappears, and the dots stay.

**Narration:**
> Then it keeps only the loudest peaks. These bright points survive the noise, and together they look like a map of stars.

---

## Scene 5 — Fingerprint hashes (~8s)

**On screen:** One anchor star highlights and draws lines to a few nearby stars. One pair is zoomed in, and a label builds up: `[ f1 | f2 | Δt ]` → `hash: 3A7F…`. Several more pairs quickly turn into hash chips.

**Narration:**
> Next, it pairs nearby peaks. Each pair becomes a tiny fingerprint: the two frequencies and the time between them.

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
