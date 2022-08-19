import { watch } from 'melanke-watchjs';
import { getErrorsText } from './utils';
import { FORM_CONDITIONS } from './constants';
import { State, PostObject } from './types';

const renderPosts = (currentPosts: Array<PostObject>) => {
    const postsDiv = document.querySelector('.main-body__posts-container');
    postsDiv.innerHTML = '';
    currentPosts.forEach((post) => {
        const { postTitle, postDescription, link } = post;
        const newDivElement = document.createElement('div');
        newDivElement.classList.add('mb-2', 'border-bottom');
        const postTitleElement = document.createElement('h5');
        const postsDescriptionElement = document.createElement('p');
        postTitleElement.innerHTML = `<a href="${link}">${postTitle}</a>`;
        postsDescriptionElement.textContent = postDescription;
        newDivElement.append(postTitleElement, postsDescriptionElement);
        postsDiv.append(newDivElement);
    });
};

const removeFeed = (state: State, feedIdToDelete: string) => () => {
    const { feeds, posts } = state;
    state.feeds = feeds.filter(({ id }) => id !== feedIdToDelete);
    state.posts = posts.filter(({ feedId }) => feedId !== feedIdToDelete);
};

const updateFeeds = (state: State) => {
    const feedsElement = document.querySelector('.main-body__feeds');
    feedsElement.innerHTML = '';
    state.feeds.forEach((feed) => {
        const { id, feedTitle, feedDescription } = feed;
        const newAElement = document.createElement('a');
        newAElement.setAttribute('href', '#');
        newAElement.classList.add('list-group-item', 'list-group-item-action');
        newAElement.addEventListener('click', (event) => {
            event.preventDefault();
        });
        const innerDiv = document.createElement('div');
        innerDiv.innerHTML = `<h4 class='mb-1 feedItem'>${feedTitle}</h4>`;
        const newPElement = document.createElement('p');
        newPElement.classList.add('mb-1');
        newPElement.textContent = feedDescription;
        feedsElement.append(newAElement);

        // Initializing "close" button
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.classList.add('close');
        closeButton.setAttribute('aria-label', 'close');
        closeButton.innerHTML = '<span aria-hidden="true">&times;</span>';
        closeButton.addEventListener('click', removeFeed(state, id));

        newAElement.append(closeButton, innerDiv, newPElement);

        newAElement.addEventListener('click', () => {
            const currentPosts = state.posts.filter(({ feedId }) => feedId === id);
            renderPosts(currentPosts);
            const activeElement = feedsElement.querySelector('.active');
            if (activeElement) {
                activeElement.classList.remove('active');
            }
            newAElement.classList.add('active');
        });
    });
};

// The main logic of "View" level
// Tracking changes of state, makes changes to the DOM
const watchState = (state: State) => {
    const input = <HTMLInputElement>document.querySelector('.jumbotron__input');
    const form = document.querySelector('form');
    const submitButton = <HTMLInputElement>form.querySelector('.jumbotron__submit');

    watch(state, 'currentLang', () => {
        const dropButton = document.querySelector('.jumbotron__dropdown-button');
        dropButton.textContent = state.currentLang;
    });

    watch(state.form, 'processState', () => {
        const { processState } = state.form;
        switch (processState) {
        case FORM_CONDITIONS.FILLING:
            submitButton.disabled = false;
            break;
        case FORM_CONDITIONS.ADDING:
            submitButton.disabled = true;
            break;
        case FORM_CONDITIONS.FINISHED:
            input.value = '';
            submitButton.disabled = true;
            break;
        default:
            throw new Error(`Unknown state: ${processState}`);
        }
    });

    watch(state.form, 'valid', () => {
        const { valid } = state.form;
        submitButton.disabled = !valid;
        if (valid) {
            input.classList.remove('is-invalid');
        } else {
            input.classList.add('is-invalid');
        }
    });

    watch(state.form, 'errors', () => {
        const errorElement = input.nextElementSibling;
        const { errors } = state.form;

        if (errorElement) {
            input.classList.remove('is-invalid');
            errorElement.remove();
        }
        if (errors.length > 0) {
            const feedbackElement = document.createElement('div');
            feedbackElement.classList.add('invalid-feedback', 'text-warning');
            feedbackElement.textContent = getErrorsText(errors);
            input.classList.add('is-invalid');
            input.after(feedbackElement);
        }
    });

    watch(state, 'feeds', () => {
        updateFeeds(state);
    });

    watch(state, 'posts', () => {
        renderPosts(state.posts);
    });
};

export default watchState;
