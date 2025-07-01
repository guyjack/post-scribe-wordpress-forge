import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus, Save, Server, Edit } from "lucide-react";
import { 
  WordPressSite, 
  getWordPressSites, 
  saveWordPressSite, 
  deleteWordPressSite 
} from "@/services/wordpressSitesService";

interface SavedWordPressSitesProps {
  onSiteSelected: (site: { siteUrl: string; username: string; password: string }) => void;
}

const SavedWordPressSites = ({ onSiteSelected }: SavedWordPressSitesProps) => {
  const [savedSites, setSavedSites] = useState<WordPressSite[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSite, setNewSite] = useState({
    name: "",
    site_url: "",
    username: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSavedSites();
  }, []);

  const loadSavedSites = async () => {
    try {
      const sites = await getWordPressSites();
      setSavedSites(sites);
    } catch (error) {
      console.error("Errore nel caricamento dei siti:", error);
      toast.error("❌ Errore nel caricamento dei siti salvati");
    }
  };

  const handleSaveNewSite = async () => {
    if (!newSite.name || !newSite.site_url || !newSite.username || !newSite.password) {
      toast.error("❌ Tutti i campi sono obbligatori");
      return;
    }

    setIsLoading(true);
    try {
      await saveWordPressSite(newSite);
      toast.success("✅ Sito WordPress salvato con successo");
      setIsAddDialogOpen(false);
      setNewSite({ name: "", site_url: "", username: "", password: "" });
      await loadSavedSites();
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      toast.error("❌ Errore nel salvataggio del sito");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSite = (siteId: string) => {
    const site = savedSites.find(s => s.id === siteId);
    if (site) {
      // Nota: la password è crittografata nel database, 
      // per semplicità chiediamo all'utente di reinserirla
      toast.info("ℹ️ Inserisci nuovamente la password per sicurezza");
      onSiteSelected({
        siteUrl: site.site_url,
        username: site.username,
        password: "" // L'utente dovrà reinserire la password
      });
      setSelectedSiteId(siteId);
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo sito?")) return;

    try {
      await deleteWordPressSite(siteId);
      toast.success("✅ Sito eliminato con successo");
      await loadSavedSites();
      if (selectedSiteId === siteId) {
        setSelectedSiteId("");
      }
    } catch (error) {
      console.error("Errore nell'eliminazione:", error);
      toast.error("❌ Errore nell'eliminazione del sito");
    }
  };

  return (
    <Card className="border border-orange-500/30 bg-black/50 backdrop-blur-sm text-orange-400">
      <CardHeader className="border-b border-orange-500/20">
        <CardTitle className="flex items-center gap-2 text-orange-400">
          <Server className="h-5 w-5" />
          <span className="font-mono">class SavedSites</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Selezione sito salvato */}
        <div className="space-y-2">
          <Label className="text-orange-400 font-mono">
            const savedSite = <span className="text-yellow-400">"select"</span>
          </Label>
          <Select value={selectedSiteId} onValueChange={handleSelectSite}>
            <SelectTrigger className="bg-gray-900/50 border-orange-500/30 text-orange-300 font-mono">
              <SelectValue placeholder="// select saved WordPress site" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-orange-500/30 text-orange-300">
              {savedSites.map((site) => (
                <SelectItem key={site.id} value={site.id!}>
                  <div className="flex items-center justify-between w-full">
                    <span>{site.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSite(site.id!);
                      }}
                      className="ml-2 h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pulsante per aggiungere nuovo sito */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-mono border border-orange-400">
              <Plus className="mr-2 h-4 w-4" />
              <span>$ ./add-site --new</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-orange-500/30 text-orange-300">
            <DialogHeader>
              <DialogTitle className="text-orange-400 font-mono flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Aggiungi Nuovo Sito WordPress
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-orange-400 font-mono">Nome Sito</Label>
                <Input
                  placeholder="// es: Il mio blog"
                  value={newSite.name}
                  onChange={(e) => setNewSite({...newSite, name: e.target.value})}
                  className="bg-gray-900/50 border-orange-500/30 text-orange-300 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-orange-400 font-mono">URL Sito</Label>
                <Input
                  placeholder="// https://example.com"
                  value={newSite.site_url}
                  onChange={(e) => setNewSite({...newSite, site_url: e.target.value})}
                  className="bg-gray-900/50 border-orange-500/30 text-orange-300 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-orange-400 font-mono">Username</Label>
                <Input
                  placeholder="// admin username"
                  value={newSite.username}
                  onChange={(e) => setNewSite({...newSite, username: e.target.value})}
                  className="bg-gray-900/50 border-orange-500/30 text-orange-300 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-orange-400 font-mono">Application Password</Label>
                <Input
                  type="password"
                  placeholder="// application password"
                  value={newSite.password}
                  onChange={(e) => setNewSite({...newSite, password: e.target.value})}
                  className="bg-gray-900/50 border-orange-500/30 text-orange-300 font-mono"
                />
              </div>
              <Button 
                onClick={handleSaveNewSite}
                disabled={isLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-mono"
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Salvando..." : "Salva Sito"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Info sui siti salvati */}
        {savedSites.length > 0 && (
          <div className="text-xs text-orange-500/70 font-mono bg-gray-900/30 p-2 rounded border border-orange-500/20">
            <code>// {savedSites.length} siti WordPress salvati</code>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedWordPressSites;