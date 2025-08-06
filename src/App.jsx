import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const defaultCharacters = [
  {
    id: "gandalf",
    name: "Гендальф",
    avatar: "https://i.imgur.com/YZ6z2cP.png",
    prompt: "Ты мудрый волшебник. Отвечай как Гендальф.",
  },
  {
    id: "sherlock",
    name: "Шерлок",
    avatar: "https://i.imgur.com/Ah4H4LO.png",
    prompt: "Ты Шерлок Холмс. Отвечай логично и кратко.",
  },
];

export default function App() {
  const [characters, setCharacters] = useState(() => {
    const stored = localStorage.getItem("characters");
    return stored ? JSON.parse(stored) : defaultCharacters;
  });

  const [activeId, setActiveId] = useState(characters[0].id);
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");

  const activeChar = characters.find((c) => c.id === activeId);
  const chat = messages[activeId] || [];

  const sendMessage = () => {
    if (!input.trim()) return;
    const newChat = [...chat, { role: "user", content: input }];
    setMessages({ ...messages, [activeId]: newChat });
    setInput("");

    if (window.Telegram?.WebApp?.sendData) {
      const payload = { character: activeChar.name, text: input };
      Telegram.WebApp.sendData(JSON.stringify(payload));
    }
  };

  const addCharacter = () => {
    const name = prompt("Имя персонажа:");
    if (!name) return;
    const promptText = prompt("Как должен говорить персонаж?") || "Ты персонаж.";
    const avatar = prompt("Ссылка на аватар:") || "https://placehold.co/40x40";
    const id = name.toLowerCase().replace(/[^a-z0-9]/gi, "");

    const newChar = { id, name, prompt: promptText, avatar };
    setCharacters((prev) => {
      const updated = [...prev, newChar];
      localStorage.setItem("characters", JSON.stringify(updated));
      return updated;
    });
    setActiveId(id);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-[280px] bg-[#f1f1f1] border-r border-gray-300">
        <div className="flex justify-between items-center p-3 border-b">
          <div className="font-bold text-lg">Чаты</div>
          <button onClick={addCharacter} className="text-xl">＋</button>
        </div>
        <ScrollArea className="h-[calc(100%-50px)]">
          {characters.map((char) => (
            <div
              key={char.id}
              className={`flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-200 ${
                char.id === activeId ? "bg-gray-300" : ""
              }`}
              onClick={() => setActiveId(char.id)}
            >
              <img src={char.avatar} className="w-10 h-10 rounded-full" />
              <div className="text-sm font-medium">{char.name}</div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex flex-col flex-1 bg-white">
        <div className="border-b p-3 font-semibold text-base bg-[#ededed]">
          {activeChar.name}
        </div>

        <ScrollArea className="flex-1 px-4 py-3 space-y-3 overflow-y-auto">
          {chat.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-[80%] px-4 py-2 rounded-xl text-sm leading-snug whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-500 text-white ml-auto"
                  : "bg-gray-200 text-black"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </ScrollArea>

        <div className="p-3 flex gap-2 border-t bg-[#f9f9f9]">
          <Input
            placeholder="Сообщение..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button onClick={sendMessage}>Отпр.</Button>
        </div>
      </div>
    </div>
  );
}