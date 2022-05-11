import { store } from './store';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import './i18n'; // initialized i18next instance
import './main.scss';

import App from './interface/App';

/*
 * Here is where the react endpoint appears
 *
 */
ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('app')
);
