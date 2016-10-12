var express = require('express');
var router = express.Router();
var elasticsearch = require('elasticsearch');
var neo4j = require('neo4j');
var neo4jDriver = require('neo4j-driver').v1;
var driver = neo4jDriver.driver("bolt://localhost");
var client = new elasticsearch.Client({
  host: 'localhost:9200',

  apiVersion: '1.0'
});

var db = new neo4j.GraphDatabase('http://localhost:7474');
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});
var getSuggestions = function (input) {
  return client.suggest({
    index: "bands",
    type: "band",
    body: {
      suggest: {
        text: input,
        completion: {
          field: "suggest"
        }
      }
    }
  })
}
router.post('/autocomplete', function (req, res, next) {
  console.log(req);
  var text = req.body.text;
  getSuggestions(text).then(response => {
    console.log(response.suggest[0].options);

    res.json({
      suggestions: response.suggest[0].options.map(opt => opt.text)
    })
  })
    .catch((err) => res.json(err));

});
 var session = driver.session();

router.post('/sixdegrees', function (req, res, next) {
  console.log(req);
  var a = req.body.a;
  var b = req.body.b;
 
  // Run a Cypher statement, reading the result in a streaming manner as records arrive:
  session
    .run(`MATCH p=shortestPath( (a:Band {value:"${a}"})-[*]-(b:Band {value:"${b}"}) ) RETURN p`)
    .then(function (result) {        
       res.json(result)
    })
    .catch(function (error) {
      console.log(error);
      res.json(error);
    });

});
module.exports = router;
