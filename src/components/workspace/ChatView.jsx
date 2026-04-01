import ChatPane from './ChatPane'

export default function ChatView({ messages, isStreaming, onSend, onSaveArtifact, onOpenArtifact, inputPrefill, onNew }) {
  return (
    <div style={{ height: '100%' }}>
      <ChatPane
        messages={messages}
        isStreaming={isStreaming}
        onSend={onSend}
        onSaveArtifact={onSaveArtifact}
        onOpenArtifact={onOpenArtifact}
        inputPrefill={inputPrefill}
        onNew={onNew}
      />
    </div>
  )
}
