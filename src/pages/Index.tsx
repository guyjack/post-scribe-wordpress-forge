
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Loader2, Send, Terminal, Code, Database, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { generatePost } from "@/services/postGenerator";
import { publishToWordPress } from "@/services/wordpressApi";
import PostPreview from "@/components/PostPreview";
import WordPressCredentials from "@/components/WordPressCredentials";
import SavedWordPressSites from "@/components/SavedWordPressSites";

const Index = () => {
  const [topic, setTopic] = useState("");
  const [writingStyle, setWritingStyle] = useState("professionale");
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
  const [publishDate, setPublishDate] = useState<Date>();
  const [feedbackText, setFeedbackText] = useState("");

  const handleGeneratePost = async () => {
    if (!topic.trim()) {
      toast.error("$ error: topic argument required");
      return;
    }

    setIsGenerating(true);
    try {
      const post = await generatePost(topic, writingStyle, feedbackText);
      setGeneratedPost(post);
      setShowPreview(true);
      toast.success("✓ Post compiled successfully");
    } catch (error) {
      console.error("Errore nella generazione del post:", error);
      toast.error("✗ Compilation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateWithFeedback = async () => {
    if (!topic.trim()) {
      toast.error("$ error: topic argument required");
      return;
    }

    setIsGenerating(true);
    try {
      const post = await generatePost(topic, writingStyle, feedbackText);
      setGeneratedPost(post);
      toast.success("✓ Post recompiled with feedback");
    } catch (error) {
      console.error("Errore nella rigenerazione del post:", error);
      toast.error("✗ Recompilation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishPost = async () => {
    if (!generatedPost || !credentials.siteUrl || !credentials.username || !credentials.password) {
      toast.error("$ error: missing required parameters");
      return;
    }

    setIsPublishing(true);
    try {
      await publishToWordPress(generatedPost, credentials, selectedCategory, publishDate);
      toast.success("✓ Deployment successful");
    } catch (error) {
      console.error("Errore nella pubblicazione:", error);
      toast.error("✗ Deployment failed");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSiteSelected = (site: { siteUrl: string; username: string; password: string }) => {
    setCredentials({
      siteUrl: site.siteUrl,
      username: site.username,
      password: site.password
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-green-400 font-mono">
      {/* Matrix-style background pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent)] animate-pulse"></div>
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(34,197,94,0.05)_25%,rgba(34,197,94,0.05)_26%,transparent_27%,transparent_74%,rgba(34,197,94,0.05)_75%,rgba(34,197,94,0.05)_76%,transparent_77%,transparent)] bg-[length:50px_50px]"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header con stile terminale */}
        <div className="text-center mb-8 border border-green-500/30 bg-black/50 backdrop-blur-sm rounded-lg p-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Terminal className="h-8 w-8 text-green-400" />
            <h1 className="text-4xl font-bold text-green-400">
              <span className="text-green-600">$</span> wp-post-generator
            </h1>
          </div>
          <p className="text-lg text-green-300/80 max-w-2xl mx-auto font-mono">
            <span className="text-green-600">//</span> Automated WordPress content generation system
            <br />
            <span className="text-green-600">//</span> SEO-optimized with AI-powered content creation
          </p>
          <div className="mt-4 text-sm text-green-500/60">
            <code>Status: Online | Version: 2.1.0 | Uptime: 99.9%</code>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Form di Generazione */}
          <Card className="border border-green-500/30 bg-black/50 backdrop-blur-sm text-green-400">
            <CardHeader className="border-b border-green-500/20">
              <CardTitle className="flex items-center gap-2 text-green-400">
                <Code className="h-5 w-5" />
                <span className="font-mono">function generatePost()</span>
              </CardTitle>
              <CardDescription className="text-green-300/70 font-mono">
                {'{'} Inserire l'argomento e stile del Post {'}'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="topic" className="text-green-400 font-mono">
                  Argomento = <span className="text-yellow-400">"string"</span>
                </Label>
                  <Textarea
                  id="topic"
                  placeholder="// Inserisci l'argomento qui..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[100px] resize-none bg-gray-900/50 border-green-500/30 text-green-300 placeholder:text-green-500/50 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-green-400 font-mono">
                  Style = <span className="text-yellow-400">"option"</span>
                </Label>
                <Select value={writingStyle} onValueChange={setWritingStyle}>
                  <SelectTrigger className="bg-gray-900/50 border-green-500/30 text-green-300 font-mono">
                    <SelectValue placeholder="// seleziona stile di scrittura" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-green-500/30 text-green-300">
                    <SelectItem value="professionale">Professionale - Stile business formale</SelectItem>
                    <SelectItem value="tecnico">Tecnico - Linguaggio specialistico</SelectItem>
                    <SelectItem value="divulgativo">Divulgativo - Facile comprensione</SelectItem>
                    <SelectItem value="accademico">Accademico - Stile scientifico</SelectItem>
                    <SelectItem value="informale">Informale - Tono conversazionale</SelectItem>
                    <SelectItem value="vendita">Vendita - Copy persuasivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleGeneratePost}
                disabled={isGenerating || !topic.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-black font-mono font-bold border border-green-400"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Compiling...</span>
                  </>
                ) : (
                  <>
                    <Terminal className="mr-2 h-4 w-4" />
                    <span>$ ./generate --topic="{topic.slice(0, 20)}{topic.length > 20 ? '...' : ''}"</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Siti WordPress Salvati */}
          <SavedWordPressSites onSiteSelected={handleSiteSelected} />

          {/* Credenziali WordPress */}
          <Card className="border border-blue-500/30 bg-black/50 backdrop-blur-sm text-blue-400">
            <CardHeader className="border-b border-blue-500/20">
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Database className="h-5 w-5" />
                <span className="font-mono">class WordPressAPI</span>
              </CardTitle>
              <CardDescription className="text-blue-300/70 font-mono">
                {'{'} Configure database connection parameters {'}'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <WordPressCredentials 
                credentials={credentials}
                setCredentials={setCredentials}
                categories={categories}
                setCategories={setCategories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            </CardContent>
          </Card>
        </div>

        {/* Preview del Post */}
        {showPreview && generatedPost && (
          <div className="mt-8 max-w-7xl mx-auto">
            <Card className="border border-purple-500/30 bg-black/50 backdrop-blur-sm text-purple-400">
              <CardHeader className="border-b border-purple-500/20">
                <CardTitle className="flex items-center gap-2 text-purple-400">
                  <Code className="h-5 w-5" />
                  <span className="font-mono">Preview.render()</span>
                </CardTitle>
                <CardDescription className="text-purple-300/70 font-mono">
                  {'{'} Generated content ready for deployment {'}'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <PostPreview post={generatedPost} />
                
                {/* Sezione Feedback per Miglioramenti */}
                <div className="mt-6 border border-yellow-500/30 bg-gray-900/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Code className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-400 font-mono font-bold">optimize.feedback()</span>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="feedback" className="text-yellow-400 font-mono">
                        Correzioni = <span className="text-yellow-300">"string"</span>
                      </Label>
                      <Textarea
                        id="feedback"
                        placeholder="// Esempio: riduci tags a massimo 5, usa termini più specifici, migliora la struttura del contenuto, ecc..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        className="min-h-[80px] resize-none bg-gray-900/50 border-yellow-500/30 text-yellow-300 placeholder:text-yellow-500/50 font-mono text-sm"
                      />
                    </div>
                    <Button 
                      onClick={handleRegenerateWithFeedback}
                      disabled={isGenerating || !feedbackText.trim()}
                      variant="outline"
                      className="w-full bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-400 font-mono border-yellow-500/30"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Optimizing...</span>
                        </>
                      ) : (
                        <>
                          <Terminal className="mr-2 h-4 w-4" />
                          <span>$ ./regenerate --optimize --feedback</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6 space-y-4">
                  {/* Selezione data pubblicazione */}
                  <div className="flex flex-col items-center space-y-2">
                    <Label className="text-purple-400 font-mono">
                      Publish_Date = <span className="text-yellow-400">"datetime"</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[300px] justify-start text-left font-mono bg-gray-900/50 border-purple-500/30 text-purple-300",
                            !publishDate && "text-purple-500/50"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {publishDate ? (
                            format(publishDate, "PPP", { locale: it })
                          ) : (
                            <span>// Seleziona data pubblicazione</span>
                          )}
                        </Button>
                      </PopoverTrigger>  
                      <PopoverContent className="w-auto p-0 bg-gray-900 border-purple-500/30" align="start">
                        <Calendar
                          mode="single"
                          selected={publishDate}
                          onSelect={setPublishDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto text-purple-300"
                        />
                      </PopoverContent>
                    </Popover>
                    {publishDate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPublishDate(undefined)}
                        className="text-purple-400/70 hover:text-purple-400 font-mono text-xs"
                      >
                        // clear date
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex justify-center">
                    <Button 
                      onClick={handlePublishPost}
                      disabled={isPublishing || !credentials.siteUrl}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-mono font-bold border border-purple-400 px-8"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Deploying...</span>
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          <span>$ ./deploy {publishDate ? '--scheduled' : '--immediate'}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer con stile terminale */}
        <div className="mt-12 text-center text-green-500/50 font-mono text-sm">
          <div className="border-t border-green-500/20 pt-4">
            <code>© 2024 WP-Post-Generator | Built with React + TypeScript + AI</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
