"""Render verified app captures with Pakistani Urdu narration and timed captions.

Run with the same temporary Pillow/edge-tts/imageio-ffmpeg environment as the
original walkthrough. App screenshots stay intact apart from cropping empty
browser margins, proportional scaling and optional instructional outlines.
"""
from pathlib import Path
import json, math, re, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/walkthrough/urdu-update'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
DATA = json.loads((OUT / 'storyboard.json').read_text())
SCENES = DATA['scenes']
FONT = '/System/Library/Fonts/GeezaPro.ttc'
FPS = 15
LEAD = 0.6
VARIANTS = {
    '04-templates': ['04-templates', '04-template-preview'],
    '12-date-shortcuts': ['12-date-today', '12-date-tomorrow', '12-date-shortcuts'],
    '13-calendar': ['13-calendar', '13-calendar-next', '13-calendar-selected'],
    '18-partial-payment': ['18-partial-entry', '18-partial-payment'],
    '21-payment-cancel': ['20-full-payment-confirmation', '21-payment-cancel'],
    '26-multiple-orders': ['26-multiple-orders-review', '26-second-order', '26-multiple-orders'],
    '27-copy-measurement': ['27-copy-measurement', '27-copy-edited'],
    '29-daily-today': ['29-daily-dashboard', '29-daily-today'],
    '33-global-customer-search': ['33-search-name', '33-global-customer-search'],
    '34-themes': ['34-theme-green', '34-theme-indigo', '34-themes'],
}
BOXES = {
    '20-full-payment-confirmation': [(30, 572, 445, 856)],
    '28-compare-measurements': [(20, 615, 458, 790)],
    '33-global-customer-search': [(20, 140, 458, 230)],
    '33-search-name': [(20, 140, 458, 230)],
}

def font(size):
    return ImageFont.truetype(FONT, size)

def shape(value):
    # Geeza's Urdu glyphs are clear; use Urdu punctuation in authored captions.
    value = value.replace('•', '،').replace(':', '،').replace('←', '، پھر')
    return get_display(arabic_reshaper.reshape(value))

def draw_text(draw, x, y, value, size, color):
    draw.text((x, y), shape(value), font=font(size), fill=color, anchor='rt')

def wrap(value, max_width, size, draw):
    result, line = [], ''
    for word in value.split():
        trial = (line + ' ' + word).strip()
        if line and draw.textlength(shape(trial), font=font(size)) > max_width:
            result.append(line)
            line = word
        else:
            line = trial
    if line:
        result.append(line)
    return result

def ur_number(value):
    return str(value).translate(str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹'))

def duration(path):
    result = subprocess.run([FFMPEG, '-hide_banner', '-i', str(path), '-f', 'null', '-'], capture_output=True, text=True)
    match = re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)', result.stderr)
    if not match or result.returncode:
        raise RuntimeError(f'Invalid audio: {path}')
    h, m, s = map(float, match.groups())
    return h * 3600 + m * 60 + s

def plate(scene, index, screenshot_name, caption, target):
    im = Image.new('RGB', (1920, 1080), '#102F2B')
    d = ImageDraw.Draw(im)
    for x in range(38, 1880, 28):
        d.line((x, 32, x + 9, 32), fill='#8A774E', width=2)
    draw_text(d, 1840, 54, 'ٹیلر ماسٹر  •  مکمل پاکستانی اردو رہنمائی', 30, '#DDC28F')
    draw_text(d, 570, 54, 'اصل ایپ کے مناظر', 25, '#AAC3B7')
    d.rounded_rectangle((65, 103, 605, 1033), radius=27, fill='#061C18', outline='#708068', width=2)
    raw = Image.open(OUT / 'frames' / (screenshot_name + '.jpg')).convert('RGB')
    # The mobile capture has white browser margins at its right and bottom.
    if raw.size == (531, 1111):
        shot = raw.crop((0, 0, 478, 1000))
    elif raw.size == (1513, 808):
        shot = raw.crop((476, 0, 1036, 808))
    else:
        raise RuntimeError(f'Unreviewed screenshot dimensions: {screenshot_name} {raw.size}')
    scale = min(510 / shot.width, 900 / shot.height)
    w, h = round(shot.width * scale), round(shot.height * scale)
    x, y = 335 - w // 2, 568 - h // 2
    im.paste(shot.resize((w, h), Image.Resampling.LANCZOS), (x, y))
    for x0, y0, x1, y1 in BOXES.get(screenshot_name, []):
        d.rounded_rectangle((x + x0 * scale, y + y0 * scale, x + x1 * scale, y + y1 * scale), radius=10, outline='#DDAF53', width=4)
    d.rounded_rectangle((665, 117, 1850, 171), radius=12, fill='#244A3D')
    draw_text(d, 1822, 128, f'حصہ {ur_number(index + 1)} از {ur_number(len(SCENES))}  •  دیکھیں اور عمل کریں', 26, '#E6D1A5')
    title_lines = wrap(scene['title'], 1110, 55, d)
    assert len(title_lines) <= 2, scene['id']
    for j, line in enumerate(title_lines):
        draw_text(d, 1838, 207 + j * 72, line, 55, '#FFF6E4')
    step_y = 365
    for j, step in enumerate(scene['steps']):
        cy = step_y + j * 84
        d.rounded_rectangle((668, cy - 5, 1850, cy + 66), radius=13, fill='#193C32')
        d.ellipse((1788, cy + 9, 1831, cy + 52), fill='#D7B979')
        draw_text(d, 1819, cy + 16, ur_number(j + 1), 26, '#17372D')
        lines = wrap(step, 1050, 34, d)
        if len(lines) > 1:
            lines = wrap(step, 1050, 29, d)
        assert len(lines) == 1, (scene['id'], step)
        draw_text(d, 1768, cy + 15, lines[0], 34 if len(wrap(step, 1050, 34, d)) == 1 else 29, '#DDE8DB')
    d.rounded_rectangle((665, 657, 1850, 974), radius=17, fill='#F5F0E5')
    draw_text(d, 1819, 676, 'آواز کے ساتھ اردو تحریر', 25, '#527667')
    size = 38
    caption_lines = wrap(caption, 1100, size, d) if caption else []
    while len(caption_lines) > 4 and size > 28:
        size -= 1
        caption_lines = wrap(caption, 1100, size, d)
    assert len(caption_lines) <= 4, (scene['id'], caption)
    for j, line in enumerate(caption_lines):
        draw_text(d, 1819, 731 + j * 53, line, size, '#173B31')
    draw_text(d, 1840, 1000, 'فرضی مشقی ریکارڈ  •  اصل گاہک کی رقم وصول ہونے پر ہی درج کریں', 24, '#B9CBB8')
    d.rounded_rectangle((665, 1045, 1850, 1051), radius=3, fill='#2C4D3D')
    d.rounded_rectangle((1850 - 1185 * (index + 1) / len(SCENES), 1045, 1850, 1051), radius=3, fill='#C1A66D')
    target.parent.mkdir(exist_ok=True, parents=True)
    im.save(target)

def stamp(seconds, comma=True):
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f'{h:02}:{m:02}:{s:02}{"," if comma else "."}{ms:03}'

def main():
    elapsed, all_cues, chapters, segment_paths = 0.0, [], [], []
    (OUT / 'segments').mkdir(exist_ok=True)
    previews = '--plates-only' in sys.argv
    for index, scene in enumerate(SCENES):
        audio = OUT / 'audio' / (scene['id'] + '.mp3')
        length = math.ceil((duration(audio) + LEAD + 0.8) * FPS) / FPS
        cues = [json.loads(line) for line in (audio.with_suffix('.jsonl')).read_text().splitlines() if line]
        assert cues and all(c['type'] == 'SentenceBoundary' for c in cues)
        # Sentence metadata from the synthesized narration provides real timings.
        cues = [{'start': c['offset'] / 1e7 + LEAD,
                 'end': min(length, (c['offset'] + c['duration']) / 1e7 + LEAD),
                 'text': c['text'].strip().rstrip('۔.') + '۔'} for c in cues]
        for j in range(len(cues) - 1):
            cues[j]['end'] = min(cues[j]['end'], cues[j + 1]['start'])
        frames = VARIANTS.get(scene['id'], [scene['id']])
        boundaries = sorted(set([0.0, length] + [c['start'] for c in cues] + [c['end'] for c in cues] + [length * j / len(frames) for j in range(1, len(frames))]))
        concat, previous, image_index = [], None, 0
        for start, end in zip(boundaries, boundaries[1:]):
            if end - start < 0.001:
                continue
            middle = (start + end) / 2
            caption = next((c['text'] for c in cues if c['start'] <= middle <= c['end']), '')
            screenshot = frames[min(int(middle / length * len(frames)), len(frames) - 1)]
            key = screenshot, caption
            if key == previous:
                concat[-1][1] += end - start
                continue
            path = OUT / 'plates' / f'{index + 1:02d}-{image_index:02d}.png'
            plate(scene, index, screenshot, caption, path)
            concat.append([path, end - start])
            image_index += 1
            previous = key
        # Pick a narrated frame for the overview/contact sheet.
        preview = next(p for p, _ in concat if p.name.endswith('-01.png')) if len(concat) > 1 else concat[0][0]
        (OUT / 'previews').mkdir(exist_ok=True)
        (OUT / 'previews' / f'{index + 1:02d}.png').write_bytes(preview.read_bytes())
        timeline = OUT / 'segments' / f'{index + 1:02d}.txt'
        timeline.write_text(''.join(f"file '{p.resolve()}'\nduration {d:.9f}\n" for p, d in concat) + f"file '{concat[-1][0].resolve()}'\n")
        result = OUT / 'segments' / f'{index + 1:02d}.mp4'
        if not previews:
            subprocess.run([FFMPEG, '-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', str(timeline), '-i', str(audio), '-vf', f'fps={FPS}', '-af', 'adelay=600,apad', '-t', str(length), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', str(result)], check=True)
        for cue in cues:
            all_cues.append({**cue, 'start': elapsed + cue['start'], 'end': elapsed + cue['end']})
        chapters.append({'start': round(elapsed, 3), 'duration': round(length, 3), 'title': scene['title'], 'scene': scene['id']})
        elapsed += length
        segment_paths.append(result)
        print(f'{index + 1}/{len(SCENES)} ready: {scene["id"]}', flush=True)
    srt = '\n\n'.join(f'{i + 1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}' for i, c in enumerate(all_cues)) + '\n'
    (OUT / 'Tailor-Master-Urdu-Updated.srt').write_text(srt)
    (OUT / 'Tailor-Master-Urdu-Updated.vtt').write_text('WEBVTT\n\n' + '\n\n'.join(f'{stamp(c["start"], False)} --> {stamp(c["end"], False)}\n{c["text"]}' for c in all_cues) + '\n')
    (OUT / 'chapters.json').write_text(json.dumps(chapters, ensure_ascii=False, indent=2) + '\n')
    (OUT / 'chapters-urdu.txt').write_text('\n'.join(f'{stamp(c["start"]).split(",")[0]}  {c["title"]}' for c in chapters) + '\n')
    if previews:
        return
    concat_path = OUT / 'concat.txt'
    concat_path.write_text(''.join(f"file '{p.resolve()}'\n" for p in segment_paths))
    metadata = OUT / 'metadata.txt'
    metadata.write_text(';FFMETADATA1\ntitle=ٹیلر ماسٹر — مکمل پاکستانی اردو رہنمائی\n' + ''.join(f'[CHAPTER]\nTIMEBASE=1/1000\nSTART={round(c["start"]*1000)}\nEND={round((c["start"]+c["duration"])*1000)}\ntitle={c["title"]}\n' for c in chapters))
    final = OUT / 'Tailor-Master-Urdu-Updated.mp4'
    subprocess.run([FFMPEG, '-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', str(concat_path), '-i', str(OUT / 'Tailor-Master-Urdu-Updated.srt'), '-i', str(metadata), '-map', '0:v:0', '-map', '0:a:0', '-map', '1:0', '-map_metadata', '2', '-map_chapters', '2', '-c:v', 'copy', '-c:a', 'copy', '-c:s', 'mov_text', '-metadata:s:a:0', 'language=urd', '-metadata:s:s:0', 'language=urd', '-disposition:s:0', '0', '-movflags', '+faststart', str(final)], check=True)
    (OUT / 'render-result.json').write_text(json.dumps({'video': str(final.resolve()), 'seconds': elapsed, 'scenes': len(SCENES), 'subtitleCues': len(all_cues), 'voice': 'ur-PK-AsadNeural', 'bytes': final.stat().st_size}, indent=2))
    print(f'Exported {final}: {elapsed:.2f}s', flush=True)

if __name__ == '__main__':
    main()
