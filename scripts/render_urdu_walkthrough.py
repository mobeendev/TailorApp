"""Urdu-script walkthrough; never substitutes a non-Urdu voice."""
from pathlib import Path
import json, subprocess, re, asyncio, sys
from PIL import Image, ImageDraw, ImageFont, features
import edge_tts
import imageio_ffmpeg
import arabic_reshaper
from bidi.algorithm import get_display
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'artifacts/walkthrough'; OUT=SOURCE/'urdu';OUT.mkdir(exist_ok=True)
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
TEXT=json.loads((SOURCE/'urdu-text.json').read_text())
by_step={int(s['title'].split(' · ')[0]):s for s in json.loads((SOURCE/'scenes.json').read_text())}
ORDER=list(range(1,30))+[31,32,35,36,37,38,39,34,40,41,42,44,43,45]
FONT='/System/Library/Fonts/GeezaPro.ttc'
RAQM=features.check('raqm')
def font(size):return ImageFont.truetype(FONT,size)
def shaped(text):return text if RAQM else get_display(arabic_reshaper.reshape(text))
def opts():return {'direction':'rtl','language':'ur'} if RAQM else {}
def width(d,text,f):return d.textlength(shaped(text),font=f,**opts())
def lines(text,maxwidth,d,f):
 result=[];line=''
 for word in text.split():
  trial=(line+' '+word).strip()
  if width(d,trial,f)>maxwidth and line:result.append(line);line=word
  else:line=trial
 if line:result.append(line)
 return result
def text(d,xy,value,size,color):
 d.text(xy,shaped(value),font=font(size),fill=color,anchor='rt',**opts())
def plate(step,index):
 scene=by_step[step];title,caption=TEXT[str(step)]
 im=Image.new('RGB',(1600,900),'#102F2B');d=ImageDraw.Draw(im)
 for x in range(36,1600,30):d.line((x,28,x+7,28),fill='#8B784B')
 text(d,(1505,55),'ٹیلر ماسٹر، مکمل اردو رہنمائی',26,'#DEC18B')
 text(d,(500,57),'اصل ایپ کے مناظر',21,'#99B4A7')
 d.rounded_rectangle((64,101,500,839),radius=30,fill='#071D1B',outline='#6B765B',width=2)
 shot=Image.open(SOURCE/'frames'/scene['file']).convert('RGB');ox=oy=0
 if scene.get('crop'):ox,oy=scene['crop'][:2];shot=shot.crop(scene['crop'])
 scale=min(410/shot.width,710/shot.height);sw,sh=round(shot.width*scale),round(shot.height*scale);sx=282-sw//2;sy=470-sh//2
 im.paste(shot.resize((sw,sh),Image.Resampling.LANCZOS),(sx,sy))
 for box in scene.get('boxes',[]):
  x,y,bw,bh=box['x']-ox,box['y']-oy,box['w'],box['h']
  if x<0 or y<0 or y>=sh/scale or x>=sw/scale:continue
  x0,y0=sx+x*scale,sy+y*scale;x1,y1=min(sx+sw,x0+bw*scale),min(sy+sh,y0+bh*scale)
  if x1>x0 and y1>y0:d.rounded_rectangle((x0-4,y0-4,x1+4,y1+4),radius=8,outline='#EFBF5D',width=3)
 d.rounded_rectangle((567,116,1518,171),radius=11,fill='#1D443B')
 text(d,(1490,129),f'مرحلہ {index+1} از {len(ORDER)}، عملی رہنمائی'.translate(str.maketrans('0123456789','۰۱۲۳۴۵۶۷۸۹')),24,'#D7C08E')
 y=211
 for line in lines(title,880,d,font(45)):text(d,(1498,y),line,45,'#FAF4E7');y+=66
 d.line((1370,y+15,1498,y+15),fill='#B8975D',width=3);y+=50
 size=32;wrapped=lines(caption,880,d,font(size))
 while y+len(wrapped)*49>676:
  size-=1;wrapped=lines(caption,880,d,font(size))
  if size<25:raise RuntimeError('Caption does not fit')
 for line in wrapped:text(d,(1498,y),line,size,'#CCD9CD');y+=49
 d.rounded_rectangle((575,710,1508,804),radius=13,fill='#193D34',outline='#36574A',width=1)
 note='یہ الگ مشقی دکان ہے؛ پہلے والے ریکارڈ محفوظ ہیں۔' if scene.get('crop') else 'دیکھیں، سنیں اور اپنی دکان میں مشق کریں۔'
 text(d,(1485,722),note,23,'#DCC99F')
 text(d,(1485,764),'صرف فرضی معلومات؛ اپنے اصل ریکارڈ تبدیل نہ کریں۔',20,'#93B09D')
 text(d,(1500,838),'روایتی ہنر، ترتیب کا نیا انداز',23,'#A18D61')
 path=OUT/'plates'/f'{index+1:02d}.png';path.parent.mkdir(exist_ok=True);im.save(path);return path
async def speech(step,index):
 path=OUT/'audio'/f'{index+1:02d}.mp3';path.parent.mkdir(exist_ok=True)
 script=TEXT[str(step)][1];(path.with_suffix('.txt')).write_text(script)
 if not path.exists() or path.stat().st_size<5000:
  await edge_tts.Communicate(script,'ur-PK-AsadNeural',rate='-8%').save(str(path))
 result=subprocess.run([FFMPEG,'-hide_banner','-i',str(path),'-f','null','-'],capture_output=True,text=True)
 match=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',result.stderr)
 if not match:raise RuntimeError('No Urdu narration audio')
 h,m,s=map(float,match.groups());duration=h*3600+m*60+s
 if duration<2:raise RuntimeError('Empty narration')
 return path,duration
async def main():
 (OUT/'segments').mkdir(exist_ok=True);chapters=[];elapsed=0;concat=[]
 for i,step in enumerate(ORDER):
  image=plate(step,i)
  if '--plates-only' in sys.argv:continue
  sound,duration=await speech(step,i);length=duration+2
  path=OUT/'segments'/f'{i+1:02d}.mp4'
  subprocess.run([FFMPEG,'-y','-hide_banner','-loglevel','error','-loop','1','-framerate','15','-i',str(image),'-i',str(sound),'-vf',f'fade=t=in:st=0:d=0.3,fade=t=out:st={length-0.3}:d=0.3','-af','adelay=600,apad','-t',str(length),'-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-ar','44100',str(path)],check=True)
  chapters.append({'start':round(elapsed,2),'duration':round(length,2),'title':TEXT[str(step)][0]});elapsed+=length;concat.append("file 'segments/"+path.name+"'")
  print(f'{i+1}/{len(ORDER)} Urdu scenes ready',flush=True)
 if '--plates-only' in sys.argv:return
 (OUT/'concat.txt').write_text('\n'.join(concat)+'\n')
 final=OUT/'Tailor-Master-Urdu-Walkthrough.mp4'
 subprocess.run([FFMPEG,'-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(OUT/'concat.txt'),'-c','copy','-metadata','title=ٹیلر ماسٹر — اردو رہنمائی','-metadata:s:a:0','language=urd','-movflags','+faststart',str(final)],check=True)
 (OUT/'chapters.json').write_text(json.dumps(chapters,ensure_ascii=False,indent=2))
 (OUT/'transcript.md').write_text('# ٹیلر ماسٹر، مکمل اردو رہنمائی\n\n'+'\n\n'.join(f'## {TEXT[str(s)][0]}\n\n{TEXT[str(s)][1]}' for s in ORDER))
 print(json.dumps({'video':str(final),'seconds':elapsed,'bytes':final.stat().st_size,'voice':'ur-PK-AsadNeural','raqm':RAQM}),flush=True)
if __name__=='__main__':asyncio.run(main())
