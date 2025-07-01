import { supabase } from "@/integrations/supabase/client";

export interface WordPressSite {
  id?: string;
  name: string;
  site_url: string;
  username: string;
  password: string;
  created_at?: string;
  updated_at?: string;
}

export const saveWordPressSite = async (site: Omit<WordPressSite, 'id'>) => {
  console.log("Salvando sito WordPress:", site.name);
  
  try {
    // Crittografa la password prima di salvare
    const { data: encryptedPassword, error: encryptError } = await supabase
      .rpc('encrypt_password', { password_text: site.password });
    
    if (encryptError) {
      throw new Error(`Errore nella crittografia: ${encryptError.message}`);
    }

    const { data, error } = await supabase
      .from('wordpress_sites')
      .insert([{
        name: site.name,
        site_url: site.site_url,
        username: site.username,
        password: encryptedPassword
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Errore nel salvataggio: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Errore nel salvataggio del sito:", error);
    throw error;
  }
};

export const getWordPressSites = async (): Promise<WordPressSite[]> => {
  console.log("Recuperando siti WordPress salvati");
  
  try {
    const { data, error } = await supabase
      .from('wordpress_sites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Errore nel recupero: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Errore nel recupero dei siti:", error);
    throw error;
  }
};

export const deleteWordPressSite = async (id: string) => {
  console.log("Eliminando sito WordPress:", id);
  
  try {
    const { error } = await supabase
      .from('wordpress_sites')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Errore nell'eliminazione: ${error.message}`);
    }
  } catch (error) {
    console.error("Errore nell'eliminazione del sito:", error);
    throw error;
  }
};

export const updateWordPressSite = async (id: string, updates: Partial<Omit<WordPressSite, 'id'>>) => {
  console.log("Aggiornando sito WordPress:", id);
  
  try {
    let updateData: any = { ...updates };
    
    // Se c'è una nuova password, crittografala
    if (updates.password) {
      const { data: encryptedPassword, error: encryptError } = await supabase
        .rpc('encrypt_password', { password_text: updates.password });
      
      if (encryptError) {
        throw new Error(`Errore nella crittografia: ${encryptError.message}`);
      }
      
      updateData.password = encryptedPassword;
    }

    const { data, error } = await supabase
      .from('wordpress_sites')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Errore nell'aggiornamento: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Errore nell'aggiornamento del sito:", error);
    throw error;
  }
};

// Funzione helper per verificare la password quando si carica un sito
export const verifyWordPressSitePassword = async (siteId: string, plainPassword: string): Promise<boolean> => {
  try {
    const { data: site, error } = await supabase
      .from('wordpress_sites')
      .select('password')
      .eq('id', siteId)
      .single();

    if (error || !site) {
      return false;
    }

    const { data: isValid, error: verifyError } = await supabase
      .rpc('verify_password', { 
        password_text: plainPassword, 
        hashed_password: site.password 
      });

    if (verifyError) {
      console.error("Errore nella verifica password:", verifyError);
      return false;
    }

    return isValid || false;
  } catch (error) {
    console.error("Errore nella verifica password:", error);
    return false;
  }
};