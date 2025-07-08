import { getSortedPostsData } from '@/lib/kristinaUtils';
import BlogPageClient from '@/app/blog/BlogPageClient';

export default async function BlogPage() {
    const allPosts = await getSortedPostsData();
    const categories = ['Sve', ...new Set(allPosts.map((post: any) => post.category))];

    return <BlogPageClient posts={allPosts} categories={categories} />;
} 