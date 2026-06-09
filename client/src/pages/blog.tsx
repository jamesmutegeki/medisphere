import { useParams, Link } from "react-router-dom";
import { Calendar, ArrowLeft, User } from "lucide-react";
import { blogPosts } from "../data/blog";
import Badge from "../components/ui/badge";
import Button from "../components/ui/button";

function BlogPostDetail() {
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) return <div className="py-20 text-center">Article not found.</div>;

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-black mb-6">
          <ArrowLeft size={16} /> Back to Articles
        </Link>
        <img src={post.image} alt={post.title} className="w-full h-64 lg:h-80 object-cover rounded-xl mb-8" loading="lazy" />
        <Badge>{post.category}</Badge>
        <h1 className="font-serif text-3xl lg:text-4xl font-bold text-black dark:text-white mt-4 mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-neutral-500 mb-8">
          <span className="flex items-center gap-1.5"><Calendar size={14} />{new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          <span className="flex items-center gap-1.5"><User size={14} />{post.author}</span>
        </div>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="lead text-lg text-neutral-600 dark:text-neutral-400">{post.excerpt}</p>
          <p>This article provides an in-depth analysis of important legal developments affecting businesses today. Our team of expert attorneys brings their extensive experience to bear on these complex issues.</p>
          <p>For personalized legal advice on this topic, please <Link to="/contact" className="text-black dark:text-white underline">contact our team</Link>.</p>
        </div>
      </div>
    </section>
  );
}

export default function Blog() {
  const { slug } = useParams();

  if (slug) return <BlogPostDetail />;

  return (
    <>
      <section className="bg-neutral-900 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Insights & Updates</span>
          <h1 className="font-serif text-4xl lg:text-5xl font-bold text-white mt-4 mb-6">Latest Articles</h1>
          <p className="text-lg text-neutral-300 max-w-3xl mx-auto">
            Stay informed with the latest legal insights, analysis, and updates from our team.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <div className="p-5">
                  <Badge>{post.category}</Badge>
                  <h3 className="font-semibold text-black dark:text-white mt-3 mb-2 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-4">{post.excerpt}</p>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Calendar size={12} />
                    {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
