import watchState from './watchers';
import { checkForNewPosts, setListeners } from './utils';
import { initializeI18next } from './languages/utils';
import { FORM_CONDITIONS } from './constants';
import { State } from './types';

const app = () => {
    const state: State = {
        feeds: [],
        posts: [],
        currentLang: 'English',
        form: {
            processState: FORM_CONDITIONS.FINISHED,
            fields: {
                url: '',
            },
            errors: [],
            valid: false,
        },
    };

    initializeI18next(state);

    setListeners(state);

    checkForNewPosts(state);
    watchState(state);
};

export default app;
