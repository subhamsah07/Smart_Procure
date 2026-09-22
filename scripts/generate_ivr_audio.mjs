import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

function pcmToWav(pcmBuffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Generate telephone chime tone (pleasant 520Hz + 660Hz two-tone chime)
function generateChime(sampleRate = 24000) {
  const duration = 0.6; // 600ms
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(numSamples * 2);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    if (t < 0.25) {
      // First tone: 520Hz
      sample = Math.sin(2 * Math.PI * 523.25 * t) * (1 - t / 0.25) * 0.35;
    } else if (t > 0.28 && t < 0.58) {
      // Second tone: 660Hz
      const t2 = t - 0.28;
      sample = Math.sin(2 * Math.PI * 659.25 * t2) * (1 - t2 / 0.3) * 0.35;
    }
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(intSample, i * 2);
  }
  return buffer;
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No GEMINI_API_KEY in environment');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  const scriptText = `नमस्ते किसान भाइयों। 
महत्वपूर्ण सूचना: आईवीआर सेवा का उपयोग करने के लिए, सबसे पहले पोर्टल पर अपना 10 अंकों का मोबाइल नंबर रजिस्टर करना अनिवार्य है। 
एक बार मोबाइल नंबर रजिस्टर होने के बाद, आप बिना इंटरनेट और बिना स्मार्टफोन, किसी भी साधारण कीपैड फोन से हमारे टोल-फ्री नंबर 1800-180-1551 पर कभी भी मुफ्त कॉल कर सकते हैं। 
मंडी स्लॉट और टोकन बुक करने के लिए 1 दबाएं। 
लाइव कतार स्थिति जानने के लिए 2 दबाएं। 
सरकारी एमएसपी भाव जानने के लिए 3 दबाएं। 
बैंक भुगतान की स्थिति के लिए 4 दबाएं। 
मंडी अधिकारी सहायता के लिए 9 दबाएं। 
कॉल समाप्त होते ही टोकन का एसएमएस आपके रजिस्टर्ड मोबाइल पर आ जाएगा। धन्यवाद।`;

  console.log('Requesting high-quality Hindi IVR speech emphasizing first-step registration...');
  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [
      {
        parts: [
          {
            text: `Speak in clear, warm, friendly, authentic Indian Hindi as an official government mandi helpline IVR operator, clearly emphasizing that mobile registration is the essential first step: ${scriptText}`
          }
        ]
      }
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }
        }
      }
    }
  });

  const part = res.candidates?.[0]?.content?.parts?.[0];
  if (!part?.inlineData?.data) {
    throw new Error('No audio returned from Gemini TTS');
  }

  const rawPcm = Buffer.from(part.inlineData.data, 'base64');
  console.log('Received raw PCM audio bytes:', rawPcm.length);

  // Combine Chime + 200ms silence + Voice
  const chimePcm = generateChime(24000);
  const silencePcm = Buffer.alloc(24000 * 0.2 * 2); // 200ms silence
  const fullAudioPcm = Buffer.concat([chimePcm, silencePcm, rawPcm]);

  const wavBuffer = pcmToWav(fullAudioPcm, 24000, 1, 16);

  const outPath = path.resolve(process.cwd(), 'public', 'ivr-guide-hindi.wav');
  fs.writeFileSync(outPath, wavBuffer);
  console.log('SUCCESS: Written updated audio to', outPath, 'Total size:', wavBuffer.length, 'bytes');
}

main().catch(err => {
  console.error('TTS Generation Error:', err);
  process.exit(1);
});
