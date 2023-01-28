# OpenAPI Mock Server

A very simple mock API server from an OpenAPI document. 

Endpoints and example response content are parsed from an OpenAPI document and served via Express.

Optionally, `json-schema-faker` can be used to generate example responses with fake data based on the schemas in the OpenAPI document.

## Installation

```
npm install
```

## Start server

Start server with a path to an OpenAPI file.

```
node server.js ./path/to/some/openapi.yaml
```

(or the url to an OpenAPI document)

```
node server.js http://some.site/openapi.yaml
```

Make API requests to the mock server `http://localhost:3000/...`

### Start server with different port

Set the port in the environment

```
PORT=3001 node server.js ./path/to/some/openapi.yaml
```

## Respones

### Static Examples (from document)

If an endpoint exists in the document but does the not have any "examples", an empty response body will be returned.

If there are multiple examples in the document, the first example for endpoint will be returned by default.

A random example can be returned by setting `RANDOMIZE_EXAMPLES` to true in the environment.

```
RANDOMIZE_EXAMPLES=true node server.js ./path/to/some/openapi.yaml
```

A specfic example can be returned by setting an `EXAMPLE_NAME` in the environment.

```
EXAMPLE_NAME=pet_example_1 node server.js ./path/to/some/openapi.yaml
```
(In the example above, for every endpoint if a `pet_example_1` exists in the examples for an endpoint in the document it will be returned. An error will be thrown when there is not a `pet_example_1` in the examples for an endpoint.)

### Fake Examples (generated)

To generate fake examples set `FAKE` to true in the environment.

This ignores the examples in the document and uses `json-schema-faker` to generate fake examples from the schemas in document.

```
FAKE=true node server.js ./path/to/some/openapi.yaml
```

#### Deterministic responses

By default a different fake response is returned on every request. To have the same fake response returned for a url set `DETERMINISTIC` to true in the environment.

```
FAKE=true DETERMINSTIC=true node server.js ./path/to/some/openapi.yaml
```

To return the same responses between server lifecycles set a `SEED` in the environment.

```
FAKE=true DETERMINSTIC=true SEED=123456789 node server.js ./path/to/some/openapi.yaml
```

## Response types

By default the first response in the document for an endpoint will be returned. 

(This will have the HTTP status of the first response in the "responses" for the endpoint.)

To only return specific HTTP response types set the `STATUS_CODE` in the environment.

```
STATUS_CODE=403 node server.js ./path/to/some/openapi.yaml
```

## Content

By default the first "content" for an endpoint in the document will be used.

To specify a different content in the document to use set `CONTENT` in the environment.

```
CONTENT=application/problem+json node server.js ./path/to/some/openapi.yaml
```

Note: 

Specifying `CONTENT` in the environment will use the examples in the document for the specified "content". 

However, all repsonses will still be sent with `application/json` in header, and the response examples in the document will be attempted to be converted to json with `JSON.stringfy()`.
