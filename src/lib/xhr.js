/* Convert npm xhr into channels

 xhr:  A small xhr wrapper. Designed for use with browserify.
 returned object is either an XMLHttpRequest instance or an XDomainRequest instance

 this returns a channel, not a promis!


 Channels are useful for coordinating truly concurrent tasks that might run at the same time on separate threads
 They solve a more general problem of coordinating anything asynchronous, which is everything in JavaScript
 Using a channel is not that different from using a promise

 Processes are simple light-weight cooperative threads, use channels to pass messages, and block execution when taking or putting from channels

 Generators are coming to JavaScript and allow us to suspend and resume functions

 Use take and put to operate on channels within a process (use putAsync outside a process)

 take gets a value and blocks if one isn't available
 put puts a value on a channel and blocks if a process isn't available to take it

 */

const csp = require('./csp');
const { go, chan, take, put } = csp;
const _xhr = require('xhr');

function xhr(opts, ch) {
    // use the passed in 'ch', or, create a new channel is unbuffered (synchronization)
    ch = ch || chan();
    _xhr(opts, function(err, res, body) {
        let result = { raw: res, body: body };
        let value;

        if(err) {
            value = csp.Throw(err);
        }
        else if(res.statusCode !== 200) {
            value = csp.Throw(new Error(body));
        }
        else if(res.headers['content-type'].indexOf('application/json') !== -1) {
            result.json = JSON.parse(body) || false;
            value = result;
        }
        else {
            value = result;
        }

        // functions allow you to put values on channels outside of a go block, and can take callbacks which run when completed
        csp.putAsync(ch, value, () => ch.close());
    });
    // return the channel
    return ch;
}

module.exports = xhr;