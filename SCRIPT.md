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

## Scene 6 — Hash table lookup (~27s)

**On screen:** Title "Step 4: Hash table lookup". The fingerprint chips from Scene 5 slide left ("Your fingerprints = keys"). A hash table with numbered buckets [0]–[11] builds row by row ("built ahead of time from every song in the library"). Each key goes through an "h(key)" box that outputs its bucket number, then jumps straight to that bucket. Badges: "hash lookup: O(1) per key" vs "scan every song: O(n)" (struck out). The values are revealed as lists of (song, time) pairs. Midnight Drive and Ocean Lights both collect several hits, which sets up Scene 7.

**Narration:**
> Now Shazam looks up each fingerprint in a hash table, built ahead of time from every song in its library. The fingerprint is the key. A hash function maps the key straight to a bucket, so each lookup takes constant time, O of one, instead of scanning millions of songs, which is O of n. The value stored in each bucket is a list of pairs: a song that contains this fingerprint, and the time it appears in that song.

---

## Scene 7 — Time alignment (~22s)

**On screen:** Title hands over from "Step 4: Lookup" to "Step 5: Line up in time". Four song panels (the songs hit in Scene 6) appear with a match tally: Midnight Drive 6, Ocean Lights 5, Paper Planes 2, Golden Hour 1. Each panel gets a histogram ("matches ↑", "time offset →", 0:00–3:00). A formula appears: offset = time in song − time in recording, with the example 0:42.6 − 0:00.5 = 0:42.1. The wrong songs' matches drop in at scattered offsets. Then Midnight Drive's matches drop one by one into a single stack at 0:42.1 ("← all at 0:42.1"). On "That spike is the answer", Midnight Drive's panel glows green with "✓ Match" and the others dim.

**Narration:**
> Several songs share some of these fingerprints, just by chance. So Shazam checks the timing. For every match, it subtracts the moment in your recording from the moment in the song. For a wrong song, those offsets are scattered. But for the right song, they all line up at the same offset, forty-two seconds in. That spike is the answer.

---

## Scene 8 — Outro (~18s)

**On screen:** Scene 7's title hands over to "The whole trick". A recap strip, Sound → Spectrogram → Stars → Fingerprints → Match ✓, lights up step by step as the narration names each one. The strip moves up and Scene 1's "✓ Song found: Midnight Drive" card pops in with "3.0s", then "…before the chorus even starts."

**Narration:**
> And that's the whole trick. The sound becomes a spectrogram. The spectrogram becomes a map of stars. Pairs of stars become fingerprints. And the fingerprints that line up in time name the song. All in about three seconds, often before the chorus even starts.
