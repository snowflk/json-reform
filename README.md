# JSON-Reform

A mini NodeJS library that helps you transform JSON objects faster & easier. 

## Installation
Using NPM:
```
npm install json-reform
```

In browser:

```html
<script src="reform.js"></script>
```
## Usage
```javascript
const re = new Reformer(rules [,opts])
```
### Transformation Rules
`rules` is an object whose keys are names of attributes that you want to transform, values define how these attribute will be transformed.

There are multiple ways to define them: 

#### Rename an attribute
```javascript
{
  old_name: "new_name"
}
```

#### Do something with the value
```javascript
{
  version: function(v){
      return v+1;
  }
}
```

#### Full definition
```javascript
{
  version: {
      name: 'ver',
      handler: function(v){
          return v+1;
      }
  }
}
```

#### One to many relationship
Attribute `a` will be transformed to `a`, `b` and `c` in the new object.
```javascript
{
  a: [
      // this produces a
      function(val){
        return val-1;
      },
      
      // this produces b
      "b",
      
      // this produces c
      {
        name: "c",
        handler: function(old_value){
            return old_value + 1;
        }
      }]
}
```

#### Many to one relationship
You can access other attribute with the second parameter in the handler function.
```javascript
{
  x: {
      name: 'z',
      handler: function(x, obj){
          const y = obj.y;
          return x+y;
      }
  }
}
```



### Options
Name|Type|Default|Description
:-----------|:------|:----|:-----------
keepUnlisted|Boolean|false|Attributes of origin object that are not listed in schema will be kept.
async       |Boolean|false|transform() function will return a Promise. This option must be set to true when you are using any asynchronous function

## Example

```javascript
const Reformer = require('json-reform');

const re = new Reformer({
    a: "b",
    c: {
        name: "d",
        handler(val, obj) {
            return val + 1;
        }
    },
    d: [{
        name: "e",
        handler(val) {
            return val + 1;
        }
    }, {
        name: "f",
        handler(val) {
            return val + 2;
        }
    }]
}, {keepUnlisted: true});

const result = re.transform({a: 1, b: 2, c: 3, d: 5, g: 0});
console.log(result);
```

Output:
```javascript
{ f: 7, e: 6, d: 4, b: 2, g: 0 }
```

You can also transform an array of objects

```javascript
const result = re.transform([{a: 1, b: 2, c: 3, d: 5, g: 0}]);
```

Output:
```javascript
[
    { f: 7, e: 6, d: 4, b: 2, g: 0 }
]
```

When `async` option is `true`:
```javascript
re.transform([{a: 1, b: 2, c: 3, d: 5, g: 0}])
    .then(res => {
        // Do something
    })
```

## License

MIT © Thien Phuc Tran
