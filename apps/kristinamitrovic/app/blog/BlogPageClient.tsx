'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight, Tag, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Navigation from '@repo/ui/components/Navigation';
import { useRouter, useSearchParams } from 'next/navigation';
import NewsletterSection from '@repo/ui/components/NewsletterSection';
import FooterSection from '@repo/ui/components/FooterSection';

interface BlogContentProps {
    posts: any[];
    categories: string[];
    featuredPost: any;
}

function BlogContent({ posts, categories, featuredPost }: BlogContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeCategory, setActiveCategory] = useState('Sve');
    const postsPerPage = 9;

    const categoryFilteredPosts = activeCategory === 'Sve'
        ? posts.filter(p => p.slug !== featuredPost?.slug)
        : posts.filter(p => p.category === activeCategory && p.slug !== featuredPost?.slug);

    const totalPages = Math.ceil(categoryFilteredPosts.length / postsPerPage);

    const getPage = () => {
        const pageFromUrl = searchParams.get('page');
        const pageNum = parseInt(pageFromUrl || '1', 10);

        if (isNaN(pageNum) || pageNum < 1) 
            return 1;

        if (totalPages > 0 && pageNum > totalPages) 
            return totalPages;
        
        return pageNum;
    }

    const currentPage = getPage();

    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = categoryFilteredPosts.slice(indexOfFirstPost, indexOfLastPost);

    const paginate = (pageNumber: number) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', pageNumber.toString());
            router.push(`/blog?${params.toString()}`);
            window.scrollTo(0, 0);
        }
    };

    const handleCategoryChange = (category: string) => {
        setActiveCategory(category);
        router.push('/blog');
    };

    return (
        <>
            <section className="py-8 px-4 relative">
                {/* Subtle gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F1BBB0]/5 to-transparent" />
                
                <div className="max-w-6xl mx-auto relative">
                    <div className="flex flex-wrap gap-4 justify-center">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => handleCategoryChange(category)}
                                className={`px-5 py-2.5 rounded-full font-medium transition-all duration-300 transform hover:scale-105 ${activeCategory === category
                                    ? 'bg-gradient-to-r from-[#F1BBB0] to-[#D4B5A0] text-white'
                                    : 'bg-[#FFEAFF] text-[#4b2c5e] hover:bg-gradient-to-r hover:from-[#FFEAFF] hover:to-[#E1CCEB]'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {featuredPost && activeCategory === 'Sve' && currentPage === 1 && (
                <section className="py-12 px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-gradient-to-br from-[#FFEAFF]/60 via-[#F1BBB0]/20 to-[#E1CCEB]/30 rounded-2xl overflow-hidden relative group">
                            {/* Decorative gradient overlay */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-[#F1BBB0]/30 to-[#D4B5A0]/20 rounded-full blur-3xl" />
                            
                            {featuredPost.headerImage && (
                                <div className="relative h-64 md:h-80 overflow-hidden">
                                    <Image
                                        src={featuredPost.headerImage}
                                        alt={featuredPost.headerImageAlt || featuredPost.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                </div>
                            )}
                            <div className="p-8 relative">
                                <div className="flex items-center gap-4 text-sm text-[#4b2c5e]/80 mb-4">
                                    <span className="text-[#4b2c5e] px-4 py-1.5 rounded-full font-medium">
                                        ✨ Istaknuto
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar size={16} className="text-[#D4B5A0]" />
                                        {new Date(featuredPost.date).toLocaleDateString('hr-HR')}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-bold text-[#4b2c5e] mb-4">
                                    <Link href={`/blog/${featuredPost.slug}`} className="hover:text-[#6B498F] transition">
                                        {featuredPost.title}
                                    </Link>
                                </h2>
                                <p className="text-[#4b2c5e]/80 mb-6 text-lg">
                                    {featuredPost.excerpt}
                                </p>
                                <Link
                                    href={`/blog/${featuredPost.slug}`}
                                    className="inline-flex items-center hover:text-[#F1BBB0] font-semibold group transition-all duration-300"
                                >
                                    Pročitajte cijeli članak
                                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <section className="py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    {currentPosts.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {currentPosts.map(post => (
                                <article key={post.slug} className="bg-[#F1BBB0]/20 rounded-xl overflow-hidden transition-all duration-300 group relative">
                                    {/* Subtle gradient overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#F1BBB0]/0 to-[#D4B5A0]/0 group-hover:from-[#F1BBB0]/5 group-hover:to-[#D4B5A0]/5 rounded-xl transition-all duration-300 pointer-events-none" />
                                    
                                    {post.headerImage && (
                                        <Link href={`/blog/${post.slug}`} className="block relative h-48 overflow-hidden">
                                            <Image
                                                src={post.headerImage}
                                                alt={post.headerImageAlt || post.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </Link>
                                    )}
                                    <div className="p-6 relative">
                                        <div className="flex items-center gap-2 text-sm mb-4">
                                            <Tag size={14} />
                                            <span className="font-medium">{post.category}</span>
                                        </div>
                                        <h3 className="text-xl font-semibold text-[#4b2c5e] mb-3">
                                            <Link href={`/blog/${post.slug}`} className="hover:text-[#6B498F] transition">
                                                {post.title}
                                            </Link>
                                        </h3>
                                        <p className="text-[#4b2c5e]/80 mb-4">
                                            {post.excerpt}
                                        </p>
                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#E1CCEB]/50">
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {new Date(post.date).toLocaleDateString('hr-HR')}
                                                </span>
                                            </div>
                                            <Link
                                                href={`/blog/${post.slug}`}
                                                className="text-[#6B498F] hover:text-[#4b2c5e] font-bold text-2xl"
                                            >
                                                →
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <h3 className="text-2xl font-semibold text-[#4b2c5e]">Nema članaka</h3>
                            <p className="text-gray-500 mt-2">Nema dostupnih članaka u kategoriji &quot;{activeCategory}&quot;.</p>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-16 space-x-2">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-lg font-medium transition bg-[#FFEAFF] text-[#4b2c5e] hover:bg-[#E1CCEB] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowLeft size={16} />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => paginate(i + 1)}
                                    className={`w-10 h-10 rounded-lg font-medium transition ${currentPage === i + 1
                                        ? 'bg-[#6B498F] text-white'
                                        : 'bg-[#FFEAFF] text-[#4b2c5e] hover:bg-[#E1CCEB]'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-lg font-medium transition bg-[#FFEAFF] text-[#4b2c5e] hover:bg-[#E1CCEB] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

export default function BlogPageClient({ posts, categories }: { posts: any[], categories: string[] }) {
    const featuredPost = posts.find(post => post.featured);

    return (
        <div className="min-h-screen bg-[#FFF9E9]">
            <Navigation />
            
            <section className="py-20 px-4 bg-gradient-to-b from-[#E1CCEB]/20 to-[#FFF9E9]">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl font-bold text-[#4b2c5e] mb-6">Blog</h1>
                    <p className="text-xl text-[#4b2c5e]/80">
                        Članci o stilovima privrženosti, vezama i osobnom rastu
                    </p>
                </div>
            </section>

            <Suspense fallback={
                <div className="py-8 px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="animate-pulse">
                            <div className="flex flex-wrap gap-4 justify-center mb-8">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                                ))}
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="bg-gray-200 rounded-xl h-96"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            }>
                <BlogContent posts={posts} categories={categories} featuredPost={featuredPost} />
            </Suspense>

            <NewsletterSection />
            <FooterSection />
        </div>
    );
} 