# RTK Query Entity API

Wrapper utilities for CRUD operations in REST APIs entities using [RTK Query](https://redux-toolkit.js.org/rtk-query/overview).

## Getting started

1. Install the package:

```sh
npm i @ronas-it/rtkq-entity-api
```

If your app uses `axios-observable`, install it along with `rxjs`:

```sh
npm i axios-observable rxjs
```

Note that support of `axios-observable` will be removed in upcoming major release.

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

3. Describe your entity class by extending `BaseEntity`:

```ts
import { BaseEntity } from '@ronas-it/rtkq-entity-api';

export class User extends BaseEntity {
  name: string;

  @Expose({ name: 'phone_number' }) // APIs support of class-trasformer decorators
  phoneNumber: string;

  constructor(model: Partial<User>) {
    super(model);
    Object.assign(this, model);
  }
}
```

4. Generate your entity API with this creator:

```ts
import { createEntityApi } from '@ronas-it/rtkq-entity-api';
import { createAppApi } from 'your-project/utils';
import { User, UserEntityRequest, UserSearchRequest } from 'your-project/models';

export const usersApi = createEntityApi({
  // Mandatory params
  entityName: 'user', // An entity name. Must by unique
  entityConstructor: User, // The entity model class constructor defined above
  baseEndpoint: '/users', // Endpoint, relative to base URL configured in the API creator
  // Optional params
  baseApiCreator: createAppApi, // The APIs creator from above that shares configuration for new APIs
  omitEndpoints: ['create', 'update', 'delete'], // Array to specify unimplemented endpoints
  entityGetRequestConstructor: UserEntityRequest // Request constructor for 'get' endpoint. Defaults to EntityRequest
  entitySearchRequestConstructor: UserSearchRequest, // Request constructor for 'search' endpoint. Defaults to PaginationRequest
});
```

5. Done! Now you can use the api you created as usual one [created by RTK Query](https://redux-toolkit.js.org/rtk-query/overview#basic-usage).

## Overview

APIs created by `createEntityApi` behave as usual ones created by `createApi` from [RTK Query](https://redux-toolkit.js.org/rtk-query/overview#basic-usage). Below is the overview of endpoints and utils they provide.

### Endpoints

Generated entity APIs provide the following [endpoints](https://redux-toolkit.js.org/rtk-query/api/created-api/overview#endpoints):

1. `create` - this mutation performs a `POST /{baseEndpoint}` request to create an entity.
   Accepts `Partial` data of entity instance you passed in `entityConstructor` when calling `createEntityApi`.

2. `get` - query that requests `GET /{baseEndpoint}/{id}` to fetch single entity data.
   Can accept optional request params which implements `EntityRequest` instance. Request shape can be extended by `entityGetRequestConstructor` property in `createEntityApi`.

3. `search` - a query that requests `GET /{baseEndpoint}` to get entities list with pagination. Accepts request params described by `PaginationRequest` and returns `PaginationResponse`. Both classes can be extended to define your onw structure using `entitySearchRequestConstructor` and `entitySearchResponseConstructor` in `createEntityApi`.

4. `searchInfinite` - this query behaves similar to `search`, but accumulates data from newly requested pages.
   This query can be used with `useSearchInfiniteQuery` hook to implement infinite scrolling lists. It supports loading
   data in both directions using `fetchNextPage` and `fetchPreviousPage` callbacks, and provides other useful props.

5. `update` - this mutation performs `PUT /{baseEndpoint}/{id}` request to update entity data.
   Accepts `Partial` data of entity instance with mandatory `id`.
   By default successful call of `update` mutation
   for some entity will patch it's state in all queries where it presented. No further refetch needed.
   State patch is done my simple `merge` existing data with updated one.

6. `delete` - a mutation that deletes entities using `DELETE/{baseEndpoint}/{id}` request.
   Accepts entity ID to delete. On success this mutation will remove the entity from all
   queries where it was presented without refetching them.

### Utils

In addition to [existing RTKQ utils](https://redux-toolkit.js.org/rtk-query/api/created-api/api-slice-utils),
API instances created by `createEntityApi` have the following utils in `yourApi.util`:

1. `fetchEntity` - util fetches single entity data using `GET /{baseEndpoint}/{id}` with optional params.
   Maybe useful in combination with other utils when customizing [onQueryStarted](https://redux-toolkit.js.org/rtk-query/api/createApi#onquerystarted) behavior. Example:

```ts
// In some mutation in 'someItemApi':
async onQueryStarted(_, { queryFulfilled, dispatch }) {
  // Wait for mutation to success:
  const { data: createdEntity } = await queryFulfilled;

  // Fetch extended entity data:
  const someExtendedRequest = { id: createdEntity.id, relations: ['photos'] };
  const fullEntity = await someItemApi.util.fetchEntity(
    createdEntity.id,
    someExtendedRequest,
    { dispatch }
  );

  // Prefill 'get' query for certain params:
  someItemApi.util.upsertQueryData('get', someExtendedRequest, fullEntity);
}
```

2. `patchEntityQueries` - this util accepts partial entity data in the first argument. Useful when you need
   to patch data of some entity in all queries it is presented.

```ts
// Some `markAsFavorite` mutation in some `someItemApi`:
markAsFavorite: builder.mutation<void, number>({
  query: (id) => ({
    method: 'put',
    url: `items/${id}/favorite`
  }),
  async onQueryStarted(id, apiLifecycle}) {
    // Perform optimistic entity state patch:
    await someItemApi.util.patchEntityQueries(
      { id, isFavorite: true }, // Change `isFavorite` in all occurrences entity in
      apiLifecycle,
      {
        shouldRefetchEntity: false, // Configure whether entity data should be refetched before patch
        tags: [{ type: 'item', id: 'favorites' }] // Optionally, pass custom tags of queries to patch
      }
    );
  }
})
```

3. `clearEntityQueries` - this util can be used to remove some entity data from queries it is presented.
   Can be useful to perform pessimistic/optimistic delete. Example of use:

```ts
// Some `removeFromFavorite` mutation in some `someItemApi`:
removeFromFavorite: builder.mutation<void, number>({
  query: (id) => ({
    method: 'delete',
    url: `items/${id}/favorite`
  }),
  async onQueryStarted(id, apiLifecycle}) {
    // Wait for mutation to success
    await apiLifecycle.queryFulfilled;

    // Perform optimistic entity state patch:
    await someItemApi.util.clearEntityQueries(
      id, // Item ID that was affected
      apiLifecycle,
      {
        tags: [{ type: 'item', id: 'favorites' }] // Remove entity from favorite lists
      }
    );
  }
})
```

4. `handleEntityUpdate` - this util uses `patchEntityQueries` under hood and intended to be used in [onQueryStarted](https://redux-toolkit.js.org/rtk-query/api/createApi#onquerystarted) callback to perform optimistic/pessimistic
   update of entity data in queries connected by tags. Example:

```ts
// Some `markAsFavorite` mutation in some `someItemApi`:
markAsFavorite: builder.mutation<void, number>({
  query: (id) => ({
    method: 'put',
    url: `items/${id}/favorite`
  }),
  async onQueryStarted(id, apiLifecycle}) {
    // Perform optimistic entity update:
    await someItemApi.util.handleEntityUpdate({ id, isFavorite: true }, apiLifecycle, { optimistic: true });

    // Or perform pessimistic entity update for specific tags:
    await someItemApi.util.handleEntityUpdate({ id, isFavorite: true }, apiLifecycle);
  }
})
```

5. `handleEntityDelete` - this util uses `clearEntityQueries` internally and intended to be used in [onQueryStarted](https://redux-toolkit.js.org/rtk-query/api/createApi#onquerystarted) callback to perform optimistic/pessimistic
   entity delete from `search`-like queries connected by tags. Example:

```ts
// Some `removeFromFavorite` mutation in some `someItemApi`:
removeFromFavorite: builder.mutation<void, number>({
  query: (id) => ({
    method: 'delete',
    url: `items/${id}/favorite`
  }),
  async onQueryStarted(id, apiLifecycle}) {
    // Perform optimistic entity delete:
    await someItemApi.util.handleEntityDelete(arg, apiLifecycle, { optimistic: true });
    // Perform delete pessimistically for specific tags:
    await someItemApi.util.handleEntityDelete(arg, apiLifecycle, { tags: [{ type: 'item', id: 'favorites' }] });
  }
})
```

### Store Utils

1. `createStoreInitializer` - this util is used for creating the application's `initStore`. It takes as arguments: `rootReducer`, `middlewares`(array), and `enhancers`(array).
   This util also contains a helper type `AppStateFromRootReducer<TRootReducer>` for creating the type `AppState`.
   Example:

```ts
// Create the AppState type with the help of AppStateFromRootReducer
export type AppState = AppStateFromRootReducer<typeof rootReducer>;

// Root reducer - an object with the app's different reducers
const rootReducer = {
  [authApi.reducerPath]: authApi.reducer,
};

// Array of the app's middlewares
const middlewares = [authApi.middleware];

export const initStore = createStoreInitializer({
  rootReducer: rootReducer as unknown as Reducer<AppState>,
  middlewares,
  // Array of the app's enhancers
  enhancers: [...reactotronEnhancer],
});

export const store = initStore();
```

2. `StoreActions.init` - a Redux action created for performing actions at the start of the application's lifecycle. It is called in the main application component `App`:

```ts
function App(): ReactElement {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(StoreActions.init());
  }, []);

  return (
    <Stack>
      <Stack.Screen name='index' options={{ headerShown: false }} />
    </Stack>
  );
}
```

And then it is used in some middleware:

```ts
userSettingsListenerMiddleware.startListening({
  actionCreator: StoreActions.init,
  effect: async (_, { dispatch }) => {
    const language = await appStorageService.language.get();

    language && dispatch(userSettingsActions.setSystemLanguage(language as LanguageCode));
  },
});
```
