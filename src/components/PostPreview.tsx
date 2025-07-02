
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Code2, Tag, Target, FileText, Image } from "lucide-react";

interface PostPreviewProps {
  post: {
    title: string;
    content: string;
    excerpt: string;
    tags: string[];
    imageUrl?: string;
    aioseo?: {
      articleTitle: string;
      metaDescription: string;
      focusKeyphrase: string;
      tags: string[];
    };
  };
}

const PostPreview = ({ post }: PostPreviewProps) => {
  return (
    <div className="space-y-6 text-purple-300 font-mono">
      {/* SEO Info Panel */}
      {post.aioseo && (
        <div className="border border-purple-500/30 bg-gray-900/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-purple-400" />
            <span className="text-purple-400 font-bold">SEO.config</span>
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-purple-500">articleTitle:</span>{' '}
              <span className="text-yellow-400">"{post.aioseo.articleTitle}"</span>
            </div>
            <div>
              <span className="text-purple-500">metaDescription:</span>{' '}
              <span className="text-yellow-400">"{post.aioseo.metaDescription}"</span>
            </div>
            <div>
              <span className="text-purple-500">focusKeyphrase:</span>{' '}
              <span className="text-yellow-400">"{post.aioseo.focusKeyphrase}"</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-purple-500">tags:</span>{' '}
              <span className="text-yellow-400">[</span>
              {post.aioseo.tags.map((tag, index) => (
                <span key={index} className="text-green-400">
                  "{tag}"{index < post.aioseo!.tags.length - 1 ? ',' : ''}
                </span>
              ))}
              <span className="text-yellow-400">]</span>
            </div>
          </div>
        </div>
      )}

      {/* Post Title */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Code2 className="h-4 w-4 text-purple-400" />
          <span className="text-purple-400 font-bold">post.title</span>
        </div>
        <h2 className="text-2xl font-bold text-purple-200 bg-gray-900/30 p-3 rounded border border-purple-500/20">
          {post.title}
        </h2>
      </div>

      <Separator className="bg-purple-500/20" />

      {/* Post Image */}
      {post.imageUrl && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Image className="h-4 w-4 text-purple-400" />
            <span className="text-purple-400 font-bold">post.featuredImage</span>
          </div>
          <div className="bg-gray-900/30 p-3 rounded border border-purple-500/20">
            <img 
              src={post.imageUrl} 
              alt={post.title}
              className="w-full h-48 object-cover rounded border border-purple-500/20"
              loading="lazy"
            />
            <p className="text-purple-400/70 text-xs mt-2 font-mono">
              src: "{post.imageUrl}"
            </p>
          </div>
        </div>
      )}

      <Separator className="bg-purple-500/20" />

      {/* Post Excerpt */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-purple-400" />
          <span className="text-purple-400 font-bold">post.excerpt</span>
        </div>
        <p className="text-purple-300/80 bg-gray-900/30 p-3 rounded border border-purple-500/20">
          {post.excerpt}
        </p>
      </div>

      {/* Post Content Preview */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Code2 className="h-4 w-4 text-purple-400" />
          <span className="text-purple-400 font-bold">post.content</span>
        </div>
        <div className="bg-gray-900/30 p-4 rounded border border-purple-500/20 max-h-96 overflow-y-auto">
          <div 
            className="prose prose-sm max-w-none text-purple-200 prose-headings:text-purple-300 prose-p:text-purple-200/90 prose-strong:text-purple-100 prose-a:text-blue-400"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4 text-purple-400" />
            <span className="text-purple-400 font-bold">post.tags[]</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="border-purple-500/30 text-purple-300 bg-gray-900/30">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostPreview;
