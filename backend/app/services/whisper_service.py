import logging
import whisper
import tempfile
import os

logger = logging.getLogger(__name__)
_whisper_model = None


def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        _whisper_model = whisper.load_model("base")
        logger.info("Whisper model loaded: base")
    return _whisper_model


def transcribe_audio(audio_bytes: bytes, suffix: str = ".mp3") -> str:
    """Transcribe audio bytes to text."""
    model = get_whisper_model()
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
    try:
        result = model.transcribe(tmp_path, language="en", fp16=False)
        return result["text"].strip()
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise
    finally:
        os.unlink(tmp_path)
