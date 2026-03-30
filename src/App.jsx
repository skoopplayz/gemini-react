import React, { useState, useEffect, useRef } from 'react';
import { 
Send, 
Trash2, 
Settings, 
BookOpen, 
User, 
Bot, 
ChevronRight, 
RotateCcw,
PlusCircle,
Menu,
X,
Zap,
Cpu
} from 'lucide-react';

// New API Configs
const API_KEYS_URL = "https://groq-api-keys.pages.dev/apikeys.txt";
const MODEL_NAMES = { 
"llama-3.1-8b-instant": "Llama 3.1 8B", 
"llama-3.3-70b-versatile": "Llama 3.3 70B" 
};

const App = () => {
const [messages, setMessages] = useState([
{ role: 'ai', content: "Hello! I'm your AI tutor. I'm ready to help you with your studies in a safe and supportive way. What subject are we working on today?" }
]);
const [input, setInput] = useState('');
const [isThinking, setIsThinking] = useState(false);
const [subject, setSubject] = useState('Mathematics');
const [grade, setGrade] = useState('High School');
const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
const [apiKeys, setApiKeys] = useState([]);
const [isSidebarOpen, setIsSidebarOpen] = useState(true);

const messagesEndRef = useRef(null);
const inputRef = useRef(null);

// Webkit-friendly Scroll and Layout fixes
const scrollToBottom = () => {
messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
};

useEffect(() => {
scrollToBottom();
}, [messages, isThinking]);

// Fetch API Keys from the new URL
useEffect(() => {
const fetchApiKeys = async () => {
try {
const response = await fetch(API_KEYS_URL);
const text = await response.text();
const keys = text.split('\n')
.map(k => k.trim())
.filter(k => k.length > 0 && !k.startsWith('#'));
setApiKeys(keys);
} catch (error) {
console.error("Error fetching API keys:", error);
}
};
fetchApiKeys();
}, []);

// API Call using Groq endpoint with Exponential Backoff
const callGroq = async (query, systemPrompt) => {
if (apiKeys.length === 0) throw new Error("No API keys available.");

// Pick a random key from the pool
const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

let retries = 0;
const maxRetries = 5;
const delays = [1000, 2000, 4000, 8000, 16000];

while (retries < maxRetries) {
try {
const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
method: 'POST',
headers: { 
'Content-Type': 'application/json',
'Authorization': `Bearer ${apiKey}`
},
body: JSON.stringify({
model: selectedModel,
messages: [
{ role: "system", content: systemPrompt },
{ role: "user", content: query }
],
temperature: 0.7,
max_tokens: 1024
})
});

if (!response.ok) {
const errorData = await response.json();
// Handle rate limits or key issues
if (response.status === 429 || response.status === 401) {
throw new Error("Retryable error");
}
throw new Error(`HTTP Error ${response.status}`);
}

const data = await response.json();
return data.choices?.[0]?.message?.content || "I couldn't generate a response.";
} catch (err) {
retries++;
if (retries === maxRetries) throw err;
await new Promise(r => setTimeout(r, delays[retries - 1]));
}
}
};

const handleSend = async () => {
if (!input.trim() || isThinking) return;

const userMessage = input.trim();
setInput('');
setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
setIsThinking(true);

// Safeguard: Strict instructions for under-18 safety
const systemPrompt = `You are a helpful, safe, and encouraging ${subject} tutor for a ${grade} student. 
Explain concepts clearly. Use Markdown for formatting. 
IMPORTANT: The user is under 18. Maintain a strictly clean, age-appropriate, and healthy tone. 
Absolutely avoid any harmful, illegal, suggestive, or mature topics (drugs, violence, etc). 
Focus entirely on education and positive support.`;

try {
const aiResponse = await callGroq(userMessage, systemPrompt);
setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
} catch (err) {
setMessages(prev => [...prev, { role: 'ai', content: "I'm having a little trouble connecting to my knowledge base. Please check your connection and try again in a moment!" }]);
} finally {
setIsThinking(false);
inputRef.current?.focus();
}
};

const clearChat = () => {
setMessages([{ role: 'ai', content: "Fresh start! What's our next learning goal?" }]);
};

return (
<div className="flex h-screen bg-[#212121] text-gray-100 font-sans selection:bg-emerald-500/30 overflow-hidden">

{/* Mobile Menu Toggle - Webkit optimized touch target */}
<button 
onClick={() => setIsSidebarOpen(!isSidebarOpen)}
className="fixed top-4 left-4 z-50 p-3 bg-[#2f2f2f] rounded-xl md:hidden border border-white/10 active:scale-95 transition-transform"
style={{ WebkitTapHighlightColor: 'transparent' }}
>
{isSidebarOpen ? <X size={20}/> : <Menu size={20}/>}
</button>

{/* Sidebar - Webkit smooth transitions */}
<aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:relative md:translate-x-0 z-40 w-72 h-full bg-[#171717] transition-transform duration-300 ease-in-out border-r border-white/5 flex flex-col shadow-2xl md:shadow-none`}>
<div className="p-4 flex flex-col h-full">
<button 
onClick={clearChat}
className="flex items-center gap-3 w-full p-3 rounded-xl border border-white/10 hover:bg-[#2f2f2f] transition-all mb-8 mt-12 md:mt-0 active:bg-white/5"
style={{ WebkitAppearance: 'none' }}
>
<PlusCircle size={18} className="text-emerald-400" />
<span className="text-sm font-medium">New Session</span>
</button>

<div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
<div>
<label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] px-2 mb-3 block">Model Engine</label>
<div className="px-2 space-y-2">
{Object.entries(MODEL_NAMES).map(([id, name]) => (
<button
key={id}
onClick={() => setSelectedModel(id)}
className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-xs transition-all border ${
selectedModel === id 
? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
: 'bg-transparent border-transparent text-gray-400 hover:bg-white/5'
}`}
>
{id.includes('70b') ? <Cpu size={14} /> : <Zap size={14} />}
{name}
</button>
))}
</div>
</div>

<div>
<label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] px-2 mb-3 block">Tutor Settings</label>
<div className="space-y-4 px-2">
<div className="group">
<span className="text-[11px] text-gray-500 mb-1.5 block ml-1 group-focus-within:text-emerald-400 transition-colors">Subject</span>
<select 
value={subject} 
onChange={(e) => setSubject(e.target.value)}
className="w-full bg-[#2f2f2f] border border-white/10 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer"
style={{ WebkitAppearance: 'none' }}
>
<option>Mathematics</option>
<option>Science</option>
<option>History</option>
<option>English Literature</option>
<option>Computer Science</option>
</select>
</div>
<div>
<span className="text-[11px] text-gray-500 mb-1.5 block ml-1">Grade Level</span>
<select 
value={grade} 
onChange={(e) => setGrade(e.target.value)}
className="w-full bg-[#2f2f2f] border border-white/10 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer"
style={{ WebkitAppearance: 'none' }}
>
<option>Middle School</option>
<option>High School</option>
<option>College</option>
</select>
</div>
</div>
</div>

<div>
<label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] px-2 mb-3 block">System</label>
<div className="px-2">
<div className="flex items-center justify-between text-[11px] bg-white/5 p-3 rounded-xl border border-white/5">
<span className="text-gray-400">API Status</span>
<span className={apiKeys.length > 0 ? "text-emerald-400 flex items-center gap-1" : "text-amber-400 flex items-center gap-1"}>
<div className={`w-1.5 h-1.5 rounded-full ${apiKeys.length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
{apiKeys.length} Keys
</span>
</div>
</div>
</div>
</div>

<div className="pt-4 border-t border-white/5">
<div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 text-sm text-gray-400">
<div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-900/20">S</div>
<div className="flex-1 overflow-hidden">
<p className="truncate text-white font-medium">Student Learner</p>
<p className="text-[10px] uppercase tracking-wider opacity-60">Verified Account</p>
</div>
</div>
</div>
</div>
</aside>

{/* Main Content */}
<main className="flex-1 flex flex-col relative bg-[#212121] overflow-hidden">

{/* Chat Header - Webkit blur support */}
<header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-[#212121]/80 backdrop-blur-xl sticky top-0 z-30">
<div className="md:invisible w-10" /> {/* Spacer for mobile toggle */}
<h2 className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
{subject} <span className="text-gray-600 mx-2">|</span> <span className="text-emerald-400">{MODEL_NAMES[selectedModel]}</span>
</h2>
<div className="w-10 flex justify-end">
<div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
</div>
</header>

{/* Messages Container - Webkit optimized scrolling */}
<div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
<div className="max-w-3xl mx-auto py-8 px-4 md:px-6">
{messages.map((msg, i) => (
<div 
key={i} 
className={`flex gap-4 md:gap-6 py-8 border-b border-white/5 last:border-0 group animate-in fade-in duration-500`}
>
<div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'ai' ? 'bg-emerald-600' : 'bg-[#3a3a3a]'}`}>
{msg.role === 'ai' ? <Bot size={20} className="text-white" /> : <User size={20} className="text-gray-300" />}
</div>
<div className="flex-1 space-y-2 overflow-hidden">
<p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
{msg.role === 'ai' ? 'StudyGuide AI' : 'Student'}
</p>
<div className="text-[15px] text-gray-200 leading-relaxed whitespace-pre-wrap break-words prose prose-invert prose-sm max-w-none">
{msg.content}
</div>
</div>
</div>
))}
{isThinking && (
<div className="flex gap-4 md:gap-6 py-8">
<div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-lg animate-pulse">
<Bot size={20} className="text-white" />
</div>
<div className="flex items-center gap-1.5 mt-6 ml-1">
<div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
<div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
<div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce"></div>
</div>
</div>
)}
<div ref={messagesEndRef} />
</div>
</div>

{/* Input Footer - Webkit button and input styling */}
<div className="w-full max-w-3xl mx-auto p-4 md:pb-10 relative z-20">
<div className="relative flex flex-col w-full bg-[#2f2f2f] rounded-2xl border border-white/10 shadow-2xl focus-within:border-emerald-500/30 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all duration-300 overflow-hidden">
<textarea
ref={inputRef}
rows="1"
value={input}
onChange={(e) => setInput(e.target.value)}
onKeyDown={(e) => {
if (e.key === 'Enter' && !e.shiftKey) {
e.preventDefault();
handleSend();
}
}}
placeholder={`Ask a question about ${subject.toLowerCase()}...`}
className="w-full bg-transparent text-gray-100 p-4 pr-14 resize-none outline-none max-h-48 text-[15px] placeholder:text-gray-500"
style={{ height: 'auto', minHeight: '60px', WebkitAppearance: 'none' }}
/>
<button 
onClick={handleSend}
disabled={!input.trim() || isThinking}
className={`absolute right-3 bottom-3 p-2.5 rounded-xl transition-all duration-200 active:scale-90 ${
input.trim() && !isThinking 
? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400' 
: 'bg-white/5 text-gray-600 cursor-not-allowed'
}`}
style={{ WebkitAppearance: 'none', WebkitTapHighlightColor: 'transparent' }}
>
<Send size={18} strokeWidth={2.5} />
</button>
</div>
<div className="flex justify-center mt-3">
<div className="bg-white/5 px-3 py-1 rounded-full border border-white/5">
<p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">
Educational Mode Active <span className="text-emerald-500 mx-1">•</span> Pure Learning
</p>
</div>
</div>
</div>
</main>

<style dangerouslySetInnerHTML={{ __html: `
.custom-scrollbar::-webkit-scrollbar {
width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
background: rgba(255, 255, 255, 0.1);
border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
background: rgba(255, 255, 255, 0.2);
}
/* Fix for Webkit select icons */
select {
background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
background-repeat: no-repeat;
background-position: right 0.75rem center;
background-size: 1rem;
}
`}} />
</div>
);
};

export default App;
