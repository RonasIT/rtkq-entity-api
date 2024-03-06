# RTK Query Entity API

Wrapper utilities for CRUD operations with REST APIs entities using [RTK Query](https://redux-toolkit.js.org/rtk-query/overview).

## Usage

1. Install the package:

```sh
npm i @ronas-it/rtkq-entity-api
```

2. Create base query with your API configuration, for example [using Axios](https://redux-toolkit.js.org/rtk-query/usage/customizing-queries#axios-basequery):

```ts
import axios from 'axios';
import { createApiCreator, createAxiosBaseQuery } from '@ronas-it/rtkq-entity-api';

const axiosBaseQuery = createAxiosBaseQuery({
  getHttpClient: () => axios.create({ baseURL: 'https://your-api-url.com' }),
});

export const createAppApi = createApiCreator({
  baseQuery: axiosBaseQuery,
});
```

3. Now you can generate your entity APIs with this creator:

```ts
import { createEntityApi } from '@ronas-it/rtkq-entity-api';
import { createAppApi } from 'your-project/utils';
import { User } from 'your-project/models';

export const usersApi = createEntityApi({
  entityName: 'user', // An entity name. Must by unique
  entityConstructor: User, // The entity model class constructor. Supports class-transformer
  baseApiCreator: createAppApi, // The api creator that shares configuration for new APIs
  baseEndpoint: '/users', // Endpoint, relative to base URL configured in the API creator
  omitEndpoints: ['create', 'update', 'delete'], // Allow only 'get' and 'search' methods
});
```

4. Use the api you created as usual one [created by RTK Query](https://redux-toolkit.js.org/rtk-query/overview#basic-usage)

## TODOs

1. Extend Readme
1. Add code documentation and examples
1. Remove peer-dependencies from axios-observable and luxon
