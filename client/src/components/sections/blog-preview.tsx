import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import { blogPosts } from "../../data/blog";
import Badge from "../ui/badge";
import Button from "../ui/button";

export default function BlogPreview() {
  const posts = blogPosts.slice(0, 3);
  return (
    <section className="py-16 lg:py-24 bg-neutral-50 dark:bg-neutral-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Insights</span>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-black dark:text-white mt-3">
              Latest Legal Insights
            </h2>
          </div>
          <Link to="/blog">
            <Button variant="outline" size="sm">View All Articles</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                <Badge>{post.category}</Badge>
                <h3 className="font-semibold text-black dark:text-white mt-3 mb-2 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Calendar size={12} />
                    {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </div>
                  <span className="text-sm font-medium text-black dark:text-white inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
