import { uniqueId, differenceBy } from 'lodash';
import axios from 'axios';
import * as yup from 'yup';
import i18next from 'i18next';
import { CORS_API_URL, FORM_CONDITIONS, CHECK_POSTS_TIMEOUT } from './constants';
import { PostObject, State, FeedObject } from './types';

export const getErrorsText = (errors: string[]) => errors
    .map((text) => i18next.t(`errorMessages.${text}`))
    .join('. ');

const validateCurrentUrl = (currentUrl: string, addedURLs: string[]) => yup
    .string()
    .url('invalidUrl')
    .required('')
    .notOneOf(addedURLs, 'hasUrlYet')
    .validate(currentUrl);

const updateValidationState = (state: State) => {
    const { url } = state.form.fields;
    const addedURLs = state.feeds.map((feed) => feed.url);
    validateCurrentUrl(url, addedURLs)
        .then(() => {
            state.form.errors = [];
            state.form.valid = true;
        })
        .catch((err) => {
            state.form.errors = err.errors;
            state.form.valid = false;
        });
};

const parseFeedXML = (xml: string) => {
    const parser = new DOMParser();
    const xmlDomTree = parser.parseFromString(xml, 'text/xml');
    const feedId = uniqueId();
    const channel = xmlDomTree.querySelector('channel');
    const feed: FeedObject = {
        id: feedId,
        url: '',
        feedTitle: channel.querySelector('title').textContent,
        feedDescription: channel.querySelector('description').textContent,
    };

    const posts: Array<PostObject> = [];
    const postsNodes = channel.querySelectorAll('item');
    for (let i = 0; i < postsNodes.length; i++) {
        const item = postsNodes[i];
        posts.push({
            feedId,
            postTitle: item.querySelector('title').textContent,
            postDescription: item.querySelector('description').textContent,
            link: item.querySelector('link').textContent,
        })
    }

    return { feed, posts };
};

export const checkForNewPosts = (state: State) => {
    setTimeout(checkForNewPosts, CHECK_POSTS_TIMEOUT, state);
    const { feeds } = state;
    feeds.map(({ url }) => url)
        .forEach((url) => {
            const corsUrl = `${CORS_API_URL}${url}`;
            axios.get(corsUrl)
                .then(({ data }) => {
                    const { feed, posts } = parseFeedXML(data);
                    const { feedTitle } = feed;
                    const currentFeed = feeds.find((el) => el.feedTitle === feedTitle);
                    const { id } = currentFeed;
                    const newPosts = posts.map((post) => ({ ...post, feedId: id }));
                    const diffPosts = differenceBy(newPosts, state.posts, 'postTitle');
                    Array.prototype.push.apply(state.posts, diffPosts);
                })
                .catch((err) => {
                    throw err;
                });
        });
};

export const setListeners = (state: State) => {
    const input = document.querySelector('.jumbotron__input');
    const form = document.querySelector('form');

    input.addEventListener('input', (event: Event) => {
        state.form.processState = FORM_CONDITIONS.FILLING;
        const target = event.target as HTMLInputElement;
        state.form.fields.url = target.value;
        updateValidationState(state);
    });

    form.addEventListener('submit', (event: Event) => {
        event.preventDefault();
        state.form.processState = FORM_CONDITIONS.ADDING;
        const currentURL = state.form.fields.url;
        const url = `${CORS_API_URL}${currentURL}`;
        axios.get(url)
            .then(({ data }) => {
                const { feed, posts } = parseFeedXML(data);
                const feedWithUrl = { ...feed, url: currentURL };
                state.posts = [ ...state.posts, ...posts ];
                state.feeds.push(feedWithUrl);
                state.form.processState = FORM_CONDITIONS.FINISHED;
                state.form.fields.url = '';
            })
            .catch((err) => {
                state.form.errors = [ 'network' ];
                state.form.valid = false;
                state.form.processState = FORM_CONDITIONS.FILLING;
                throw err;
            });
    });
};
