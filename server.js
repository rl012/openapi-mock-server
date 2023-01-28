(async () => {
  const RANDOMIZE_EXAMPLES = process.env.RANDOMIZE_EXAMPLES || false
  const EXAMPLE_NAME = process.env.EXAMPLE_NAME
  const STATUS_CODE = process.env.STATUS_CODE
  const CONTENT = process.env.CONTENT
  const SEED = process.env.SEED
  const FAKE = process.env.FAKE || false
  const DETERMINISTIC = process.env.DETERMINISTIC || false

  const oasFile = process.argv[2]

  if (!oasFile) {
    throw new Error(`You must specify the path to the OpenAPI document to use.`)
  }

  const OpenAPIParser = require("@readme/openapi-parser")
  const oas = await OpenAPIParser.dereference(oasFile)

  const { JSONSchemaFaker } = require("json-schema-faker")

  const seedrandom = require('seedrandom')
  const randomNumberGenerator = seedrandom()
  const seed = SEED || randomNumberGenerator().toString().substring(2)

  if (DETERMINISTIC) {
    console.log(`Using seed: ${seed}`)
  }

  const express = require('express')
  const app = express()
  const port = process.env.PORT || 3000

  if (oas.paths) {
    for (const [oasPathPattern, oasPathObject] of Object.entries(oas.paths)) {
      const serverPath = oasPathPattern.replace('{', ':').replace('}', '')

      for (const [httpMethod, oasOperationObject] of Object.entries(oasPathObject)) {
        const allowedHttpMethods = ['checkout', 'copy', 'delete', 'get', 'head', 'lock', 'merge', 'mkactivity', 'mkcol', 'move', 'm-search', 'notify', 'options', 'patch', 'post', 'purge', 'put', 'report', 'search', 'subscribe', 'trace', 'unlock', 'unsubscribe']
        
        if (!allowedHttpMethods.includes(httpMethod)) {
          continue
        }

        if (!oasOperationObject.responses) {
          return console.warn(`WARNING: No "responses" for "${oasPathPattern}"`)
        }

        if (oasOperationObject.responses && STATUS_CODE && !oasOperationObject.responses[`${STATUS_CODE}`]) {
          console.warn(`WARNING: No '${STATUS_CODE}' response for ${httpMethod.toUpperCase()} "${oasPathPattern}"`)
        }

        app[httpMethod](serverPath, (req, res) => {
          if (!oasOperationObject.responses) {
            throw new Error(`No "responses" for "${oasPathPattern}" in OpenAPI document.`)
          }

          if (STATUS_CODE && !oasOperationObject.responses[`${STATUS_CODE}`]) {
            throw new Error(`No '${STATUS_CODE}' response for ${httpMethod.toUpperCase()} "${oasPathPattern}"`)
          }

          const statusCode = STATUS_CODE || Object.keys(oasOperationObject.responses)[0]
          const oasResponseObject = oasOperationObject.responses[`${statusCode}`]

          if (CONTENT && !oasResponseObject?.content[CONTENT]) {
            throw new Error(`No "${CONTENT}" for ${httpMethod.toUpperCase()} "${oasPathPattern}" in OpenAPI document.`)
          }

          const content = CONTENT || Object.keys(oasResponseObject.content)[0]
          
          const status = Number(statusCode.replaceAll('x', 00))
          res.status(status)

          if (FAKE) {
            const schema = oasResponseObject.content[content].schema

            if (DETERMINISTIC) {
              const deterministicSeed = req.url + seed

              JSONSchemaFaker.option({
                random: seedrandom(deterministicSeed)
              })
            }

            const sample = JSONSchemaFaker.generate(schema)
            const responseBody = JSON.stringify(sample)
            res.setHeader('content-type', 'application/json')
            res.send(responseBody)
            return
          }

          const oasExamples = oasResponseObject.content[content].examples

          if (EXAMPLE_NAME && (!oasExamples || !oasExamples.haswOwnProperty(EXAMPLE_NAME))) {
            throw new Error(`No example "${EXAMPLE_NAME}" for ${httpMethod.toUpperCase()} "${oasPathPattern}" in OpenAPI document.`)
          }

          if (oasExamples && Object.keys(oasExamples).length > 0) {
            const exampleName = (() => {
              if (EXAMPLE_NAME) {
                return EXAMPLE_NAME
              }

              if (RANDOMIZE_EXAMPLES) {
                const keys = Object.keys(oasExamples)
                const name = keys[Math.floor(randomNumberGenerator()*keys.length)]
                console.log(`Using example: ${name}`)
                return name
              }

              return Object.keys(oasExamples)[0]
            })()

            const exampleValue = oasExamples[exampleName].value
            const responseBody = JSON.stringify(exampleValue)
            res.setHeader('content-type', 'application/json')
            res.send(responseBody)
            return
          }

          console.warn(`No examples for ${httpMethod.toUpperCase()} "${oasPathPattern}" "${CONTENT}" in OpenAPI document.`)
          res.header('Warning', 'No examples in OpenAPI document')
          res.send('')
          return
        })
      }
    }
  }

  app.disable('etag')

  app.listen(port, () => {
    console.log(`Mock server listening on port ${port}`)
  })
})()
