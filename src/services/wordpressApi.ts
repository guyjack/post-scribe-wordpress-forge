
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
}

export const getWordPressCategories = async (credentials: WordPressCredentials) => {
  const { siteUrl, username, password } = credentials;
  const apiUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/categories`;
  
  console.log("Recuperando categorie da:", apiUrl);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Errore HTTP: ${response.status}`);
    }

    const categories = await response.json();
    console.log("Categorie ricevute:", categories);
    
    return categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name
    }));
  } catch (error) {
    console.error("Errore nel recupero delle categorie:", error);
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
        console.warn(`Impossibile creare il tag: ${tagName}`);
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
  
  console.log("Pubblicando post su:", apiUrl);
  
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
    tags: tagIds, // Ora usiamo gli ID numerici
    ...(featuredMediaId && { featured_media: featuredMediaId }),
    meta: {
      _yoast_wpseo_title: post.seoTitle,
      _yoast_wpseo_metadesc: post.metaDescription,
    }
  };

  console.log("Dati post da inviare:", postData);

  try {
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
      throw new Error(`Errore HTTP ${response.status}: ${errorData.message || 'Errore sconosciuto'}`);
    }

    const result = await response.json();
    console.log("Post pubblicato con successo:", result);
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
