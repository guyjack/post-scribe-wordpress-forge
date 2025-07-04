
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

// Funzione per normalizzare l'URL del sito
const normalizeUrl = (url: string): string => {
  let cleanUrl = url.trim();
  
  // Rimuovi gli spazi
  cleanUrl = cleanUrl.replace(/\s/g, '');
  
  // Aggiungi https:// se non presente
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }
  
  // Rimuovi slash finale
  cleanUrl = cleanUrl.replace(/\/$/, '');
  
  console.log(`URL normalizzato: ${url} -> ${cleanUrl}`);
  return cleanUrl;
};

// Funzione per testare diversi endpoint WordPress
const testWordPressEndpoints = async (siteUrl: string) => {
  const cleanUrl = normalizeUrl(siteUrl);
  const endpoints = [
    `${cleanUrl}/wp-json/wp/v2`,
    `${cleanUrl}/wp-json`,
    `${cleanUrl}/?rest_route=/wp/v2`,
  ];
  
  console.log("🔍 Testando endpoint WordPress disponibili...");
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testando: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`${endpoint} - Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Endpoint funzionante: ${endpoint}`, data);
        return endpoint;
      }
    } catch (error) {
      console.log(`❌ Errore su ${endpoint}:`, error);
    }
  }
  
  throw new Error(`❌ Nessun endpoint WordPress REST API trovato per ${cleanUrl}`);
};

// Funzione per verificare la connettività base del sito WordPress
const checkWordPressSiteConnectivity = async (siteUrl: string) => {
  console.log("🔄 Verificando connettività WordPress per:", siteUrl);
  
  try {
    const workingEndpoint = await testWordPressEndpoints(siteUrl);
    console.log("✅ WordPress REST API disponibile su:", workingEndpoint);
    return workingEndpoint;
  } catch (error) {
    console.error("❌ Errore connettività WordPress:", error);
    throw error;
  }
};

// Funzione per testare l'autenticazione con diversi formati
const testAuthentication = async (credentials: WordPressCredentials, apiEndpoint: string) => {
  const { username, password } = credentials;
  
  console.log("🔐 Testando autenticazione per utente:", username);
  console.log("📍 Endpoint API:", `${apiEndpoint}/users/me`);
  
  // Test con diversi formati di credenziali
  const authVariants = [
    // Standard Basic Auth
    {
      name: "Basic Auth Standard",
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
        'Content-Type': 'application/json',
      }
    },
    // Con trim degli spazi
    {
      name: "Basic Auth (trimmed)",
      headers: {
        'Authorization': 'Basic ' + btoa(`${username.trim()}:${password.trim()}`),
        'Content-Type': 'application/json',
      }
    },
    // Application Password format (se contiene spazi)
    {
      name: "Application Password Format",
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password.replace(/\s/g, '')}`),
        'Content-Type': 'application/json',
      }
    }
  ];
  
  for (const variant of authVariants) {
    try {
      console.log(`🧪 Testando: ${variant.name}`);
      console.log("Headers utilizzati:", variant.headers);
      
      const response = await fetch(`${apiEndpoint}/users/me`, {
        method: 'GET',
        headers: variant.headers,
      });

      console.log(`${variant.name} - Status: ${response.status}`);

      if (response.ok) {
        const userData = await response.json();
        console.log(`✅ Autenticazione riuscita con: ${variant.name}`, userData);
        return { userData, headers: variant.headers };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log(`❌ ${variant.name} fallito:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
      }
    } catch (error) {
      console.error(`❌ Errore in ${variant.name}:`, error);
    }
  }
  
  throw new Error(`❌ Tutti i metodi di autenticazione sono falliti per l'utente: ${username}`);
};

// Funzione per verificare i permessi utente con maggiori dettagli
const checkUserPermissions = async (credentials: WordPressCredentials) => {
  const { siteUrl } = credentials;
  
  console.log("🔄 Inizio verifica permessi utente...");
  
  try {
    // Prima verifica la connettività e trova l'endpoint giusto
    const apiEndpoint = await checkWordPressSiteConnectivity(siteUrl);
    
    // Poi testa l'autenticazione
    const { userData, headers } = await testAuthentication(credentials, apiEndpoint);
    
    const userRoles = userData.roles || [];
    
    console.log("👤 Dati utente:", {
      name: userData.name,
      roles: userRoles,
      id: userData.id
    });
    
    // Se i ruoli non sono disponibili tramite /users/me, proviamo con una richiesta diversa
    if (userRoles.length === 0) {
      console.log("⚠️ Ruoli non disponibili tramite /users/me, tentativo alternativo...");
      
      try {
        // Proviamo a recuperare i ruoli dall'endpoint specifico dell'utente
        const userResponse = await fetch(`${apiEndpoint}/users/${userData.id}`, {
          method: 'GET',
          headers: headers,
        });

        if (userResponse.ok) {
          const detailedUserData = await userResponse.json();
          const detailedRoles = detailedUserData.roles || [];
          
          console.log("🔍 Ruoli dall'endpoint dettagliato:", detailedRoles);
          
          if (detailedRoles.length > 0) {
            userData.roles = detailedRoles;
            userRoles.push(...detailedRoles);
          }
        }
      } catch (error) {
        console.log("⚠️ Impossibile recuperare ruoli dettagliati:", error);
      }
    }
    
    // Se ancora non abbiamo ruoli, proviamo a testare direttamente la capacità di creare post
    if (userRoles.length === 0) {
      console.log("🧪 Testando capacità di creazione post direttamente...");
      
      try {
        // Tentiamo di creare una bozza di test
        const testPostResponse = await fetch(`${apiEndpoint}/posts`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            title: 'Test Draft - Please Ignore',
            content: 'This is a test draft to verify publishing permissions.',
            status: 'draft'
          }),
        });

        if (testPostResponse.ok) {
          console.log("✅ Test creazione post riuscito - permessi confermati");
          
          // Eliminiamo il post di test
          const testPost = await testPostResponse.json();
          try {
            await fetch(`${apiEndpoint}/posts/${testPost.id}`, {
              method: 'DELETE',
              headers: headers,
            });
            console.log("🗑️ Post di test eliminato");
          } catch (deleteError) {
            console.log("⚠️ Impossibile eliminare post di test:", deleteError);
          }
          
          console.log("✅ Verifica permessi completata con successo (test pratico)");
          return { userData, apiEndpoint, headers };
        } else {
          const errorData = await testPostResponse.json();
          console.log("❌ Test creazione post fallito:", errorData);
          
          if (testPostResponse.status === 403) {
            throw new Error(`❌ PERMESSI INSUFFICIENTI:\n\nL'utente '${credentials.username}' non ha i permessi per creare post.\n\nVerifica che l'utente abbia uno dei seguenti ruoli:\n• Administrator\n• Editor\n• Author\n\nOppure controlla che l'Application Password sia stata generata correttamente.`);
          }
        }
      } catch (testError) {
        console.log("❌ Errore nel test di creazione post:", testError);
        
        // Se il test fallisce, procediamo comunque ma avvisiamo l'utente
        console.log("⚠️ Impossibile verificare i permessi automaticamente");
        
        // Permettiamo la connessione ma avvisiamo sui permessi
        console.log("✅ Connessione stabilita (permessi da verificare durante la pubblicazione)");
        return { userData, apiEndpoint, headers };
      }
    }
    
    // Verifica tradizionale dei ruoli se disponibili
    const canPublish = userRoles.includes('administrator') || userRoles.includes('editor') || userRoles.includes('author');
    
    if (userRoles.length > 0 && !canPublish) {
      throw new Error(`❌ PERMESSI INSUFFICIENTI:\n\nL'utente '${credentials.username}' ha ruoli: ${userRoles.join(', ')}\n\nPer pubblicare post servono i ruoli:\n• Administrator\n• Editor\n• Author\n\nContatta l'amministratore WordPress per aggiornare i permessi.`);
    }
    
    console.log("✅ Verifica permessi completata con successo");
    return { userData, apiEndpoint, headers };
  } catch (error) {
    console.error("❌ Errore nella verifica permessi:", error);
    throw error;
  }
};

export const getWordPressCategories = async (credentials: WordPressCredentials) => {
  console.log("🔄 Recuperando categorie WordPress...");
  
  try {
    // Verifica permessi e ottieni endpoint/headers corretti
    const { apiEndpoint, headers } = await checkUserPermissions(credentials);
    
    const response = await fetch(`${apiEndpoint}/categories`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Errore recupero categorie:", errorData);
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
  credentials: WordPressCredentials,
  apiEndpoint: string,
  headers: any
): Promise<number[]> => {
  console.log("🏷️ Gestendo tag:", tagNames);
  
  const tagIds: number[] = [];
  
  for (const tagName of tagNames) {
    try {
      // Prima cerca se il tag esiste già
      const searchResponse = await fetch(`${apiEndpoint}/tags?search=${encodeURIComponent(tagName)}`, {
        method: 'GET',
        headers: headers,
      });

      if (searchResponse.ok) {
        const existingTags = await searchResponse.json();
        const existingTag = existingTags.find((tag: any) => 
          tag.name.toLowerCase() === tagName.toLowerCase()
        );
        
        if (existingTag) {
          console.log(`✅ Tag esistente trovato: ${tagName} (ID: ${existingTag.id})`);
          tagIds.push(existingTag.id);
          continue;
        }
      }

      // Se il tag non esiste, prova a crearlo
      const createResponse = await fetch(`${apiEndpoint}/tags`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          name: tagName,
          slug: tagName.toLowerCase().replace(/\s+/g, '-')
        }),
      });

      if (createResponse.ok) {
        const newTag = await createResponse.json();
        console.log(`✅ Nuovo tag creato: ${tagName} (ID: ${newTag.id})`);
        tagIds.push(newTag.id);
      } else {
        const errorData = await createResponse.json();
        console.warn(`⚠️ Impossibile creare il tag ${tagName}:`, errorData);
      }
    } catch (error) {
      console.warn(`⚠️ Errore nella gestione del tag ${tagName}:`, error);
    }
  }
  
  return tagIds;
};

export const publishToWordPress = async (
  post: GeneratedPost, 
  credentials: WordPressCredentials, 
  categoryId: string,
  publishDate?: Date
) => {
  console.log("📝 Pubblicando post su WordPress...");
  
  try {
    // Verifica permessi e ottieni endpoint/headers corretti
    const { userData, apiEndpoint, headers } = await checkUserPermissions(credentials);
    console.log("✅ Utente verificato:", userData.name, "- Ruoli:", userData.roles);
    
    // Gestisci i tag convertendoli in ID numerici
    let tagIds: number[] = [];
    try {
      tagIds = await getOrCreateTags(post.tags, credentials, apiEndpoint, headers);
      console.log("🏷️ Tag ID ottenuti:", tagIds);
    } catch (error) {
      console.warn("⚠️ Errore nella gestione dei tag:", error);
    }
    
    // Prova a caricare l'immagine (opzionale)
    let featuredMediaId = null;
    try {
      featuredMediaId = await uploadImageToWordPress(post.imageUrl, credentials, post.title, apiEndpoint, headers);
      console.log("🖼️ Immagine caricata con ID:", featuredMediaId);
    } catch (error) {
      console.warn("⚠️ Errore nel caricamento dell'immagine (continuo senza):", error);
    }
    
    // Determina lo status e la data in base alla data di pubblicazione
    const isScheduled = publishDate && publishDate > new Date();
    const postStatus = isScheduled ? 'future' : 'publish';
    
    const postData = {
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      status: postStatus,
      categories: categoryId ? [parseInt(categoryId)] : [],
      tags: tagIds,
      ...(publishDate && { date: publishDate.toISOString() }),
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

    console.log("📤 Dati post da inviare:", postData);

    const response = await fetch(`${apiEndpoint}/posts`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Errore nella pubblicazione:", errorData);
      throw new Error(`❌ Errore HTTP ${response.status}: ${errorData.message || 'Errore sconosciuto'}`);
    }

    const result = await response.json();
    console.log("✅ Post pubblicato con successo:", result);
    return result;
  } catch (error) {
    console.error("❌ Errore nella pubblicazione:", error);
    throw error;
  }
};

const uploadImageToWordPress = async (
  imageUrl: string, 
  credentials: WordPressCredentials, 
  title: string,
  apiEndpoint: string,
  headers: any
): Promise<number | null> => {
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

    // Per l'upload di media, usa solo l'Authorization header
    const uploadHeaders = {
      'Authorization': headers.Authorization
    };

    const response = await fetch(`${apiEndpoint}/media`, {
      method: 'POST',
      headers: uploadHeaders,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`❌ Errore upload immagine ${response.status}: ${errorData.message || 'Errore sconosciuto'}`);
    }

    const result = await response.json();
    console.log("✅ Immagine caricata:", result);
    return result.id;
  } catch (error) {
    console.error("❌ Errore nell'upload dell'immagine:", error);
    throw error;
  }
};
