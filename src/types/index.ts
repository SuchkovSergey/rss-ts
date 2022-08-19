export interface FeedObject {
    id: string;
    url: string;
    feedTitle: string;
    feedDescription: string;
}

export interface PostObject {
    feedId: string;
    postTitle: string;
    postDescription: string;
    link: string;
}

export interface State {
    feeds: Array<FeedObject>,
    posts: Array<PostObject>,
    currentLang: string,
    form: {
        processState: string,
        fields: {
            url: string,
        },
        errors: string[],
        valid: boolean,
    },
}