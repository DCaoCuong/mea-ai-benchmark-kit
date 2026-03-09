import os
import time
import asyncio
import numpy as np
import miniaudio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import logging

# Set logging to avoid too much clutter but see important stuff
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("whisper_live_server")

from whisperlivekit import TranscriptionEngine, AudioProcessor
from whisperlivekit.config import WhisperLiveKitConfig

app = FastAPI(title="WhisperLiveKit Benchmark Server")

class LocalInferenceRequest(BaseModel):
    file_path: str
    language: str = "vi"
    model_size: str = "small"

# Global engine
engine = None

def get_engine(model_size="small", language="vi"):
    global engine
    if engine is None:
        logger.info(f"🚀 Initializing WhisperLiveKit Engine (model={model_size}, lang={language})...")
        engine = TranscriptionEngine(model_size=model_size, lan=language)
    return engine

@app.post("/inference-local")
async def inference_local(req: LocalInferenceRequest):
    if not os.path.exists(req.file_path):
        raise HTTPException(status_code=400, detail=f"File not found: {req.file_path}")

    start_time = time.time()
    
    try:
        # 1. Load Audio
        logger.info(f"📂 Loading audio: {req.file_path}")
        decoded = miniaudio.mp3_read_file_f32(req.file_path)
        audio = np.array(decoded.samples, dtype=np.float32)
        if decoded.nchannels > 1:
            audio = audio.reshape(-1, decoded.nchannels).mean(axis=1)
        
        # Resample to 16kHz
        if decoded.sample_rate != 16000:
            target_length = int(len(audio) * 16000 / decoded.sample_rate)
            audio = np.interp(np.linspace(0, len(audio), target_length), np.arange(len(audio)), audio)
        
        # Convert to s16le bytes
        pcm_bytes = (audio * 32767).astype(np.int16).tobytes()
        
        # 2. Process with WLK
        # Note: TranscriptionEngine is a singleton, so we use the global one
        current_engine = get_engine(req.model_size, req.language)
        
        # Create a new processor for this request
        processor = AudioProcessor(transcription_engine=current_engine, pcm_input=True)
        
        final_text = ""
        
        # create_tasks starts technical background loops
        results_gen = await processor.create_tasks()
        
        # Feed audio (all at once for benchmark speed, but processed in chunks internally)
        await processor.process_audio(pcm_bytes)
        await processor.process_audio(None) # EOF
        
        # Collect results
        async for data in results_gen:
            if data.status == "error":
                logger.error(f"WLK Processor Error: {data.error}")
                continue
                
            if data.lines:
                # data.lines contains Segment objects with .text
                # We join them into a full transcript
                final_text = " ".join([seg.text for seg in data.lines]).strip()
            elif data.buffer_transcription:
                # Sometimes progress is only in the buffer
                # For final result, we want the lines, but we can append buffer if lines are empty
                if not final_text:
                    final_text = data.buffer_transcription

        # Important cleanup
        await processor.cleanup()
        
        process_time = time.time() - start_time
        
        return {
            "text": final_text,
            "meta": {
                "process_time": process_time,
                "engine": "whisperlivekit",
                "model": req.model_size
            }
        }
        
    except Exception as e:
        logger.exception("Inference failed")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok", "engine": "whisperlivekit"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8083)
