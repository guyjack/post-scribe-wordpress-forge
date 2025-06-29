
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

export const publishToWordPress = async (
  post: GeneratedPost, 
  credentials: WordPressCredentials, 
  categoryId: string
) => {
  const { siteUrl, username, password } = credentials;
  const apiUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts`;
  
  console.log("Pubblicando post su:", apiUrl);
  
  // Prima carichiamo l'immagine
  let featuredMediaId = null;
  try {
    featuredMediaId = await uploadImageToWordPress(post.imageUrl, credentials, post.title);
  } catch (error) {
    console.warn("Errore nel caricamento dell'immagine:", error);
  }
  
  const postData = {
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    status: 'publish',
    categories: categoryId ? [parseInt(categoryId)] : [],
    tags: post.tags,
    featured_media: featuredMediaId,
    meta: {
      _yoast_wpseo_title: post.seoTitle,
      _yoast_wpseo_metadesc: post.metaDescription,
    }
  };

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
      throw new Error(`Errore HTTP: ${response.status}`);
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
      throw new Error(`Errore upload immagine: ${response.status}`);
    }

    const result = await response.json();
    console.log("Immagine caricata:", result);
    return result.id;
  } catch (error) {
    console.error("Errore nell'upload dell'immagine:", error);
    return null;
  }
};
