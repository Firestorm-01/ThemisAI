import logging
import tempfile
import os

logger = logging.getLogger(__name__)
_whisper_model = None

# Set ENABLE_VOICE=false in Render env vars to skip Whisper entirely
VOICE_ENABLED = os.getenv("ENABLE_VOICE", "true").lower() == "true"


def get_whisper_model():
    global _whisper_model
    if not VOICE_ENABLED:
        return None
    if _whisper_model is None:
        import whisper
        _whisper_model = whisper.load_model("base")
        logger.info("Whisper model loaded: base")
    return _whisper_model


def transcribe_audio(audio_bytes: bytes, suffix: str = ".mp3") -> str:
    """Transcribe audio bytes to text. Raises RuntimeError if voice is disabled."""
    if not VOICE_ENABLED:
        raise RuntimeError("Voice queries are disabled in this deployment.")
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