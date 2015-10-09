'use strict;'

import './index.html';
import 'babel-core/polyfill';

import './styles/main.scss';

import React, {Component} from 'react';
import App from "./app.jsx";

 React.render(React.createElement(App, {buildprops: buildprops}), document.getElementById('app'));
