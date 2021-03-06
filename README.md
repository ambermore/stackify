# stackify.js

First stack with FIFO in mind. It provides you simple and effective way to handle asynchronous JavaScript. Till now we are living in Promise Tower to avoid Pyramid of Doom, but still it’s uncomfortable for programmers who are dealing with huge number of rest requests (or same family request which moves too slowly). So I come-up with mine own implementation of promise tower that provides easy way to handle nested callbacks; and while doing so you can specify frequency slab for parallel processing. So now we can go serially, parallelly or any-ly :-). Again it support old-school coding, which runs on conventional modal of Promise Tower; all of this packed in one small .js file. **In short, stackify.js is just more than promise.** 


###Installation:
```javascript
$ npm install stackify
```

For client side html

```html
<script language='JavaScript' src='stackify.js'></script>
```

###Quick start:
```javascript
// Example for defining stackify processor.
var stackify_processor = new STACKIFY(function(index, stackify){
    // Your current processing item, you can use this for your rest function.
    var item = stackify.item(index);
    
    your_rest_function(item, function(output) {
        // It will ask stackify to run processor against next item.
        stackify.next(index, output);
    });
}, function(index, stackify) {
    // You can place common code over here, 
    // which needs to be run after processing of each item.
    // It will give current request object.
    var current_request = stackify.request(index);
    
    // It will give current request output if any.
    var output = current_request.output;
    
    // It will give current request error if any.
    var error = current_request.error;
}, function(index, stackify) {
    // Your last code of execution.
});

// Now run this processor with any number of item collection.
stackify_processor.process({
    'items': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 
    // Here we can consider number of items equals to number of requests. 
    'slab': 3 
    // This specifies frequency for parallel processing.
});

```

Above request processor can be used with different item collection, somewhere else.
```javascript
// We will run this processor with different item collection.
stackify_processor.process({
    'items': [{
        'id': 1,
        'name': 'Jack Jefferson',
        'gender': 'male'
    }, {
        'id': 2,
        'name': 'Molly Hooper',
        'gender': 'female'
    }], 
    'other_data': {
        
    },
    'headers': {
        
    }
    // Here we specified other optional data, that we can use in our processor.
    // If we will not specify slab it will parallelly process all items. 
    // Quick hack: For same we can specify slab as 0.
});
```

To use optional parameters or data, we need to do little change in our processor.
```javascript
// So our change processor will be as
var stackify_processor = new STACKIFY(function(index, stackify){
    // Your current processing item, you can use this for your rest function.
    var item = stackify.item(index);
    
    // This will gives us other_data.
    var other_data = stackify.options.other_data;
    
    // This will gives us headers.
    var headers = stackify.options.headers;
    
    // This will gives us collection of items.
    var all_items = stackify.options.items;
    
    // So, we can also find our current item from items collection as
    item = stackify.options.items[index];
    
    your_rest_function(item, function(output) {
        // This will ask stackify to run processor against next item.
        stackify.next(index, output);
    });
}, function(index, stackify) {
    // You can place common code over here, 
    // which needs to be run after processing of each item.
    // So, we can find current request also from requests collection.
    var current_request = stackify.requests[index];
    
}, function(index, stackify) {
    // Your last code of execution.
    // So we can have all requests` output  or error at last by
    var requests = stackify.requests;
});
```

Now, how we can specify our nested processor?
```javascript
// This will be our nested processor.
var stackify_child_processor = new STACKIFY(function(index, stackify){
    // Your current processing item, you can use this for your rest function.
    var item = stackify.item(index);

    your_rest_function(item, function(output) {
        // This will ask stackify to run processor against next item.
        stackify.next(index, output);
    });
}, function(index, stackify) {

}, function(index, stackify) {
    // On completion we will execute next method of parent.
    stackify.parent.next(stackify.parent.index, stackify.requests);
}, 'stackify_child_processor');
// Now here we specified processor name 'stackify_child_processor', this is optional.

// This will be our parent processor.
var stackify_parent_processor = new STACKIFY(function(index, stackify){
    // Your current processing item, you can use this for your rest function.
    var item = stackify.item(index);
    // Current processor name.
    var name = stackify.name;

    your_rest_function(item, function(output) {
        // This will ask stackify to run child processor.
        stackify_child_processor.process({
            'items': output
            // Here we have consider 'output' is array.
        }, stackify);
        
        // No next is required for this, 
        // we will call next of this processor from child.
    });
}, function(index, stackify) {
    // Now, in this case we will have actual use of this method.
    // Since, we cannot write our common execution code in rest callback.
}, function(index, stackify) {
    // Your last code of execution.
    // So, we can have all requests` output or error at last by
    var requests = stackify.requests;
}, 'stackify_parent_processor');
```

###Conventional Promise:
How we can support our old code, we can do this by-
```javascript
(new STACKIFY()).then(function(value) {
    console.log(new Date());
    // This will be forward to next then method.
    return 10;
}).then(function(value) {
    console.log(new Date());
    console.log('Earlier request output: ', value);
    return value + 20;
}).then(function(value) {
    console.log(new Date());
    console.log('Earlier request output: ', value);
    return value + 30;
}).catch(function(requests) {
    // In case of any error, this will get executed.
}).done(function(requests) {
        // This will get executed at last.
});
```

For handling our rest callback, we need to pass options to STACKIFY constructor.
```javascript
// Here we are passing require_next as 'true'.
(new STACKIFY({
    'require_next': true,
    'on_error_stop': true
    // In case of any error, instantly it will halt our next step execution.
})).then(function(value, next) {
    console.log(new Date());
    // This will be forward to next then method.
        next(10);
}).then(function(value, next) {
        console.log(new Date());
    console.log('Earlier request output: ', value);
        next(20);
}).then(function(value, next) {
    console.log(new Date());
    console.log('Earlier request output: ', value);

    your_rest_function(value, function(output) {
        next(output);
    });
}).catch(function(requests, execution_halt_at) {
    // In case of any error, this will get executed.
    // 'execution_halt_at' will give us index at which execution got halt.
    console.log('Execution halt at: ', execution_halt_at);
    console.log('Error: ', requests[execution_halt_at].error);
}).done(function(requests) {
        // This will get executed at last.
});
```

We can also pass collection of methods to our processor by .all method.
```javascript
(new STACKIFY()).all([function(value) {
    console.log(new Date());
    // This will be forward to next then method.
        return 10;
}, function(value) {
        console.log(new Date());
    console.log('Earlier request output: ', value);
        return value + 20;
}, function(value) {
    console.log(new Date());
    console.log('Earlier request output: ', value);
    return value + 30;
}]).then(function(value) {
    console.log(new Date());
    console.log('Earlier request output: ', value);
    return value + 40;
}).catch(function(requests, execution_halt_at) {
    // In case of any error, this will get executed.
    // 'execution_halt_at' will give us index at which execution got halt.
}).done(function(requests) {
        // This will get executed at last.
});

// Quick hack: With this, we can also use 'require_next' and other options.
```

Again, if we need to delay our next execution we can do that with .delay method.
```javascript
(new STACKIFY()).then(function(value) {
    console.log(new Date());
    // This will be forward to next then method.
        return 10;
})
// This will delay next execution for 10 seconds.
.delay(10000).then(function(value) {
        console.log(new Date());
    console.log('Earlier request output: ', value);
        return value + 20;
}).then(function(value) {
    console.log(new Date());
    console.log('Earlier request output: ', value);
    return value + 30;
}).catch(function(requests, execution_halt_at) {
    // In case of any error, this will get executed.
    // 'execution_halt_at' will give us index at which execution got halt.
}).done(function(requests) {
        // This will get executed at last.
});
```

####Till now that’s all, Thanks Folks!


###License
Copyright 2014, Amber More - MIT License (enclosed)
