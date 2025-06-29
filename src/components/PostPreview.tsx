
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Calendar, Tag } from "lucide-react";

interface PostPreviewProps {
  post: {
    title: string;
    content: string;
    excerpt: string;
    seoTitle: string;
    metaDescription: string;
    tags: string[];
    imageUrl: string;
  };
}

const PostPreview = ({ post }: PostPreviewProps) => {
  return (
    <div className="space-y-6">
      {/* Immagine Featured */}
      <div className="relative overflow-hidden rounded-lg">
        <img 
          src={post.imageUrl} 
          alt={post.title}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-black/20 flex items-end">
          <div className="p-4 text-white">
            <Badge variant="secondary" className="mb-2">
              Immagine Generata
            </Badge>
          </div>
        </div>
      </div>

      {/* Titolo e Meta */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">{post.title}</h2>
        <p className="text-gray-600 text-sm">{post.excerpt}</p>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date().toLocaleDateString('it-IT')}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            Anteprima
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag, index) => (
          <Badge key={index} variant="outline" className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {tag}
          </Badge>
        ))}
      </div>

      {/* Contenuto */}
      <Card>
        <CardContent className="pt-6">
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </CardContent>
      </Card>

      {/* SEO Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3 text-blue-900">Ottimizzazione SEO</h3>
          <div className="space-y-2">
            <div>
              <strong className="text-blue-800">Titolo SEO:</strong>
              <p className="text-blue-700">{post.seoTitle}</p>
            </div>
            <div>
              <strong className="text-blue-800">Meta Description:</strong>
              <p className="text-blue-700">{post.metaDescription}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostPreview;
