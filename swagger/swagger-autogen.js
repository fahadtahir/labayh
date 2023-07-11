const swaggerAutogen = require('swagger-autogen')()

const outputFile = './swagger_output.json'
const endpointsFiles = ['../index.js','../auth/login','../routes/restaurant']

swaggerAutogen(outputFile, endpointsFiles)