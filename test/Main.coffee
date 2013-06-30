chai = require 'chai'
sinon = require 'sinon'
sinonChai = require 'sinon-chai'

assert = chai.assert
expect = chai.expect
should = chai.should()
chai.use sinonChai

suite 'Main', ->
    require '../static/js/Main'

    test 'start', ->
        App.should.have.property 'start'

