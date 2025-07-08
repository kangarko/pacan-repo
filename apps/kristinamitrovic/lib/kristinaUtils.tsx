import fs from 'fs';
import path from 'path';

// ------------------------------------------------------------------------------------------------
// Post related
// ------------------------------------------------------------------------------------------------

export async function getSortedPostsData() {
    const postsDirectory = path.join(process.cwd(), 'components', 'posts');
    const fileNames = fs.readdirSync(postsDirectory).filter(fileName => fileName.endsWith('.tsx'));

    const allPostsData = await Promise.all(fileNames.map(async (fileName) => {
        const slug = fileName.replace(/\.tsx$/, '');
        const postModule = await import(`@/components/posts/${fileName}`);

        return {
            slug,
            ...postModule.meta,
        };
    }));

    return allPostsData.sort((a, b) => {
        if (a.date < b.date) {
            return 1;
        } else {
            return -1;
        }
    });
}

export async function getPostData(slug: string) {
    try {
        const postModule = await import(`@/components/posts/${slug}.tsx`);

        return {
            slug,
            frontmatter: postModule.meta,
            PostComponent: postModule.default,
        };
    } catch (error) {
        console.error(`Error loading post ${slug}:`, error);
        return null;
    }
}