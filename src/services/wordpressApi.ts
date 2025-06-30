interface WordPressCredentials {
  siteUrl: string;
  username: string;
  password: string;
}

interface GeneratedPost {
  title: string;
  content: string;
  excerpt: string;
  seoTitle: string;
  metaDescription: string;
  tags: string[];
  imageUrl: string;
  // Campi aggiuntivi per AIOSEO
  aioseoTitle?: string;
  aioseoDescription?: string;
  focusKeyphrase?: string;
  aioseoTags?: string[];
}

// Funzione per verificare la connettività base del sito WordPress
const checkWordPressSiteConnectivity = async (siteUrl: string) => {
  const cleanUrl = siteUrl.replace(/\/$/, '');
  const testUrl = `${cleanUrl}/wp-json/wp/v2`;
  
  console.log("Verificando connettività WordPress:", testUrl);
  
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("Risposta connettività WordPress:", response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Il sito WordPress non è raggiungibile o non ha REST API abilitata. Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Dati REST API WordPress:", data);
    return true;
  } catch (error) {
    console.error("Errore connettività WordPress:", error);
    throw new Error(`Impossibile connettersi al sito WordPress: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
  }
};

// Funzione per verificare i permessi utente con maggiori dettagli
const checkUserPermissions = async (credentials: WordPressCredentials) => {
  const { siteUrl, username, password } = credentials;
  const cleanUrl = siteUrl.replace(/\/$/, '');
  const apiUrl = `${cleanUrl}/wp-json/wp/v2/users/me`;
  
  console.log("Verificando permessi utente per:", username);
  console.log("URL API utente:", apiUrl);
  
  // Verifica prima la connettività base
  await checkWordPressSiteConnectivity(siteUrl);
  
  try {
    const authHeader = 'Basic ' + btoa(`${username}:${password}`);
    console.log("Header di autenticazione generato per utente:", username);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    console.log("Risposta verifica utente:", response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Dettagli errore autenticazione:", errorData);
      
      if (response.status === 401) {
        throw new Error(`❌ ERRORE DI AUTENTICAZIONE (401):\n\nPossibili cause:\n• Username o password errati\n• Il sito richiede "Application Passwords" invece della password normale\n• Plugin di sicurezza che blocca l'accesso API\n• REST API disabilitata\n\nSoluzione consigliata:\n1. Vai su ${cleanUrl}/wp-admin/profile.php\n2. Scorri fino a "Application Passwords"\n3. Crea una nuova Application Password\n4. Usa quella password invece di quella normale\n\nDettagli: ${errorData.message || 'Accesso negato'}`);
      } else if (response.status === 403) {
        throw new Error(`❌ ACCESSO NEGATO (403):\n\nL'utente '${username}' non ha i permessi sufficienti.\nVerifica che l'utente abbia ruolo Administrator, Editor o Author.`);
      } else if (response.status === 404) {
        throw new Error(`❌ ENDPOINT NON TROVATO (404):\n\nIl sito WordPress non ha REST API disponibile o l'URL non è corretto.\nVerifica che l'URL sia: ${cleanUrl}`);
      } else {
        throw new Error(`❌ ERRORE ${response.status}: ${errorData.message || 'Errore sconosciuto nella verifica utente'}`);
      }
    }

    const userData = await response.json();
    console.log("✅ Dati utente recuperati:", userData);
    
    const userRoles = userData.roles || [];
    const canPublish = userRoles.includes('administrator') || userRoles.includes('editor') || userRoles.includes('author');
    
    console.log("Ruoli utente trovati:", userRoles);
    console.log("Può pubblicare post:", canPublish);
    
    if (!canPublish) {
      throw new Error(`❌ PERMESSI INSUFFICIENTI:\n\nL'utente '${username}' ha ruoli: ${userRoles.join(', ')}\n\nPer pubblicare post servono i ruoli:\n• Administrator\n• Editor  \n• Author\n\nContatta l'amministratore WordPress per aggiornare i permessi.`);
    }
    
    console.log("✅ Verifica permessi completata con successo");
    return userData;
  } catch (error) {
    console.error("❌ Errore nella verifica permessi:", error);
    throw error;
  }
};

export const getWordPressCategories = async (credentials: WordPressCredentials) => {
  const { siteUrl, username, password } = credentials;
  const cleanUrl = siteUrl.replace(/\/$/, '');
  const apiUrl = `${cleanUrl}/wp-json/wp/v2/categories`;
  
  console.log("🔄 Recuperando categorie da:", apiUrl);
  
  try {
    // Prima verifichiamo i permessi utente (include anche check connettività)
    const userData = await checkUserPermissions(credentials);
    console.log("✅ Utente verificato:", userData.name);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Errore recupero categorie:", errorData);
      throw new Error(`❌ Errore nel recupero categorie (${response.status}): ${errorData.message || 'Errore sconosciuto'}`);
    }

    const categories = await response.json();
    console.log("✅ Categorie recuperate:", categories.length, "categorie trovate");
    
    return categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name
    }));
  } catch (error) {
    console.error("❌ Errore nel recupero delle categorie:", error);
    throw error;
  }
};

const getOrCreateTags = async (
  tagNames: string[], 
  credentials: WordPressCredentials
): Promise<number[]> => {
  const { siteUrl, username, password } = credentials;
  const tagsApiUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/tags`;
  
  console.log("Gestendo tag:", tagNames);
  
  const tagIds: number[] = [];
  
  for (const tagName of tagNames) {
    try {
      // Prima cerca se il tag esiste già
      const searchResponse = await fetch(`${tagsApiUrl}?search=${encodeURIComponent(tagName)}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${username}:${password}`),
          'Content-Type': 'application/json',
        },
      });

      if (searchResponse.ok) {
        const existingTags = await searchResponse.json();
        const existingTag = existingTags.find((tag: any) => 
          tag.name.toLowerCase() === tagName.toLowerCase()
        );
        
        if (existingTag) {
          console.log(`Tag esistente trovato: ${tagName} (ID: ${existingTag.id})`);
          tagIds.push(existingTag.id);
          continue;
        }
      }

      // Se il tag non esiste, prova a crearlo
      const createResponse = await fetch(tagsApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${username}:${password}`),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tagName,
          slug: tagName.toLowerCase().replace(/\s+/g, '-')
        }),
      });

      if (createResponse.ok) {
        const newTag = await createResponse.json();
        console.log(`Nuovo tag creato: ${tagName} (ID: ${newTag.id})`);
        tagIds.push(newTag.id);
      } else {
        const errorData = await createResponse.json();
        console.warn(`Impossibile creare il tag ${tagName}:`, errorData);
      }
    } catch (error) {
      console.warn(`Errore nella gestione del tag ${tagName}:`, error);
    }
  }
  
  return tagIds;
};

export const publishToWordPress = async (
  post: GeneratedPost, 
  credentials: WordPressCredentials, 
  categoryId: string
) => {
  const { siteUrl, username, password } = credentials;
  const apiUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts`;
  
  console.log("Pubblicando post migliorato su:", apiUrl);
  
  try {
    // Prima verifichiamo i permessi utente
    const userData = await checkUserPermissions(credentials);
    console.log("Utente verificato:", userData.name, "- Ruoli:", userData.roles);
    
    // Gestisci i tag convertendoli in ID numerici
    let tagIds: number[] = [];
    try {
      tagIds = await getOrCreateTags(post.tags, credentials);
      console.log("Tag ID ottenuti:", tagIds);
    } catch (error) {
      console.warn("Errore nella gestione dei tag:", error);
    }
    
    // Prova a caricare l'immagine (opzionale)
    let featuredMediaId = null;
    try {
      featuredMediaId = await uploadImageToWordPress(post.imageUrl, credentials, post.title);
      console.log("Immagine caricata con ID:", featuredMediaId);
    } catch (error) {
      console.warn("Errore nel caricamento dell'immagine (continuo senza):", error);
    }
    
    const postData = {
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      status: 'publish',
      categories: categoryId ? [parseInt(categoryId)] : [],
      tags: tagIds,
      ...(featuredMediaId && { featured_media: featuredMediaId }),
      meta: {
        // Meta tradizionali per Yoast SEO (compatibilità)
        _yoast_wpseo_title: post.seoTitle,
        _yoast_wpseo_metadesc: post.metaDescription,
        
        // Meta specifici per AIOSEO
        _aioseo_title: post.aioseoTitle || post.seoTitle,
        _aioseo_description: post.aioseoDescription || post.metaDescription,
        _aioseo_keywords: post.focusKeyphrase || post.tags[0] || '',
        _aioseo_og_title: post.aioseoTitle || post.title,
        _aioseo_og_description: post.aioseoDescription || post.excerpt,
        _aioseo_twitter_title: post.aioseoTitle || post.title,
        _aioseo_twitter_description: post.aioseoDescription || post.excerpt,
        
        // Focus keyphrase per AIOSEO
        _aioseo_keyphrases: JSON.stringify([{
          keyphrase: post.focusKeyphrase || post.tags[0] || '',
          score: 100,
          analysis: {
            basic: { isActive: true },
            title: { isActive: true },
            description: { isActive: true }
          }
        }])
      }
    };

    console.log("Dati post migliorato da inviare:", postData);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Errore nella pubblicazione:", errorData);
      
      if (response.status === 401) {
        throw new Error(`Errore di autenticazione: L'utente ${username} non ha i permessi necessari per pubblicare post. Verifica che l'utente abbia ruolo di Administrator, Editor o Author.`);
      }
      
      throw new Error(`Errore HTTP ${response.status}: ${errorData.message || 'Errore sconosciuto'}`);
    }

    const result = await response.json();
    console.log("Post migliorato pubblicato con successo:", result);
    return result;
  } catch (error) {
    console.error("Errore nella pubblicazione:", error);
    throw error;
  }
};

const uploadImageToWordPress = async (
  imageUrl: string, 
  credentials: WordPressCredentials, 
  title: string
): Promise<number | null> => {
  const { siteUrl, username, password } = credentials;
  const apiUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/media`;
  
  try {
    // Scarica l'immagine
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Errore nel download dell'immagine: ${imageResponse.status}`);
    }
    
    const imageBlob = await imageResponse.blob();
    
    const formData = new FormData();
    formData.append('file', imageBlob, `${title.replace(/\s+/g, '-').toLowerCase()}.jpg`);
    formData.append('title', title);
    formData.append('alt_text', title);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      if (response.status === 401) {
        throw new Error(`Errore di autenticazione upload immagine: L'utente non ha i permessi per caricare media.`);
      }
      
      throw new Error(`Errore upload immagine ${response.status}: ${errorData.message || 'Errore sconosciuto'}`);
    }

    const result = await response.json();
    console.log("Immagine caricata:", result);
    return result.id;
  } catch (error) {
    console.error("Errore nell'upload dell'immagine:", error);
    throw error;
  }
};
