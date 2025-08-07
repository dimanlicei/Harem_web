import { useEffect, useState, useRef } from "react";

export default function App() {
  const [characters, setCharacters] = useState(() => {
    const stored = localStorage.getItem("characters");
    return stored ? JSON.parse(stored) : defaultCharacters;
  });

  const [activeId, setActiveId] = useState(characters[0]?.id || "");
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatContainerRef = useRef(null);
  
  // Проверяем, запущено ли приложение в Telegram
  const isTelegram = window.Telegram?.WebApp;
  const tg = isTelegram ? window.Telegram.WebApp : null;
  
  // Получаем данные пользователя Telegram
  const user = isTelegram ? tg.initDataUnsafe.user : null;
  const userName = user ? user.first_name || user.username : "Гость";

  // Загрузка сохраненных сообщений
  useEffect(() => {
    const savedMessages = localStorage.getItem("messages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Сохранение сообщений в localStorage
  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  // Настройка Telegram BackButton
  useEffect(() => {
    if (!tg) return;
    
    if (sidebarOpen) {
      tg.BackButton.show();
      tg.BackButton.onClick(closeSidebar);
    } else {
      tg.BackButton.hide();
    }
    
    return () => tg.BackButton.offClick(closeSidebar);
  }, [sidebarOpen, tg]);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, activeId]);

  const activeChar = characters.find((c) => c.id === activeId);
  const chat = messages[activeId] || [];

  const sendMessage = () => {
    if (!input.trim()) return;
    
    const newChat = [
      ...chat, 
      { 
        role: "user", 
        content: input,
        timestamp: Date.now(),
        name: userName
      }
    ];
    
    setMessages({ ...messages, [activeId]: newChat });
    setInput("");

    // Отправка данных в Telegram бота
    if (isTelegram) {
      const payload = { 
        character: activeChar.name, 
        text: input,
        userId: user?.id,
        chatId: activeId
      };
      tg.sendData(JSON.stringify(payload));
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
    setSidebarOpen(false);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  // Стили для адаптации под тему Telegram
  const getThemeStyles = () => {
    if (!tg) return {};
    
    return {
      bgColor: tg.themeParams.bg_color || "#18222d",
      textColor: tg.themeParams.text_color || "#ffffff",
      hintColor: tg.themeParams.hint_color || "#b1c3d5",
      buttonColor: tg.themeParams.button_color || "#2ea6ff",
      buttonTextColor: tg.themeParams.button_text_color || "#ffffff",
    };
  };

  const theme = getThemeStyles();

  // Рендер сообщений
  const renderMessage = (msg, idx) => {
    const isUser = msg.role === "user";
    const timestamp = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return (
      <div
        key={idx}
        className={`flex flex-col max-w-[85%] mb-3 ${
          isUser ? "ml-auto items-end" : "mr-auto items-start"
        }`}
      >
        <div className="text-xs mb-1 opacity-70">
          {isUser ? msg.name || "Вы" : activeChar.name}
        </div>
        <div
          className={`px-4 py-2 rounded-xl text-sm leading-snug whitespace-pre-wrap ${
            isUser
              ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]"
              : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]"
          }`}
          style={{
            backgroundColor: isUser ? theme.buttonColor : "rgba(255, 255, 255, 0.1)",
            color: isUser ? theme.buttonTextColor : theme.textColor,
          }}
        >
          {msg.content}
        </div>
        <div className="text-xs mt-1 opacity-50">{timestamp}</div>
      </div>
    );
  };

  return (
    <div 
      className="flex h-[var(--tg-viewport-height)] w-full overflow-hidden"
      style={{
        backgroundColor: theme.bgColor,
        color: theme.textColor,
      }}
    >
      {/* Кнопка меню для мобильных */}
      <div 
        className={`fixed top-3 left-3 z-20 p-2 rounded-full ${
          sidebarOpen ? "hidden" : ""
        } md:hidden`}
        style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor }}
        onClick={openSidebar}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </div>

      {/* Сайдбар */}
      <div 
        className={`fixed inset-0 z-10 bg-black bg-opacity-50 transition-opacity ${
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        } md:opacity-0 md:invisible md:relative md:bg-transparent`}
        onClick={closeSidebar}
      ></div>
      
      <div 
        className={`w-[280px] bg-[var(--tg-theme-secondary-bg-color)] border-r border-[var(--tg-theme-hint-color)] z-10 fixed md:static h-full transform transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        style={{ 
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="flex justify-between items-center p-3 border-b border-[var(--tg-theme-hint-color)]">
          <div className="font-bold text-lg" style={{ color: theme.textColor }}>
            Персонажи
          </div>
          <button 
            onClick={addCharacter} 
            className="text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.1)]"
            style={{ color: theme.textColor }}
          >
            ＋
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-50px)]">
          {characters.map((char) => (
            <div
              key={char.id}
              className={`flex items-center gap-3 p-3 cursor-pointer ${
                char.id === activeId 
                  ? "bg-[var(--tg-theme-button-color)]" 
                  : "hover:bg-[rgba(255,255,255,0.05)]"
              }`}
              onClick={() => {
                setActiveId(char.id);
                setSidebarOpen(false);
              }}
              style={{
                backgroundColor: char.id === activeId ? theme.buttonColor : "transparent",
                color: char.id === activeId ? theme.buttonTextColor : theme.textColor,
              }}
            >
              <img 
                src={char.avatar} 
                className="w-10 h-10 rounded-full border-2 border-[rgba(255,255,255,0.2)]" 
                alt={char.name}
              />
              <div className="text-sm font-medium truncate">{char.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Основная область чата */}
      <div className="flex flex-col flex-1 w-full">
        <div 
          className="p-3 font-semibold text-base border-b border-[var(--tg-theme-hint-color)] flex items-center gap-2"
          style={{ 
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <div 
            className="md:hidden p-1 rounded-md hover:bg-[rgba(255,255,255,0.1)]"
            onClick={openSidebar}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </div>
          <div className="flex-1 truncate">{activeChar?.name || "Выберите персонажа"}</div>
        </div>

        {/* Область сообщений */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-3"
        >
          {chat.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="text-xl font-bold mb-2">👋 Привет, {userName}!</div>
              <div className="opacity-70">
                Начните диалог с {activeChar?.name || "персонажа"}, отправив первое сообщение
              </div>
            </div>
          ) : (
            chat.map(renderMessage)
          )}
        </div>

        {/* Поле ввода */}
        <div 
          className="p-3 flex gap-2 border-t"
          style={{ 
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <input
            type="text"
            placeholder="Напишите сообщение..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)]"
            style={{ color: theme.textColor }}
          />
          <button
            onClick={sendMessage}
            className="bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
            style={{ 
              backgroundColor: theme.buttonColor, 
              color: theme.buttonTextColor,
            }}
            disabled={!input.trim()}
          >
            Отпр.
          </button>
        </div>
      </div>
    </div>
  );
}

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