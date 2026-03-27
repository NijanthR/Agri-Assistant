import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiArrowUp,
  FiChevronDown,
  FiFile,
  FiImage,
  FiMic,
  FiMicOff,
  FiPaperclip,
  FiX,
} from 'react-icons/fi';
import './ChatInput.css';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', badge: 'Google' },
  { id: 'hf-llama3-8b', label: 'Llama 3 8B Instruct', badge: 'Hugging Face' },
];

function ChatInput({
  placeholder = 'Ask anything about farming...',
  showAddButton = false,
  containerClassName = '',
  inputClassName = '',
  buttonClassName = '',
  value = '',
  onChange,
  onSubmit,
  selectedModelId,
  onModelChange,
  audioFile,
  onAudioRecorded,
  onRemoveAudio,
  attachedFiles = [],
  onFilesAttached,
  onRemoveFile,
}) {
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const recordingSecondsRef = useRef(0);

  const selectedModel = MODELS.find((model) => model.id === selectedModelId) || MODELS[0];

  const imagePreviewUrls = useMemo(
    () => attachedFiles.map((file) => (file.type.startsWith('image/') ? URL.createObjectURL(file) : null)),
    [attachedFiles],
  );

  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [imagePreviewUrls]);

  useEffect(() => {
    recordingSecondsRef.current = recordingSeconds;
  }, [recordingSeconds]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    clearInterval(timerRef.current);
  }, []);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      alert('Audio recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      setRecordingSeconds(0);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const finalType = mimeType || recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalType });
        const url = URL.createObjectURL(blob);
        onAudioRecorded?.({ blob, url, mimeType: finalType, duration: recordingSecondsRef.current });
        setIsRecording(false);
        clearInterval(timerRef.current);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch (error) {
      console.error('Microphone access denied:', error);
      alert('Microphone access was denied. Please allow microphone access and try again.');
    }
  }, [isRecording, onAudioRecorded, stopRecording]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const canSubmit = !!value.trim() || attachedFiles.length > 0 || Boolean(audioFile);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length) onFilesAttached?.(files);
    event.target.value = '';
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (canSubmit) onSubmit?.();
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <FiImage className="chat-chip-file-icon" />;
    return <FiFile className="chat-chip-file-icon" />;
  };

  return (
    <div className={`chat-input ${containerClassName}`}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx"
        className="chat-hidden-input"
        onChange={handleFileChange}
      />

      {attachedFiles.length > 0 && (
        <div className="chat-chips-wrap">
          {attachedFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="chat-chip">
              {file.type.startsWith('image/') && imagePreviewUrls[index] ? (
                <img src={imagePreviewUrls[index]} alt={file.name} className="chat-chip-image" />
              ) : (
                <span className="chat-chip-icon-wrap">{getFileIcon(file)}</span>
              )}

              <span className="chat-chip-name">{file.name}</span>
              <button
                type="button"
                onClick={() => onRemoveFile?.(index)}
                className="chat-chip-remove"
                title="Remove file"
              >
                <FiX />
              </button>
            </div>
          ))}
        </div>
      )}

      {audioFile && (
        <div className="chat-audio-chip">
          <div className="chat-audio-left">
            <div className="chat-audio-icon-wrap">
              <FiMic />
            </div>

            <div className="chat-audio-meta">
              <p>Voice recording</p>
              <small>{formatDuration(audioFile.duration ?? 0)}</small>
            </div>

            <audio controls className="chat-audio-player">
              <source src={audioFile.url} type={audioFile.mimeType} />
            </audio>
          </div>

          <button type="button" onClick={onRemoveAudio} className="chat-chip-remove" title="Remove recording">
            <FiX />
          </button>
        </div>
      )}

      {isRecording ? (
        <div className="chat-recording-indicator">
          <span className="chat-recording-dot" />
          <span>Recording... {formatDuration(recordingSeconds)}</span>
        </div>
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          className={`chat-text-input ${inputClassName}`}
        />
      )}

      <div className="chat-actions-row">
        <div className="chat-actions-left">
          {showAddButton && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach files"
              className={`chat-icon-btn ${buttonClassName}`}
            >
              <FiPaperclip />
            </button>
          )}
        </div>

        <div className="chat-actions-right">
          <div className="chat-model-wrap" ref={dropdownRef}>
            <button type="button" onClick={() => setOpen((prev) => !prev)} className="chat-model-btn">
              {selectedModel.label}
              <FiChevronDown className={open ? 'chat-chevron-open' : ''} />
            </button>

            {open && (
              <div className="chat-model-dropdown">
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onModelChange?.(model.id);
                      setOpen(false);
                    }}
                    className={selectedModel.id === model.id ? 'chat-model-item active' : 'chat-model-item'}
                  >
                    <span>{model.label}</span>
                    <span className="chat-model-badge">{model.badge}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleRecording}
            title={isRecording ? 'Stop recording' : 'Record audio'}
            className={isRecording ? 'chat-icon-btn record-on' : 'chat-icon-btn'}
          >
            {isRecording ? (
              <>
                <FiMicOff />
                <span className="chat-record-ping" />
              </>
            ) : (
              <FiMic />
            )}
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={canSubmit ? 'chat-send-btn' : 'chat-send-btn disabled'}
            aria-label="Send"
          >
            <FiArrowUp />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
