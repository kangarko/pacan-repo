import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@repo/ui/components/Navigation';
import { ArrowLeft, Calendar, Tag, User } from 'lucide-react';
import Image from 'next/image';
import { getPostData, getSortedPostsData } from '@/lib/kristinaUtils';
import CtaToSalesPageSection from '@/components/CtaSection';
import FooterSection from '@repo/ui/components/FooterSection';

export async function generateStaticParams() {
    const posts = await getSortedPostsData();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await getPostData(slug);

    if (!post)
        notFound();

    const { PostComponent } = post;

    return (
        <div className="min-h-screen bg-[#FFF9E9] text-[#4b2c5e]">
            <Navigation />

            {/* Header Image Section */}
            {post.frontmatter.headerImage && (
                <div className="relative h-[400px] md:h-[500px] overflow-hidden">
                    <Image
                        src={post.frontmatter.headerImage}
                        alt={post.frontmatter.headerImageAlt || post.frontmatter.title}
                        fill
                        className="object-cover"
                        priority
                    />

                    {/* Keep this as it makes the header readable in blog headline cover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#FFF9E9] via-[#FFF9E9]/50 to-transparent" />

                    {/* Header Content Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end">
                        <div className="max-w-4xl mx-auto px-4 pb-8">
                            {/* Back button - subtle on mobile */}
                            <div className="mb-4">
                                <Link
                                    href="/blog"
                                    className="inline-flex items-center text-[#4b2c5e]/80 hover:text-[#4b2c5e] bg-[#FFF9E9]/60 backdrop-blur-sm px-3 py-1.5 rounded-md transition-all hover:bg-[#FFF9E9]/80 text-sm"
                                >
                                    <ArrowLeft size={14} className="mr-1.5" />
                                    <span>Povratak</span>
                                </Link>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold text-[#4b2c5e] mb-4">{post.frontmatter.title}</h1>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-[#4b2c5e]/80">
                                <span className="flex items-center gap-2">
                                    <User size={14} />
                                    Kristina Mitrović
                                </span>
                                <span className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    {new Date(post.frontmatter.date).toLocaleDateString('hr-HR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Tag size={12} />
                                    <span className="font-medium">{post.frontmatter.category}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Image Credit */}
                    {post.frontmatter.headerImageCredit && (
                        <div className="absolute bottom-[-2] right-2 text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
                            {post.frontmatter.headerImageCredit}
                        </div>
                    )}
                </div>
            )}

            {/* Back link and header for posts without header image */}
            {!post.frontmatter.headerImage && (
                <>
                    <div className="max-w-4xl mx-auto">
                        {/* Back button - subtle design */}
                        <div className="mb-6">
                            <Link
                                href="/blog"
                                className="inline-flex items-center text-[#4b2c5e]/80 hover:text-[#4b2c5e] transition-colors text-sm"
                            >
                                <ArrowLeft size={14} className="mr-1.5" />
                                <span>Povratak</span>
                            </Link>
                        </div>
                    </div>

                    <article className="max-w-4xl mx-auto">
                        <header className="mb-12 text-center">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#4b2c5e] mb-4">{post.frontmatter.title}</h1>

                            {/* Category badge - centered below title */}
                            <div className="mb-6">
                                <div className="inline-flex items-center gap-1.5 bg-[#6B498F] text-white px-3 py-1 rounded-full font-medium text-sm">
                                    <Tag size={12} />
                                    <span>{post.frontmatter.category}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-sm text-[#4b2c5e]/80">
                                <span className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    {new Date(post.frontmatter.date).toLocaleDateString('hr-HR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        </header>
                    </article>
                </>
            )}
            <article className="prose-content mx-auto max-w-3xl px-4 pt-6 pb-12">
                <PostComponent />
            </article>
            <CtaToSalesPageSection />
            <FooterSection />
        </div>
    );
} 