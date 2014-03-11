var STACKIFY = module.exports = function (rest_method, common_method, last_method, name) {
    try {
        var self = this;
        self.rest_method = function () {};
        self.common_method = function () {};
        self.last_method = function () {};
        self.name = "";

        self.item = function (index) {
            self.index = index;
            return self.options.items[self.index];
        };

        var process_batch = function (from) {
            from = from || 0;
            var to = from + self.slab;
            to = (to < self.total_items) ? to : self.total_items;

            for (var i = from; i < to; i++) {
                self.requests.push({
                    "id": ""
                });
                self.rest_method(i, self);
            }
        };

        self.init = function () {
            if (self.total_items > 0) {
                self.slab = (self.slab < self.total_items) ? self.slab : self.total_items;
                process_batch();
            } else {
                self.last_method(-1, self);
            }
        };

        self.error = function (rest_error) {
            var output;
            self.next(output, rest_error);
        };

        self.next = function (index, rest_output, rest_error) {
            self.index = index;
            self.total_process_requests++;
            self.ok(self.index, rest_output, rest_error);

            if (self.total_process_requests >= self.total_items) {
                self.last_method(self.index, self);
            } else {
                if ((self.total_process_requests % self.slab) == 0) {
                    process_batch(self.total_process_requests);
                }
            }
        };

        self.ok = function (index, rest_output, rest_error) {
            if (typeof (self.requests[index]) != "undefined") self.requests[index].output = rest_output;
            if (typeof (self.requests[index]) != "undefined") self.requests[index].error = rest_error;
            self.common_method(index, self);
        };

        self.process = function (options, parent) {
            self.index = 0;
            self.total_process_requests = 0;
            self.requests = [];
            self.options = options || {};
            self.options.items = self.options.items || [];
            self.total_items = self.options.items.length;
            self.slab = options.slab || self.total_items;
            if (self.slab == 0) {
                self.slab = self.total_items;
            }
            if (typeof (rest_method) == "function") self.rest_method = rest_method;
            if (typeof (common_method) == "function") self.common_method = common_method;
            if (typeof (last_method) == "function") self.last_method = last_method;
            if (typeof (name) == "string") self.name = name;
            if (typeof (parent) != "undefined") {
                self.parent = parent;
            }

            rest_method = null, common_method = null, last_method = null, parent = null, name = "";
            self.init();
        };
    } catch (e) {

    }
};