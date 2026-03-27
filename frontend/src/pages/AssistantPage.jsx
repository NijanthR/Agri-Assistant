import { useEffect, useState } from 'react';
import ChatBody from '../components/ChatBody';
import ChatInput from '../components/ChatInput';

const AssistantPage = () => {
  const [message, setMessage] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('gemini-2.5-flash');
  const [audioFile, setAudioFile] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: 'Hello! Ask anything about your farm. Press Enter to send your message.',
    },
  ]);
  const [lastSent, setLastSent] = useState(null);

  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && attachedFiles.length === 0 && !audioFile) return;

    let messageText = trimmedMessage;
    if (!messageText) {
      const parts = [];
      if (attachedFiles.length > 0) parts.push(`${attachedFiles.length} file(s) attached`);
      if (audioFile) parts.push('voice recording attached');
      messageText = parts.join(' and ');
    }

    setChatMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text: messageText,
      },
    ]);

    setLastSent({
      message: trimmedMessage,
      filesCount: attachedFiles.length,
      hasAudio: Boolean(audioFile),
      model: selectedModelId,
    });

    setMessage('');
    setAttachedFiles([]);

    if (audioFile?.url) {
      URL.revokeObjectURL(audioFile.url);
    }
    setAudioFile(null);
  };

  const handleAudioRecorded = (recording) => {
    if (audioFile?.url) {
      URL.revokeObjectURL(audioFile.url);
    }
    setAudioFile(recording);
  };

  const handleRemoveAudio = () => {
    if (audioFile?.url) {
      URL.revokeObjectURL(audioFile.url);
    }
    setAudioFile(null);
  };

  useEffect(() => {
    return () => {
      if (audioFile?.url) {
        URL.revokeObjectURL(audioFile.url);
      }
    };
  }, [audioFile]);

  return (
    <section className="page-shell assistant-page">
      <div className="assistant-page-layout">
        <div className="assistant-page-header">
          <h2>Assistant</h2>
          <p>Ask crop, weather, pest, or market questions using text, files, or voice.</p>

          {lastSent && (
            <div className="assistant-last-sent">
              <strong>Last draft:</strong>
              <span>Model: {lastSent.model}</span>
              <span>Message: {lastSent.message || 'No text'}</span>
              <span>Files: {lastSent.filesCount}</span>
              <span>Audio: {lastSent.hasAudio ? 'Yes' : 'No'}</span>
            </div>
          )}
        </div>

        <ChatBody
          variant="desktop"
          actions={['Summarize this report', 'Create flashcards', 'Extract key numbers']}
          messages={chatMessages}
        />

        <ChatInput
          placeholder="Ask anything about your farm..."
          showAddButton
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onSubmit={handleSubmit}
          selectedModelId={selectedModelId}
          onModelChange={setSelectedModelId}
          audioFile={audioFile}
          onAudioRecorded={handleAudioRecorded}
          onRemoveAudio={handleRemoveAudio}
          attachedFiles={attachedFiles}
          onFilesAttached={(files) => setAttachedFiles((prev) => [...prev, ...files])}
          onRemoveFile={(index) =>
            setAttachedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))
          }
        />
      </div>
    </section>
  );
};

export default AssistantPage;
