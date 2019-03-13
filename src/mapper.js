/*
 * json-reform
 * Copyright (c) 2019 Andy Tran (https://github.com/andycillin/json-reform)
 * MIT Licensed
 */

"use strict";
const {isFunction} = require('./helper');


function Reformer(rules, opts = {}) {

    this.rules = rules;
    this.settings = {
        keepUnlisted: false,
        async: false,
        sequential: false
    };

    this.settings = {...this.settings, ...opts};

}

Reformer.prototype.compile = function () {
    let self = this;
    return function (obj) {

        let dest = {};
        let modifiers = [];
        for (let attr in obj) {
            if (self.rules.hasOwnProperty(attr)) {
                let handler = self.rules[attr];
                let modifier;
                if (Array.isArray(handler)) {
                    modifier = self.handleMultiple(handler, attr, obj);
                    modifiers = modifiers.concat(modifier);
                } else {
                    modifier = self.handleSingle(handler, attr, obj);
                    modifiers.push(modifier);
                }
            } else if (self.settings.keepUnlisted) {
                dest[attr] = obj[attr];
            }
        }

        if (self.settings.async) {
            return Promise.all(modifiers).then(data => {
                dest = self.combineAllProps(data, dest);
                return dest;
            });
        }

        return self.combineAllProps(modifiers, dest);
    }
};

Reformer.prototype.combineAllProps = function (modifiers, dest) {
    if (Array.isArray(modifiers)) {
        dest = modifiers.reduce((attr, curr) => {
            return {...curr, ...attr}
        }, dest);
    } else {
        dest = {...dest, ...modifiers};
    }
    Object.keys(dest).forEach(key => dest[key] === undefined && delete dest[key]);
    return dest;
};


Reformer.prototype.promiseSwitch = function (field, val) {
    let retVal = {};
    if (this.settings.async) {
        if (val && isFunction(val.then)) {
            return val.then(v => {
                retVal[field] = v;
                return retVal;
            });
        } else {
            retVal[field] = val;
            return Promise.resolve(retVal);
        }
    }

    retVal[field] = val;
    return retVal;
};

Reformer.prototype.handleSingle = function (handler, attr, obj) {
    let field;
    let val;
    // Handler is a fully defined descriptor
    if (handler.hasOwnProperty('name')
        && handler.hasOwnProperty('handler')
        && isFunction(handler.handler)
        && 'string' === typeof handler.name) {
        field = handler.name;
        val = handler.handler(obj[attr], obj);
    } else if ('string' === typeof handler) {
        // Shorthand for attribute renaming
        val = obj[attr];
        field = handler;
    } else if (isFunction(handler)) {
        // Shorthand for attribute value modifying
        field = attr;
        val = handler(obj[attr], obj);
    } else if (handler === true) {
        // Shorthand for attribute copy
        field = attr;
        val = obj[attr];
    } else if (handler === false) {
        field = attr;
        val = undefined;
    }
    return this.promiseSwitch(field, val);
};

Reformer.prototype.handleMultiple = function (handlers, attr, obj) {
    let self = this;
    let promises = [];
    if (Array.isArray(handlers)) {
        handlers.forEach(function (handler) {
            let val = self.handleSingle(handler, attr, obj);
            promises.push(val);
        });
    }
    return promises;
};

Reformer.prototype.transform = function (obj) {
    const t = this.compile(this.rules);

    if (Array.isArray(obj)) {

        if (this.settings.sequential && this.settings.async) {
            let currentPromise = Promise.resolve([]);
            obj.forEach(o => {
                currentPromise = currentPromise.then(res => t(o).then(r => [...res, r]));
            });
            return currentPromise;
        }

        let promises = [];
        obj.forEach(o => {
            promises.push(t(o));
        });

        if (this.settings.async) {
            return Promise.all(promises);
        }

        return promises;


    }
    return t(obj);
};


module.exports = Reformer;