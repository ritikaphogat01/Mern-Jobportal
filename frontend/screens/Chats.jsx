
import React, { useState, useEffect, useRef } from 'react';

export const Chats = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch('/api/conversations')
      .then(r => r.json())
      .then(data => { setConversations(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openConversation = async (conv) => {
    setActiveConv(conv);
    setMessages([]);
    setMsgLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conv._id}/messages`);
      const data = await res.json();
      setMessages(data);
      if (conv.unread) {
        await fetch(`/api/conversations/${conv._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unread: false }) });
        setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, unread: false } : c));
      }
    } catch (e) { console.error(e); }
    finally { setMsgLoading(false); }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || !activeConv || sending) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${activeConv._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'me', text })
      });
      if (res.ok) {
        const saved = await res.json();
        setMessages(prev => [...prev, saved]);
        setConversations(prev => prev.map(c => c._id === activeConv._id ? { ...c, lastMessage: text, lastMessageTime: saved.time } : c));
        setTimeout(async () => {
          const auto = await fetch(`/api/conversations/${activeConv._id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender: 'them', text: getAutoReply(text) })
          });
          if (auto.ok) {
            const autoMsg = await auto.json();
            setMessages(prev => [...prev, autoMsg]);
          }
        }, 1200);
      }
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const getAutoReply = (msg) => {
    const replies = [
      'Thanks for reaching out! We will review your profile shortly.',
      'Great! Our team will get back to you within 24 hours.',
      'Noted. Can you please share your availability for a quick call?',
      'Thank you for your message. We are very interested in your profile!',
      'We have received your message. Expect a reply soon.',
      'That sounds great! We will coordinate further details via email.',
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  };

  if (activeConv) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col z-50 animate-fade-in max-w-md mx-auto">
        <header className="glass px-5 py-4 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100/50">
          <button onClick={() => setActiveConv(null)} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-accent active:scale-90 transition-all">
            <span className="material-icons-round">arrow_back</span>
          </button>
          <div className="relative">
            {activeConv.participantAvatar ? (
              <img src={activeConv.participantAvatar} alt="" className="w-10 h-10 rounded-2xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-primary-soft flex items-center justify-center">
                <span className="material-icons-round text-primary">person</span>
              </div>
            )}
            {activeConv.online && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-accent text-sm truncate">{activeConv.participantName}</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide truncate">{activeConv.participantRole}</p>
          </div>
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500 border border-gray-100">
              <span className="material-icons-round text-sm">call</span>
            </button>
            <button className="w-9 h-9 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500 border border-gray-100">
              <span className="material-icons-round text-sm">info</span>
            </button>
          </div>
        </header>

        <div className="mx-4 mt-3 p-3 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-3">
          <span className="material-icons-round text-primary text-sm">work</span>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-primary uppercase tracking-widest">Application</p>
            <p className="text-xs font-bold text-accent truncate">{activeConv.jobTitle}</p>
          </div>
          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${
            activeConv.applicationStatus === 'Offer Sent' ? 'bg-emerald-50 text-emerald-600' :
            activeConv.applicationStatus === 'Interview Scheduled' ? 'bg-blue-50 text-blue-600' :
            'bg-yellow-50 text-yellow-600'
          }`}>{activeConv.applicationStatus}</span>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
          {msgLoading && (
            <div className="flex justify-center py-8">
              <span className="material-icons-round text-primary animate-spin text-2xl">autorenew</span>
            </div>
          )}
          {!msgLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="material-icons-round text-gray-200 text-5xl mb-3">forum</span>
              <p className="text-gray-400 font-bold text-sm">No messages yet. Say hello!</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg._id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {msg.sender === 'them' && (
                <div className="w-7 h-7 rounded-xl bg-primary-soft flex items-center justify-center mr-2 flex-shrink-0 self-end">
                  <span className="material-icons-round text-primary text-sm">person</span>
                </div>
              )}
              <div className={`max-w-[75%] px-4 py-3 rounded-3xl ${
                msg.sender === 'me'
                  ? 'bg-primary text-white rounded-br-lg shadow-lg shadow-primary/20'
                  : 'bg-white text-accent border border-gray-100 shadow-card rounded-bl-lg'
              }`}>
                <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                <p className={`text-[9px] font-bold mt-1 ${msg.sender === 'me' ? 'text-white/60 text-right' : 'text-gray-400'}`}>{msg.time}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-4 py-4 bg-white border-t border-gray-100 safe-bottom flex items-center gap-3">
          <div className="flex-1 flex items-center bg-gray-50 rounded-2xl border border-gray-100 px-4 py-3 gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm font-medium text-accent placeholder-gray-400 outline-none"
            />
            <button className="text-gray-400 hover:text-primary transition-colors">
              <span className="material-icons-round text-sm">attach_file</span>
            </button>
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || sending}
            className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-all disabled:opacity-50"
          >
            {sending ? (
              <span className="material-icons-round text-sm animate-spin">autorenew</span>
            ) : (
              <span className="material-icons-round">send</span>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-32 min-h-screen bg-background">
      <header className="glass px-6 pt-8 pb-5 sticky top-0 z-30 border-b border-gray-100/50">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-black text-accent tracking-tight">Messages</h1>
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1">Direct Recruiter Access</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm">
            <span className="material-icons-round text-primary">forum</span>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {loading && (
          <div className="flex justify-center py-20">
            <span className="material-icons-round text-primary text-3xl animate-spin">autorenew</span>
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mb-6 border border-gray-100">
              <span className="material-icons-round text-gray-300 text-4xl">forum</span>
            </div>
            <h3 className="text-lg font-display font-black text-gray-900 mb-2">No Messages Yet</h3>
            <p className="text-sm text-gray-400 font-medium px-8">Apply to jobs and recruiters will reach out to you here.</p>
          </div>
        )}

        {conversations.map(chat => (
          <div key={chat._id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-card overflow-hidden active:scale-[0.98] transition-all">
            <div className="p-5 flex items-center gap-4">
              <div className="relative shrink-0">
                {chat.participantAvatar ? (
                  <img src={chat.participantAvatar} alt="" className="w-14 h-14 rounded-2xl object-cover border border-gray-100" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-primary-soft flex items-center justify-center border border-primary/10">
                    <span className="material-icons-round text-primary text-2xl">person</span>
                  </div>
                )}
                {chat.online && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className={`font-bold text-accent truncate ${chat.unread ? 'text-primary' : ''}`}>{chat.participantName}</h3>
                  <span className="text-[10px] font-bold text-gray-400 uppercase flex-shrink-0 ml-2">{chat.lastMessageTime}</span>
                </div>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wide truncate">{chat.participantRole}</p>
              </div>
              {chat.unread && <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>}
            </div>

            <div className="mx-5 p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Applying for</p>
                <h4 className="text-sm font-bold text-accent truncate">{chat.jobTitle}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-gray-500">{chat.jobSalary}</span>
                  {chat.applicationStatus && <>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className={`text-[10px] font-bold ${
                      chat.applicationStatus === 'Offer Sent' ? 'text-emerald-600' :
                      chat.applicationStatus === 'Interview Scheduled' ? 'text-blue-600' :
                      'text-yellow-600'
                    }`}>{chat.applicationStatus}</span>
                  </>}
                </div>
              </div>
            </div>

            <div className="p-5">
              {chat.lastMessage && (
                <p className={`text-[13px] line-clamp-1 mb-4 ${chat.unread ? 'text-accent font-semibold' : 'text-gray-500 font-medium'}`}>
                  {chat.lastMessage}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => openConversation(chat)}
                  className="flex-1 py-4 bg-primary text-white rounded-xl text-[12px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-icons-round text-sm">chat</span>
                  Open Chat
                </button>
                <button className="flex-1 py-4 bg-accent text-white rounded-xl text-[12px] font-bold uppercase tracking-widest active:scale-95 transition-all">
                  View Job
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
