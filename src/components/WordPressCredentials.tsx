
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Settings, Check } from "lucide-react";
import { getWordPressCategories } from "@/services/wordpressApi";

interface WordPressCredentialsProps {
  credentials: {
    siteUrl: string;
    username: string;
    password: string;
  };
  setCredentials: (credentials: any) => void;
  categories: Array<{id: number, name: string}>;
  setCategories: (categories: Array<{id: number, name: string}>) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const WordPressCredentials = ({
  credentials,
  setCredentials,
  categories,
  setCategories,
  selectedCategory,
  setSelectedCategory
}: WordPressCredentialsProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async () => {
    if (!credentials.siteUrl || !credentials.username || !credentials.password) {
      toast.error("Compila tutti i campi delle credenziali");
      return;
    }

    setIsConnecting(true);
    try {
      const fetchedCategories = await getWordPressCategories(credentials);
      setCategories(fetchedCategories);
      setIsConnected(true);
      toast.success("Connesso a WordPress! Categorie caricate.");
    } catch (error) {
      console.error("Errore nella connessione:", error);
      toast.error("Errore nella connessione a WordPress. Verifica le credenziali.");
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-500" />
          Credenziali WordPress
          {isConnected && <Check className="h-4 w-4 text-green-500" />}
        </CardTitle>
        <CardDescription>
          Inserisci le credenziali per connettere il tuo sito WordPress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="siteUrl">URL del Sito</Label>
          <Input
            id="siteUrl"
            placeholder="https://tuosito.com"
            value={credentials.siteUrl}
            onChange={(e) => setCredentials({...credentials, siteUrl: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="admin"
            value={credentials.username}
            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="password"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
          />
        </div>

        <Button 
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full"
          variant={isConnected ? "outline" : "default"}
        >
          {isConnecting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isConnected ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Settings className="mr-2 h-4 w-4" />
          )}
          {isConnecting ? "Connettendo..." : isConnected ? "Connesso!" : "Connetti e Carica Categorie"}
        </Button>

        {categories.length > 0 && (
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona una categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WordPressCredentials;
