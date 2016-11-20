'use strict;'

import './index.html';
//import 'babel-core/polyfill';

import './styles/main.scss';

import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import App from "./app.jsx";

 ReactDOM.render(React.createElement(App, {buildprops: buildprops}), document.getElementById('app'));
