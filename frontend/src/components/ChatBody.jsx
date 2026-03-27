import './ChatBody.css';

function ChatBody({ variant = 'desktop', actions = [], size = 'desktop', messages = [] }) {
  if (variant === 'landing') {
    return null;
  }

  if (variant === 'mobile') {
    return (
      <div className="chat-body-mobile">
        <div className="chat-mobile-card muted">
          Based on the Market_Report.pdf, the key growth drivers for Q3 are decentralized infrastructure and AI-driven
          automation.
        </div>

        <div className="chat-mobile-card">
          Can you cross-reference this with the user interview notes? I want to see if the qualitative data matches
          that growth figure.
        </div>

        <div className="chat-mobile-actions">
          {actions.map((action) => (
            <button key={action} type="button" className="chat-action-pill">
              {action}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (messages.length > 0) {
    return (
      <div className="chat-body-desktop">
        {messages.map((message) => (
          <ChatBubble key={message.id} align={message.role === 'user' ? 'end' : 'start'}>
            {message.text}
          </ChatBubble>
        ))}
      </div>
    );
  }

  return (
    <div className="chat-body-desktop">
      <ChatBubble align="end">
        Can you summarize the core trends in sustainable packaging from the Market_Report.pdf? Also, what does it say
        about the YoY growth for consumer interest?
      </ChatBubble>

      <ChatBubble align="start">
        <p>
          Based on the <span className="chat-note">Market_Report.pdf</span>, the core trends involve transition from
          single-use plastics to biodegradable options.
        </p>

        <ul className="chat-list">
          <li>Increased adoption of mushroom-based packaging for electronics.</li>
          <li>Regulatory shifts in the EU mandating 30% recycled content by 2026.</li>
          <li>Circular economy partnerships between retailers and waste management firms.</li>
        </ul>

        <div className="chat-quote">
          "Consumer interest in sustainable packaging has grown by 15% YoY, particularly among Gen Z and Millennial
          demographics."
        </div>
      </ChatBubble>

      <ChatBubble align="end">
        That's great. Can you generate a summary for our internal memo and create some flashcards for the sales team
        training?
      </ChatBubble>
    </div>
  );
}

function ChatBubble({ children, align }) {
  return (
    <div className={align === 'end' ? 'chat-bubble-row end' : 'chat-bubble-row start'}>
      <div className={align === 'end' ? 'chat-bubble end' : 'chat-bubble start'}>{children}</div>
    </div>
  );
}

export default ChatBody;
