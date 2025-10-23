import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, Bot, User, Settings, ArrowLeft, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import ChatHistory from "./ChatHistory";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  selectedBodyPart: string | null;
}

const ChatInterface = ({ selectedBodyPart }: ChatInterfaceProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [botName, setBotName] = useState(() => 
    localStorage.getItem('chatBotName') || t('chat.title')
  );
  const [tempBotName, setTempBotName] = useState(botName);
  const [language, setLanguage] = useState(() => 
    localStorage.getItem('appLanguage') || 'en'
  );
  const [showHistory, setShowHistory] = useState(false);
  const [currentChatId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: t('chat.greeting'),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSaveBotName = () => {
    setBotName(tempBotName);
    localStorage.setItem('chatBotName', tempBotName);
    toast({
      title: "Success",
      description: "Chatbot name updated successfully!",
    });
  };

  useEffect(() => {
    if (selectedBodyPart) {
      setInput(`Tell me about the ${selectedBodyPart} and common health issues related to it.`);
    }
  }, [selectedBodyPart]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('appLanguage', language);
    i18n.changeLanguage(language);
  }, [language, i18n]);

  const saveChatToHistory = (msgs: Message[]) => {
    if (msgs.length <= 1) return; // Don't save if only greeting
    
    const savedHistory = localStorage.getItem("chatHistory");
    const history = savedHistory ? JSON.parse(savedHistory) : [];
    
    const preview = msgs.find(m => m.role === "user")?.content.slice(0, 100) || "New chat";
    
    history.unshift({
      id: currentChatId,
      timestamp: new Date().toISOString(),
      preview,
      messages: msgs,
    });
    
    // Keep only last 50 chats
    if (history.length > 50) {
      history.pop();
    }
    
    localStorage.setItem("chatHistory", JSON.stringify(history));
  };

  const loadChatFromHistory = (msgs: Message[]) => {
    setMessages(msgs);
    setShowHistory(false);
  };

  const formatStructuredResponse = (data: any) => {
    if (!data || typeof data !== 'object') return String(data);

    let formatted = '';
    
    if (data.anatomical_name) {
      formatted += `**${data.anatomical_name}**\n\n`;
    }

    if (data.confidence_score !== undefined) {
      const confidenceColor = data.confidence_score >= 75 ? '🟢' : data.confidence_score >= 50 ? '🟡' : '🔴';
      formatted += `${confidenceColor} Confidence: ${data.confidence_score}%\n`;
    }

    if (data.urgency) {
      const urgencyEmoji = data.urgency === 'EMERGENCY' ? '🚨' : data.urgency === 'HIGH' ? '⚠️' : data.urgency === 'MEDIUM' ? '⚡' : 'ℹ️';
      formatted += `${urgencyEmoji} Urgency: ${data.urgency}\n\n`;
    }

    if (data.possible_causes?.length) {
      formatted += `**Possible Causes:**\n${data.possible_causes.map((c: string) => `• ${c}`).join('\n')}\n\n`;
    }

    if (data.red_flags?.length) {
      formatted += `🚩 **Red Flags (Seek immediate medical attention):**\n${data.red_flags.map((f: string) => `• ${f}`).join('\n')}\n\n`;
    }

    if (data.self_care?.length) {
      formatted += `**Self-Care Suggestions:**\n${data.self_care.map((s: string) => `• ${s}`).join('\n')}\n\n`;
    }

    if (data.yoga_suggestions?.length) {
      formatted += `🧘 **Yoga Suggestions:**\n${data.yoga_suggestions.map((y: string) => `• ${y}`).join('\n')}\n\n`;
    }

    if (data.diet_suggestions?.length) {
      formatted += `🥗 **Diet Suggestions:**\n${data.diet_suggestions.map((d: string) => `• ${d}`).join('\n')}\n\n`;
    }

    if (data.recommended_tests?.length) {
      formatted += `🔬 **Recommended Tests:**\n${data.recommended_tests.map((t: string) => `• ${t}`).join('\n')}\n\n`;
    }

    if (data.sources?.length) {
      formatted += `📚 **Sources:**\n${data.sources.map((s: any, i: number) => `${i + 1}. ${s.title}${s.excerpt ? ` - "${s.excerpt}"` : ''}`).join('\n')}\n\n`;
    }

    if (data.disclaimer) {
      formatted += `⚕️ **${data.disclaimer}**`;
    }

    return formatted || String(data);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("health-chat", {
        body: { 
          messages: [...messages, userMessage],
          selectedBodyPart,
          language 
        },
      });

      if (error) throw error;

      // Parse structured AI response
      let responseContent = data.response;
      try {
        const parsedResponse = JSON.parse(data.response);
        // Format structured response for display
        responseContent = formatStructuredResponse(parsedResponse);
      } catch {
        // If not JSON, use raw response
        responseContent = data.response;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: responseContent,
      };

      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages((prev) => [...prev, assistantMessage]);
      saveChatToHistory(updatedMessages);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)]">
      {showHistory && (
        <div className="w-80 flex-shrink-0">
          <ChatHistory onSelectChat={loadChatFromHistory} />
        </div>
      )}
      
      <Card className="shadow-lg border-border flex flex-col flex-1">
        <CardHeader className="flex-shrink-0 border-b">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Bot className="w-5 h-5 text-primary" />
              {botName}
            </div>
            <div className="flex items-center gap-2">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ta">தமிழ்</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="hi">हिन्दी</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowHistory(!showHistory)}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('chat.settings')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="bot-name">{t('chat.botName')}</Label>
                      <Input
                        id="bot-name"
                        value={tempBotName}
                        onChange={(e) => setTempBotName(e.target.value)}
                        placeholder={t('chat.botName')}
                      />
                    </div>
                    <Button onClick={handleSaveBotName} className="w-full">
                      {t('chat.saveChanges')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-secondary" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4 flex-shrink-0">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.placeholder')}
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t('chat.pressEnter')}
          </p>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

export default ChatInterface;
