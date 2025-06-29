
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Send, Zap, Image, Eye } from "lucide-react";
import { generatePost } from "@/services/postGenerator";
import { publishToWordPress } from "@/services/wordpressApi";
import PostPreview from "@/components/PostPreview";
import WordPressCredentials from "@/components/WordPressCredentials";

const Index = () => {
  const [topic, setTopic] = useState("");
  const [credentials, setCredentials] = useState({
    siteUrl: "",
    username: "",
    password: ""
  });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([]);
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleGeneratePost = async () => {
    if (!topic.trim()) {
      toast.error("Inserisci un argomento per il post");
      return;
    }

    setIsGenerating(true);
    try {
      const post = await generatePost(topic);
      setGeneratedPost(post);
      setShowPreview(true);
      toast.success("Post generato con successo!");
    } catch (error) {
      console.error("Errore nella generazione del post:", error);
      toast.error("Errore nella generazione del post");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishPost = async () => {
    if (!generatedPost || !credentials.siteUrl || !credentials.username || !credentials.password) {
      toast.error("Compila tutti i campi necessari");
      return;
    }

    setIsPublishing(true);
    try {
      await publishToWordPress(generatedPost, credentials, selectedCategory);
      toast.success("Post pubblicato con successo su WordPress!");
    } catch (error) {
      console.error("Errore nella pubblicazione:", error);
      toast.error("Errore nella pubblicazione del post");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            WordPress Post Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Genera automaticamente post ottimizzati per la SEO con immagini e pubblicali direttamente su WordPress
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Form di Generazione */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Genera Post
              </CardTitle>
              <CardDescription>
                Inserisci l'argomento del post che vuoi generare
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topic">Argomento del Post</Label>
                <Textarea
                  id="topic"
                  placeholder="Es: I benefici dello yoga per la salute mentale"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              <Button 
                onClick={handleGeneratePost}
                disabled={isGenerating || !topic.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                {isGenerating ? "Generando..." : "Genera Post"}
              </Button>
            </CardContent>
          </Card>

          {/* Credenziali WordPress */}
          <WordPressCredentials 
            credentials={credentials}
            setCredentials={setCredentials}
            categories={categories}
            setCategories={setCategories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        </div>

        {/* Preview del Post */}
        {showPreview && generatedPost && (
          <div className="mt-8 max-w-6xl mx-auto">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-500" />
                  Anteprima Post
                </CardTitle>
                <CardDescription>
                  Controlla il contenuto generato prima della pubblicazione
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PostPreview post={generatedPost} />
                
                <div className="mt-6 flex justify-center">
                  <Button 
                    onClick={handlePublishPost}
                    disabled={isPublishing || !credentials.siteUrl}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
                  >
                    {isPublishing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {isPublishing ? "Pubblicando..." : "Pubblica su WordPress"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
