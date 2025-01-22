# Browser Support

Sutando now supports running in browser environments in addition to server-side usage. The browser version supports core functionalities such as Models, Attributes, and Relations, but does not include database-related features like Query Builder.

## Using with Full-Stack Frameworks

When working with full-stack frameworks like Next.js or Nuxt.js, you can define your models once and use them in both frontend and backend. This ensures code consistency and eliminates the need for duplicate definitions.

However, if you need to use Node.js-specific features in your models (like file system operations), it's recommended to organize your code as follows:

1. Create a base model class containing shared logic for both frontend and backend
2. Create a server-side model class that extends the base model for Node.js-specific features

```javascript
// models/base/user.js - Shared base model
export class BaseUser extends Model {
  // Shared properties and methods
}

// models/server/user.js - Server-only model
export class User extends BaseUser {
  // Node.js specific features
}
```

## Core Features

### make Function

The `make` function converts API response data into model instances, allowing you to use all model features including accessors and mutators.

```javascript
const { make } = require('sutando');
const user = make(User, data);
```

### makeCollection Function

The `makeCollection` function transforms an array of API response data into a collection of model instances.

```javascript
const { makeCollection } = require('sutando');
const users = makeCollection(User, data);
```

### makePaginator Function

The `makePaginator` function converts paginated API response data into a Paginator instance.

```javascript
const { makePaginator } = require('sutando');
const pageData = makePaginator(User, data);
```

## Usage Examples

```javascript
// Convert API response to model instance
const response = await fetch('/api/users/1');
const data = await response.json();
const user = make(User, data);

// Use model accessors and other features
console.log(user.full_name);  // Assuming a full_name accessor exists

// Handle list data
const usersResponse = await fetch('/api/users');
const usersData = await usersResponse.json();
const users = makeCollection(User, usersData);

// Handle paginated data
const pageResponse = await fetch('/api/users?page=1');
const pageData = await response.json();
const paginator = makePaginator(User, pageData);