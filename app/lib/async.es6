'use strict';
// https://www.promisejs.org/generators/
// calling pattern async (<generator function that yield promises>)
export default function async(makeGenerator){

  return function (...args) {
    // Calling a generator function does not execute its body immediately;
    // an iterator object for the function is returned instead
    var generator = makeGenerator(...args);

    function handle(result){
      // result => { done: [Boolean], value: [Object] }
      //if (result.done) return Promise.resolve(result.value);
      if (result.done) return Promise.resolve(result.value);

      return Promise.resolve(result.value).then(function (res){
        return handle(generator.next(res));
      }, function (err){
        return handle(generator.throw(err));
      });
    }

    try {
      // When the iterator's next() method is called, the generator function's
      // body is executed until the first yield expression
      return handle(generator.next());
    } catch (ex) {
      return Promise.reject(ex);
    }
  }
}
