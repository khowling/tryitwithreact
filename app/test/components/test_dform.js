//import { expect } from 'chai';
import React from 'react/addons';
import App from '../../app.jsx';
import {ListPage, RecordPage} from '../../components/dform.jsx';
//import sd from 'skin-deep';

const TestUtils = React.addons.TestUtils;

describe('Dform ListPage Component', function() {
  const postData = [
    { id: 1, title: 'Title 1', content: '<p>Content 1</p>' },
    { id: 2, title: 'Title 2', content: '<p>Content 2</p>' },
    { id: 3, title: 'Title 3', content: '<p>Content 3</p>' }
  ];

  it('should render a list of post components', function() {
    const shallowRenderer = React.addons.TestUtils.createRenderer();

    shallowRenderer.render(React.createElement(App, {buildprops: "http://localhost:3000"}));
    const output = shallowRenderer.getRenderOutput();
    console.log ('out: ' + JSON.stringify(output));
    //expect(items.length).to.equal(postData.length);
  });
});
