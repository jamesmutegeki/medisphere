import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

export default function LiveChat() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-black text-white dark:bg-white dark:text-black shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center animate-pulse-glow"
        aria-label="Open live chat"
      >
        <MessageCircle size={24} />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between p-4 bg-black dark:bg-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-black/20 flex items-center justify-center">
                <MessageCircle size={16} className="text-white dark:text-black" />
              </div>
              <div>
                <div className="text-white dark:text-black text-sm font-medium">CCP Digest Chat</div>
                <div className="text-xs text-white/70 dark:text-black/60">Online — Usually replies in minutes</div>
              </div>
            </div>
            <button onClick={() => { setOpen(false); setSent(false); }} className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-black/10 transition-colors" aria-label="Close chat">
              <X size={18} className="text-white dark:text-black" />
            </button>
          </div>
          <div className="p-4 h-64 overflow-y-auto">
            {sent ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
                  <Send size={18} className="text-black dark:text-white" />
                </div>
                <p className="text-sm font-medium text-black dark:text-white">Message Sent!</p>
                <p className="text-xs text-neutral-500 mt-1">We&apos;ll get back to you shortly.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl rounded-tl-none p-3 max-w-[80%]">
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">Hello! How can we help you today? Feel free to ask about our legal services.</p>
                </div>
              </div>
            )}
          </div>
          {!sent && (
            <form
              onSubmit={(e) => { e.preventDefault(); if (message.trim()) setSent(true); }}
              className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex gap-2"
            >
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                aria-label="Chat message"
              />
              <button type="submit" className="p-2 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors" aria-label="Send message">
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
