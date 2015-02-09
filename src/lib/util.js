/**
 * Created by keith on 03/02/15.
 */
const React = require("react");

function Element(el) {
    return React.createFactory(el);
}

function Elements(obj) {
    var res = {};
    for (var k in obj) {
        var el = obj[k];
        if (typeof el === "function" && el.isReactLegacyFactory) {
            res[k] = React.createFactory(obj[k]);
        }
    }
    return res;
}

module.exports = {
    Element,
    Elements
};