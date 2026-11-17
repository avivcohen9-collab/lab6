"""Generate narration with Kokoro TTS.

Usage: .venv/bin/python scripts/tts.py "Text to speak" out/narration.wav [voice]
"""

import sys
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent.parent
MODEL = ROOT / "models" / "kokoro-v1.0.int8.onnx"
VOICES = ROOT / "models" / "voices-v1.0.bin"


def main() -> None:
    text = sys.argv[1]
    out = Path(sys.argv[2])
    voice = sys.argv[3] if len(sys.argv) > 3 else "am_michael"
    out.parent.mkdir(parents=True, exist_ok=True)

    kokoro = Kokoro(str(MODEL), str(VOICES))
    samples, sample_rate = kokoro.create(text, voice=voice, speed=1.0, lang="en-us")
    sf.write(out, samples, sample_rate)
    print(f"Wrote {out} ({len(samples) / sample_rate:.2f}s, voice={voice})")


if __name__ == "__main__":
    main()
