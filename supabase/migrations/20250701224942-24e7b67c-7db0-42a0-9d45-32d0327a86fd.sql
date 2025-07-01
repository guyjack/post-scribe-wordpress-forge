-- Creiamo una tabella per memorizzare le credenziali dei siti WordPress
CREATE TABLE public.wordpress_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  site_url TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL, -- Sarà crittografata tramite pgcrypto
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Abilita Row Level Security
ALTER TABLE public.wordpress_sites ENABLE ROW LEVEL SECURITY;

-- Policy per permettere a tutti di leggere e scrivere (per ora)
-- In futuro si potrebbe legare agli utenti autenticati
CREATE POLICY "Allow all operations on wordpress_sites" 
ON public.wordpress_sites 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wordpress_sites_updated_at
  BEFORE UPDATE ON public.wordpress_sites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Estensione per crittografia delle password
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Funzione per crittografare le password
CREATE OR REPLACE FUNCTION public.encrypt_password(password_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(password_text, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per verificare le password
CREATE OR REPLACE FUNCTION public.verify_password(password_text TEXT, hashed_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (crypt(password_text, hashed_password) = hashed_password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;