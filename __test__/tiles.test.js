// Copyright 2004-present Facebook. All Rights Reserved.
/* eslint-disable no-unused-vars */

'use strict';

import React from 'react';
import App from '../app/app.jsx';
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  const component =  renderer.create(
    <App buildprops={{ server_url: 'http://localhost:3000'}}/>
  )
  let tree = component.toJSON()
  expect(tree).toMatchSnapshot();
});

