
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Database, CheckCircle, XCircle } from "lucide-react";
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
      toast.error("$ error: missing required connection parameters");
      return;
    }

    setIsConnecting(true);
    try {
      const fetchedCategories = await getWordPressCategories(credentials);
      setCategories(fetchedCategories);
      setIsConnected(true);
      toast.success("✓ Database connection established");
    } catch (error) {
      console.error("Errore nella connessione:", error);
      toast.error("✗ Connection failed");
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="siteUrl" className="text-blue-400 font-mono">
            const siteUrl = <span className="text-yellow-400">"https://..."</span>
          </Label>
          <Input
            id="siteUrl"
            placeholder="// https://example.com"
            value={credentials.siteUrl}
            onChange={(e) => setCredentials({...credentials, siteUrl: e.target.value})}
            className="bg-gray-900/50 border-blue-500/30 text-blue-300 placeholder:text-blue-500/50 font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username" className="text-blue-400 font-mono">
            const username = <span className="text-yellow-400">"string"</span>
          </Label>
          <Input
            id="username"
            placeholder="// admin username"
            value={credentials.username}
            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
            className="bg-gray-900/50 border-blue-500/30 text-blue-300 placeholder:text-blue-500/50 font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-blue-400 font-mono">
            const appPassword = <span className="text-yellow-400">"****"</span>
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="// application password"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            className="bg-gray-900/50 border-blue-500/30 text-blue-300 placeholder:text-blue-500/50 font-mono"
          />
        </div>
      </div>

      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold border border-blue-400"
      >
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Database className="mr-2 h-4 w-4" />
            <span>$ ./connect --database=wordpress</span>
          </>
        )}
      </Button>

      {/* Status Connection */}
      <div className="flex items-center gap-2 text-sm font-mono">
        {isConnected ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-green-400">Status: Connected</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-400">Status: Disconnected</span>
          </>
        )}
      </div>

      {/* Selezione Categoria */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <Label className="text-blue-400 font-mono">
            const category = <span className="text-yellow-400">"option"</span>
          </Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="bg-gray-900/50 border-blue-500/30 text-blue-300 font-mono">
              <SelectValue placeholder="// select category" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-blue-500/30 text-blue-300">
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default WordPressCredentials;
