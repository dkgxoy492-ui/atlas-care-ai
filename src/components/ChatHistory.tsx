import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ChatHistoryItem {
  id: string;
  timestamp: Date;
  preview: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

interface ChatHistoryProps {
  onSelectChat: (messages: Array<{ role: "user" | "assistant"; content: string }>) => void;
}

const ChatHistory = ({ onSelectChat }: ChatHistoryProps) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("chatHistory");
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      setHistory(parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      })));
    }
  }, []);

  const deleteChat = (id: string) => {
    const newHistory = history.filter((item) => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem("chatHistory", JSON.stringify(newHistory));
  };

  return (
    <Card className="shadow-lg border-border h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {t('chat.history')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 p-4">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No chat history yet
              </p>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex-1"
                      onClick={() => onSelectChat(item.messages)}
                    >
                      <p className="text-sm font-medium line-clamp-2">
                        {item.preview}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => deleteChat(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ChatHistory;
