declare module 'content-collections' {
  export interface Author {
    ref: string;
    name: string;
    avatar: string;
  }

  export interface Post {
    title: string;
    description: string;
    published: string;
    category: string;
    author?: Author;
    slug: string;
    slugAsParams: string;
    body: {
      raw: string;
      code: string;
    };
  }

  export interface Doc {
    title: string;
    description: string;
    slug: string;
    slugAsParams: string;
    body: {
      raw: string;
      code: string;
    };
  }

  export const allPosts: Post[];
  export const allDocs: Doc[];
  export const allAuthors: Author[];
}