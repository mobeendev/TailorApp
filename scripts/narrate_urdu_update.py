"""Generate Pakistani Urdu narration and real sentence boundary timing."""
from pathlib import Path
import asyncio, hashlib, json
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/walkthrough/urdu-update'
VOICE = 'ur-PK-AsadNeural'

async def main():
    scenes = json.loads((OUT / 'storyboard.json').read_text())['scenes']
    audio = OUT / 'audio'
    audio.mkdir(exist_ok=True)
    semaphore = asyncio.Semaphore(2)
    async def generate(scene):
        async with semaphore:
            path = audio / scene['id']
            digest = hashlib.sha256((VOICE + '-5%' + scene['narration']).encode()).hexdigest()
            checksum = path.with_suffix('.sha256')
            if checksum.exists() and checksum.read_text() == digest and path.with_suffix('.mp3').stat().st_size > 5000:
                print(scene['id'] + ' cached', flush=True)
                return
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(scene['narration'], VOICE, rate='-5%', boundary='SentenceBoundary').save(str(path.with_suffix('.mp3')), str(path.with_suffix('.jsonl')))
                    assert path.with_suffix('.mp3').stat().st_size > 5000
                    assert path.with_suffix('.jsonl').stat().st_size > 0
                    checksum.write_text(digest)
                    print(scene['id'] + ' ready', flush=True)
                    return
                except Exception:
                    if attempt == 2:
                        raise
                    await asyncio.sleep(2)
    await asyncio.gather(*(generate(scene) for scene in scenes))

if __name__ == '__main__':
    asyncio.run(main())
