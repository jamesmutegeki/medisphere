import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
}

export default function SEO({ title, description, image }: SEOProps) {
  useEffect(() => {
    const base = "CCP Digest | Corporate Commercial Practice Digest";
    document.title = title ? `${title} | CCP Digest` : base;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(name.startsWith("og:") ? "property" : "name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", description || "Corporate Commercial Practice Digest - Your trusted legal partner for corporate and commercial law in East Africa.");
    setMeta("og:title", title || base);
    setMeta("og:description", description || "");
    if (image) setMeta("og:image", image);
    setMeta("og:type", "website");
  }, [title, description, image]);

  return null;
}
