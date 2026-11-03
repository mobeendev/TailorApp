"""Build an annotated, narrated video from real UI captures in artifacts/walkthrough.
Uses macOS's installed Hindi voice; screenshot collection is performed through CUA.
"""
from pathlib import Path
import json, subprocess, re, math, textwrap, sys
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/walkthrough'; FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
SCENES=json.loads((OUT/'scenes.json').read_text())
# Replaced these early settings shots with the final App language and theme UI.
order=list(range(1,30))+[31,32,35,36,37,38,39,34,40,41,42,44,43,45]
by_step={int(s['title'].split(' · ')[0]):s for s in SCENES}
SCENES=[by_step[i] for i in order]
W,H=1600,900
FONT='/System/Library/Fonts/Avenir Next.ttc'
def font(size): return ImageFont.truetype(FONT,size)
def lines(text,width,draw,f):
 words=text.split(); result=[];line=''
 for word in words:
  candidate=(line+' '+word).strip()
  if draw.textlength(candidate,font=f)>width and line:result.append(line);line=word
  else:line=candidate
 if line:result.append(line)
 return result

def plate(scene,index):
 im=Image.new('RGB',(W,H),'#102F2B');d=ImageDraw.Draw(im)
 for x in range(36,W,30):
  d.line((x,28,x+7,28),fill='#8B784B',width=1)
 d.text((65,57),'TAILOR MASTER',font=font(18),fill='#DEC18B')
 d.text((W-382,59),'HINDI VOICE · ROMAN URDU GUIDE',font=font(11),fill='#99B4A7')
 d.rounded_rectangle((64,101,500,839),radius=30,fill='#071D1B',outline='#6B765B',width=2)
 shot=Image.open(OUT/'frames'/scene['file']).convert('RGB')
 crop=scene.get('crop'); ox=oy=0
 if crop:ox,oy=crop[:2];shot=shot.crop(crop)
 scale=min(410/shot.width,710/shot.height);sw,sh=round(shot.width*scale),round(shot.height*scale)
 sx=282-sw//2;sy=470-sh//2
 shot=shot.resize((sw,sh),Image.Resampling.LANCZOS);im.paste(shot,(sx,sy))
 for box in scene.get('boxes',[]):
  x,y,bw,bh=box['x']-ox,box['y']-oy,box['w'],box['h']
  if x<0 or y<0 or y>=sh/scale or x>=sw/scale:continue
  x0,y0=sx+x*scale,sy+y*scale;x1,y1=min(sx+sw,x0+bw*scale),min(sy+sh,y0+bh*scale)
  if x1<=x0 or y1<=y0:continue
  d.rounded_rectangle((x0-4,y0-4,x1+4,y1+4),radius=8,outline='#EFBF5D',width=3)
  cx=min(x1-9,sx+sw-15);cy=max(sy+12,y0-8)
  d.ellipse((cx-12,cy-12,cx+12,cy+12),fill='#EFBF5D');d.text((cx-4,cy-8),'1',font=font(12),fill='#193E32')
 d.rounded_rectangle((567,116,1518,169),radius=11,fill='#1D443B')
 d.text((590,131),f'QADAM {index+1:02d} / {len(SCENES):02d}    •    ASAL APP KA DEMO',font=font(14),fill='#D7C08E')
 title=re.sub(r'^\d+\s*·\s*','',scene['title']).replace('na p','naap')
 y=215
 for line in lines(title,890,d,font(44)):
  d.text((575,y),line,font=font(44),fill='#FAF4E7');y+=59
 d.line((578,y+18,697,y+18),fill='#B8975D',width=3);y+=65
 caption=scene['caption'].replace('na p','naap').replace('na way','tareeqe').replace('mit ti','mitti')
 for line in lines(caption,840,d,font(29)):
  d.text((578,y),line,font=font(29),fill='#CCD9CD');y+=46
 d.rounded_rectangle((575,704,1508,788),radius=13,fill='#193D34',outline='#36574A',width=1)
 note='Alag settings-practice shop · Pehle ke records mehfooz hain.' if scene.get('crop') else 'Sunein, dekhein, phir apni dukaan mein karke dekhein.'
 d.text((599,722),note,font=font(18),fill='#DCC99F')
 d.text((599,752),'Practice data only · Apne asal records ko overwrite na karein.',font=font(13),fill='#93B09D')
 d.text((575,832),'RIWAYATI HUNAR. NAYA ANDAAZ-E-TARTEEB.',font=font(13),fill='#A18D61')
 path=OUT/'plates'/f'{index+1:02d}.png';path.parent.mkdir(exist_ok=True);im.save(path);return path

def audio(index,scene):
 file=OUT/'audio'/f'{index+1:02d}.aiff';script=OUT/'audio'/f'{index+1:02d}.txt';script.write_text(scene['hindi'])
 if not file.exists() or file.stat().st_size<5000:
  subprocess.run(['say','-v','Lekha','-r','155','-f',str(script),'-o',str(file)],check=True)
 result=subprocess.run([FFMPEG,'-hide_banner','-i',str(file),'-f','null','-'],capture_output=True,text=True)
 match=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',result.stderr)
 if not match:raise RuntimeError('No real narration audio: '+str(file))
 h,m,s=map(float,match.groups());duration=h*3600+m*60+s
 if duration<1:raise RuntimeError('Empty narration')
 return file,duration

def main():
 (OUT/'segments').mkdir(exist_ok=True);chapters=[];time=0;concat=[]
 for i,scene in enumerate(SCENES):
  image=plate(scene,i);sound,duration=audio(i,scene);length=max(8,duration+2)
  output=OUT/'segments'/f'{i+1:02d}.mp4'
  # Keep the screenshot steady and use a short fade; highlights stay readable.
  command=[FFMPEG,'-y','-hide_banner','-loglevel','error','-loop','1','-framerate','15','-i',str(image),'-i',str(sound),'-vf',f'fade=t=in:st=0:d=0.3,fade=t=out:st={length-0.3}:d=0.3','-af','adelay=600,apad','-t',str(length),'-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-ar','44100','-movflags','+faststart',str(output)]
  subprocess.run(command,check=True)
  chapters.append({'start':round(time,2),'duration':round(length,2),'title':scene['title'],'file':scene['file']});time+=length
  concat.append("file 'segments/"+output.name+"'")
  print(f'{i+1}/{len(SCENES)} ready · {length:.1f}s',flush=True)
 (OUT/'concat.txt').write_text('\n'.join(concat)+'\n')
 final=OUT/'Tailor-Master-Walkthrough.mp4'
 subprocess.run([FFMPEG,'-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(OUT/'concat.txt'),'-c','copy','-movflags','+faststart',str(final)],check=True)
 (OUT/'chapters.json').write_text(json.dumps(chapters,ensure_ascii=False,indent=2))
 (OUT/'transcript.md').write_text('# Tailor Master walkthrough\n\nHindi synthetic narration, Roman Urdu captions, real app screenshots.\n\n'+'\n\n'.join(f"## {i+1}. {s['title']}\n\n{s['caption']}\n\n{s['hindi']}" for i,s in enumerate(SCENES)))
 print(json.dumps({'video':str(final),'seconds':round(time,2),'scenes':len(SCENES),'bytes':final.stat().st_size}),flush=True)
if __name__=='__main__':main()
